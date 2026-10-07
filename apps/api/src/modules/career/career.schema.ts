import { z } from "zod";

/**
 * Single source of truth for the LLM's output shape.
 *
 * Both drivers derive from this: the `claude` CLI gets `z.toJSONSchema(...)`
 * passed to `--json-schema`, and the Anthropic SDK path hands the zod object to
 * `zodOutputFormat()`. Keeping one definition means the two drivers cannot
 * drift apart.
 */
export const CareerSynthesisSchema = z
  .object({
    headline: z
      .string()
      .describe(
        "One line positioning the developer, e.g. 'Full-stack TypeScript engineer with two years building auth, integrations and dashboards'. No fluff, no superlatives.",
      ),

    summary: z
      .string()
      .describe(
        "Three to five sentences for the top of a CV. Concrete: what they build, in what stack, at what scale. Only facts supported by the evidence.",
      ),

    seniority_signals: z
      .array(z.string())
      .max(6)
      .describe(
        "Observable signals of scope and seniority drawn from the evidence (owning a system end to end, migrations, infra work, breadth across repos). Each must cite what it is based on.",
      ),

    skills: z
      .object({
        languages: z.array(z.string()).max(12),
        frameworks: z.array(z.string()).max(16),
        infrastructure: z.array(z.string()).max(12),
        practices: z.array(z.string()).max(10),
      })
      .describe(
        "CV skills section, ordered strongest first. Only include a skill the evidence supports.",
      ),

    projects: z
      .array(
        z.object({
          repo: z.string().describe("The nameWithOwner exactly as given."),
          title: z
            .string()
            .describe("A readable project name, not the raw repo slug."),
          what_it_is: z
            .string()
            .describe("One or two sentences on what the project does."),
          your_role: z
            .string()
            .describe(
              "What the developer actually did here, inferred from their commits only.",
            ),
          tech: z.array(z.string()).max(12),
          highlights: z
            .array(z.string())
            .max(6)
            .describe("Specific things built or solved, grounded in commits."),
          resume_bullets: z
            .array(z.string())
            .max(4)
            .describe(
              "Paste-ready CV bullets. Strong verb first, specific, no invented metrics.",
            ),
        }),
      )
      .max(10)
      .describe("Most significant projects first, judged by depth of work."),

    feature_themes: z
      .array(
        z.object({
          theme: z
            .string()
            .describe("e.g. 'Authentication & authorisation', 'Third-party API integration'."),
          description: z
            .string()
            .describe("What the developer repeatedly built in this area."),
          evidence_repos: z.array(z.string()).max(10),
        }),
      )
      .max(10)
      .describe(
        "Cross-cutting capabilities proven across repositories — the answer to 'what features have I built'.",
      ),

    impact: z
      .array(
        z.object({
          claim: z
            .string()
            .describe("A defensible statement of impact the developer can say in an interview."),
          evidence: z
            .string()
            .describe(
              "The specific commits, repos or numbers from the evidence that back the claim.",
            ),
        }),
      )
      .max(8)
      .describe(
        "Every claim must be traceable to supplied evidence. Never invent users, revenue, latency or percentages.",
      ),

    portfolio_pitch: z
      .string()
      .describe(
        "A short paragraph for a portfolio landing page or LinkedIn About section. First person, plain language.",
      ),

    gaps: z
      .array(z.string())
      .max(6)
      .describe(
        "Honest gaps visible in the evidence (e.g. little test coverage, no infra work) and what to build next to close them. This is for the developer's own planning.",
      ),
  })
  .strict();

export type CareerSynthesis = z.infer<typeof CareerSynthesisSchema>;

/** JSON Schema form for the `claude --json-schema` driver. */
export function synthesisJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(CareerSynthesisSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}
