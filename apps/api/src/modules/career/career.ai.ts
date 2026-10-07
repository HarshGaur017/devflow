import { execFile } from "node:child_process";
import os from "node:os";

import type { CareerStatsDto } from "./career.dto.js";
import {
  CareerSynthesisSchema,
  synthesisJsonSchema,
  type CareerSynthesis,
} from "./career.schema.js";
import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisPrompt } from "./career.prompt.js";
import type { Commit } from "./career.types.js";

export type AiDriver = "claude-cli" | "anthropic-api" | "none";

const MODEL = "claude-opus-5-5";

/** Synthesis over a two-year commit log is a long single call. */
const CLI_TIMEOUT_MS = 10 * 60 * 1000;
const CLI_MAX_BUFFER = 64 * 1024 * 1024;

export interface SynthesisResult {
  driver: AiDriver;
  synthesis: CareerSynthesis | null;
  /** Set when the driver ran but could not produce a result. */
  warning?: string;
}

/**
 * Which summarisation driver to use.
 *
 * `claude-cli` is the default because it authenticates through the Claude Code
 * login already on the machine — a Claude subscription is enough, no API key.
 * It therefore only works where the API process runs on a machine with that
 * login (local development). A deployed instance needs `anthropic-api`.
 */
export function resolveDriver(): AiDriver {
  const configured = process.env.CAREER_AI_DRIVER?.trim();

  if (configured === "claude-cli" || configured === "anthropic-api" || configured === "none") {
    return configured;
  }

  if (process.env.ANTHROPIC_API_KEY) return "anthropic-api";

  return "claude-cli";
}

interface ClaudeCliResult {
  is_error?: boolean;
  subtype?: string;
  result?: string;
  structured_output?: unknown;
  total_cost_usd?: number;
}

function runClaudeCli(prompt: string): Promise<ClaudeCliResult> {
  const binary = process.env.CAREER_CLAUDE_BIN?.trim() || "claude";

  const args = [
    "-p",
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(synthesisJsonSchema()),
    // No tools: this is a pure text-in, JSON-out call.
    "--tools",
    "",
    "--strict-mcp-config",
    // Ignore user/project/local settings and hooks so the summary cannot be
    // influenced by whatever the machine has configured for interactive use.
    "--restricted",
    "--model",
    MODEL,
    "--system-prompt",
    SYNTHESIS_SYSTEM_PROMPT,
  ];

  return new Promise((resolve, reject) => {
    const child = execFile(
      binary,
      args,
      {
        // Run outside the repository so no CLAUDE.md is auto-discovered.
        cwd: os.tmpdir(),
        timeout: CLI_TIMEOUT_MS,
        maxBuffer: CLI_MAX_BUFFER,
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr?.trim() || error.message;

          if ("code" in error && error.code === "ENOENT") {
            reject(
              new Error(
                `Could not run '${binary}'. Install Claude Code and make sure it is on the API process PATH, or set CAREER_AI_DRIVER=anthropic-api with an ANTHROPIC_API_KEY.`,
              ),
            );
            return;
          }

          reject(new Error(`claude CLI failed: ${detail.slice(0, 500)}`));
          return;
        }

        try {
          resolve(JSON.parse(stdout) as ClaudeCliResult);
        } catch {
          reject(
            new Error(`claude CLI returned non-JSON output: ${stdout.slice(0, 300)}`),
          );
        }
      },
    );

    child.stdin?.end(prompt);
  });
}

async function synthesizeWithCli(prompt: string): Promise<SynthesisResult> {
  const result = await runClaudeCli(prompt);

  if (result.is_error) {
    throw new Error(
      `claude CLI reported an error (${result.subtype ?? "unknown"}): ${String(result.result ?? "").slice(0, 300)}`,
    );
  }

  // Prefer the pre-parsed structured output; fall back to parsing `result`.
  const candidate =
    result.structured_output ??
    (typeof result.result === "string" ? safeJsonParse(result.result) : null);

  const parsed = CareerSynthesisSchema.safeParse(candidate);

  if (!parsed.success) {
    return {
      driver: "claude-cli",
      synthesis: null,
      warning: `The model's output did not match the expected shape: ${parsed.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    };
  }

  return { driver: "claude-cli", synthesis: parsed.data };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Minimal shape of the bits of the Anthropic SDK this module touches. Declared
 * locally so the project type-checks without the optional package installed.
 */
interface AnthropicParseResponse {
  stop_reason: string | null;
  stop_details?: { category?: string | null } | null;
  parsed_output?: CareerSynthesis | null;
}

interface AnthropicClient {
  messages: {
    parse(body: Record<string, unknown>): Promise<AnthropicParseResponse>;
  };
}

/**
 * API-key path, for a deployed instance where no Claude Code login exists.
 *
 * `@anthropic-ai/sdk` is an optional dependency: the specifier is assembled at
 * runtime so this file compiles whether or not the package is installed.
 * Install it with: pnpm --filter @repo/api add @anthropic-ai/sdk
 */
async function synthesizeWithApi(prompt: string): Promise<SynthesisResult> {
  const packageName = ["@anthropic-ai", "sdk"].join("/");

  let AnthropicCtor: new () => AnthropicClient;
  let zodOutputFormat: (schema: unknown) => unknown;

  try {
    const sdk = await import(packageName);
    const helpers = await import(`${packageName}/helpers/zod`);

    AnthropicCtor = sdk.default as new () => AnthropicClient;
    zodOutputFormat = helpers.zodOutputFormat as (schema: unknown) => unknown;
  } catch {
    throw new Error(
      `CAREER_AI_DRIVER=anthropic-api needs the optional dependency '${packageName}'. Install it with: pnpm --filter @repo/api add ${packageName}`,
    );
  }

  const client = new AnthropicCtor();

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 32000,
    system: SYNTHESIS_SYSTEM_PROMPT,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: zodOutputFormat(CareerSynthesisSchema),
    },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(
      `The model declined to produce a summary (${response.stop_details?.category ?? "unspecified"}).`,
    );
  }

  if (!response.parsed_output) {
    return {
      driver: "anthropic-api",
      synthesis: null,
      warning: "The model returned output that could not be parsed against the schema.",
    };
  }

  return { driver: "anthropic-api", synthesis: response.parsed_output };
}

/**
 * Turn the deterministic stats plus the commit log into CV material.
 * Never throws for a missing driver — the stats half of the report still
 * stands on its own, so a synthesis failure degrades rather than fails.
 */
export async function synthesizeCareerReport(
  stats: CareerStatsDto,
  commits: Commit[],
  viewer: { login: string; name: string | null },
): Promise<SynthesisResult> {
  const driver = resolveDriver();

  if (driver === "none") {
    return {
      driver: "none",
      synthesis: null,
      warning:
        "AI summarisation is turned off (CAREER_AI_DRIVER=none). The statistics below are complete.",
    };
  }

  const prompt = buildSynthesisPrompt(stats, commits, viewer);

  try {
    return driver === "claude-cli"
      ? await synthesizeWithCli(prompt)
      : await synthesizeWithApi(prompt);
  } catch (error) {
    return {
      driver,
      synthesis: null,
      warning: error instanceof Error ? error.message : String(error),
    };
  }
}
