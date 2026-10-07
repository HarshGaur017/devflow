import type { DetectedTech, RepoTreeEntry, TechCategory } from "./career.types.js";

/**
 * Tech-stack detection. Two passes, both pure:
 *   1. file paths from the recursive tree (frameworks, CI, infra, test setup)
 *   2. dependency names from whichever manifests the tree revealed
 *
 * Deliberately conservative: a name only lands in the report when a file or a
 * declared dependency proves it, because these strings end up on a CV.
 */

interface PathRule {
  /** Matched against the lowercased repo-relative path. */
  test: RegExp;
  name: string;
  category: TechCategory;
}

const PATH_RULES: PathRule[] = [
  // Manifests / ecosystems
  { test: /(^|\/)package\.json$/, name: "Node.js", category: "language" },
  { test: /(^|\/)requirements\.txt$/, name: "Python", category: "language" },
  { test: /(^|\/)pyproject\.toml$/, name: "Python", category: "language" },
  { test: /(^|\/)go\.mod$/, name: "Go", category: "language" },
  { test: /(^|\/)cargo\.toml$/, name: "Rust", category: "language" },
  { test: /(^|\/)pom\.xml$/, name: "Maven", category: "tooling" },
  { test: /(^|\/)build\.gradle(\.kts)?$/, name: "Gradle", category: "tooling" },
  { test: /(^|\/)gemfile$/, name: "Ruby", category: "language" },
  { test: /(^|\/)composer\.json$/, name: "PHP", category: "language" },
  { test: /\.csproj$/, name: ".NET", category: "framework" },

  // Frontend frameworks / config files
  { test: /(^|\/)next\.config\.(js|ts|mjs|cjs)$/, name: "Next.js", category: "framework" },
  { test: /(^|\/)nuxt\.config\.(js|ts)$/, name: "Nuxt", category: "framework" },
  { test: /(^|\/)svelte\.config\.(js|ts)$/, name: "Svelte", category: "framework" },
  { test: /(^|\/)angular\.json$/, name: "Angular", category: "framework" },
  { test: /(^|\/)vite\.config\.(js|ts)$/, name: "Vite", category: "tooling" },
  { test: /(^|\/)tailwind\.config\.(js|ts|mjs|cjs)$/, name: "Tailwind CSS", category: "library" },
  { test: /(^|\/)expo\.json$|(^|\/)app\.json$/, name: "Expo", category: "framework" },

  // Backend / data
  { test: /(^|\/)prisma\/schema\.prisma$/, name: "Prisma", category: "library" },
  { test: /(^|\/)schema\.prisma$/, name: "Prisma", category: "library" },
  { test: /(^|\/)manage\.py$/, name: "Django", category: "framework" },
  { test: /(^|\/)artisan$/, name: "Laravel", category: "framework" },
  { test: /(^|\/)config\/routes\.rb$/, name: "Ruby on Rails", category: "framework" },
  { test: /(^|\/)migrations?\//, name: "Database migrations", category: "practice" },
  { test: /\.proto$/, name: "gRPC / Protobuf", category: "library" },
  { test: /(^|\/)schema\.graphql$/, name: "GraphQL", category: "library" },

  // Infrastructure
  { test: /(^|\/)dockerfile$/, name: "Docker", category: "infrastructure" },
  { test: /(^|\/)docker-compose\.ya?ml$/, name: "Docker Compose", category: "infrastructure" },
  { test: /\.tf$/, name: "Terraform", category: "infrastructure" },
  { test: /(^|\/)chart\.ya?ml$/, name: "Helm", category: "infrastructure" },
  { test: /(^|\/)k8s\/|(^|\/)kubernetes\//, name: "Kubernetes", category: "infrastructure" },
  { test: /(^|\/)serverless\.ya?ml$/, name: "Serverless Framework", category: "infrastructure" },
  { test: /(^|\/)vercel\.json$/, name: "Vercel", category: "infrastructure" },
  { test: /(^|\/)netlify\.toml$/, name: "Netlify", category: "infrastructure" },
  { test: /(^|\/)fly\.toml$/, name: "Fly.io", category: "infrastructure" },
  { test: /(^|\/)\.ebextensions\//, name: "AWS Elastic Beanstalk", category: "infrastructure" },
  { test: /(^|\/)template\.ya?ml$/, name: "AWS SAM", category: "infrastructure" },

  // CI / tooling / practice
  { test: /(^|\/)\.github\/workflows\//, name: "GitHub Actions", category: "practice" },
  { test: /(^|\/)\.gitlab-ci\.ya?ml$/, name: "GitLab CI", category: "practice" },
  { test: /(^|\/)jenkinsfile$/, name: "Jenkins", category: "practice" },
  { test: /(^|\/)turbo\.json$/, name: "Turborepo", category: "tooling" },
  { test: /(^|\/)nx\.json$/, name: "Nx", category: "tooling" },
  { test: /(^|\/)pnpm-workspace\.ya?ml$/, name: "pnpm workspaces", category: "tooling" },
  { test: /(^|\/)makefile$/, name: "Make", category: "tooling" },
  { test: /(^|\/)\.pre-commit-config\.ya?ml$/, name: "pre-commit", category: "practice" },

  // Testing
  { test: /(^|\/)jest\.config\.(js|ts|mjs|cjs|json)$/, name: "Jest", category: "testing" },
  { test: /(^|\/)vitest\.config\.(js|ts)$/, name: "Vitest", category: "testing" },
  { test: /(^|\/)playwright\.config\.(js|ts)$/, name: "Playwright", category: "testing" },
  { test: /(^|\/)cypress\.config\.(js|ts)$|(^|\/)cypress\//, name: "Cypress", category: "testing" },
  { test: /(^|\/)pytest\.ini$|(^|\/)conftest\.py$/, name: "pytest", category: "testing" },

  // Notebooks / ML
  { test: /\.ipynb$/, name: "Jupyter", category: "tooling" },
];

/** Dependency name (exact or prefix) -> reported technology. */
interface DepRule {
  match: (dep: string) => boolean;
  name: string;
  category: TechCategory;
}

function exact(...names: string[]): (dep: string) => boolean {
  const set = new Set(names);
  return (dep) => set.has(dep);
}

function prefix(...prefixes: string[]): (dep: string) => boolean {
  return (dep) => prefixes.some((p) => dep === p || dep.startsWith(p));
}

const DEP_RULES: DepRule[] = [
  // JS/TS frontend
  { match: exact("react", "react-dom"), name: "React", category: "framework" },
  { match: exact("next"), name: "Next.js", category: "framework" },
  { match: exact("vue"), name: "Vue", category: "framework" },
  { match: exact("svelte", "@sveltejs/kit"), name: "Svelte", category: "framework" },
  { match: prefix("@angular/"), name: "Angular", category: "framework" },
  { match: exact("react-native"), name: "React Native", category: "framework" },
  { match: exact("redux", "@reduxjs/toolkit"), name: "Redux", category: "library" },
  { match: exact("zustand"), name: "Zustand", category: "library" },
  { match: prefix("@tanstack/react-query", "react-query"), name: "React Query", category: "library" },
  { match: exact("tailwindcss"), name: "Tailwind CSS", category: "library" },
  { match: exact("framer-motion"), name: "Framer Motion", category: "library" },
  { match: exact("react-hook-form", "formik"), name: "React Hook Form", category: "library" },
  { match: exact("zod", "yup", "joi"), name: "Schema validation (zod/yup)", category: "library" },
  { match: prefix("@mui/", "antd", "@chakra-ui/"), name: "Component library (MUI/Chakra/AntD)", category: "library" },

  // JS/TS backend
  { match: exact("express"), name: "Express", category: "framework" },
  { match: exact("fastify"), name: "Fastify", category: "framework" },
  { match: prefix("@nestjs/"), name: "NestJS", category: "framework" },
  { match: exact("koa", "hapi"), name: "Koa/Hapi", category: "framework" },
  { match: exact("socket.io", "ws"), name: "WebSockets", category: "library" },
  { match: prefix("@trpc/"), name: "tRPC", category: "library" },
  { match: exact("graphql", "apollo-server", "@apollo/server"), name: "GraphQL", category: "library" },
  { match: exact("bullmq", "bull", "agenda"), name: "BullMQ / job queues", category: "library" },
  { match: exact("passport", "next-auth", "jsonwebtoken"), name: "Auth (JWT/OAuth)", category: "practice" },
  { match: exact("helmet"), name: "Helmet", category: "library" },

  // Data stores / ORMs
  { match: prefix("@prisma/", "prisma"), name: "Prisma", category: "library" },
  { match: exact("typeorm", "sequelize", "knex", "drizzle-orm"), name: "SQL ORM/query builder", category: "library" },
  { match: exact("mongoose", "mongodb"), name: "MongoDB", category: "database" },
  { match: exact("pg", "postgres", "postgresql"), name: "PostgreSQL", category: "database" },
  { match: exact("mysql", "mysql2"), name: "MySQL", category: "database" },
  { match: exact("redis", "ioredis"), name: "Redis", category: "database" },
  { match: prefix("@elastic/elasticsearch"), name: "Elasticsearch", category: "database" },

  // Cloud / third-party
  { match: prefix("aws-sdk", "@aws-sdk/"), name: "AWS SDK", category: "infrastructure" },
  { match: prefix("firebase", "@firebase/"), name: "Firebase", category: "infrastructure" },
  { match: prefix("@supabase/"), name: "Supabase", category: "infrastructure" },
  { match: exact("stripe"), name: "Stripe", category: "library" },
  { match: prefix("@sentry/"), name: "Sentry", category: "practice" },
  { match: prefix("@opentelemetry/"), name: "OpenTelemetry", category: "practice" },
  { match: prefix("openai", "@anthropic-ai/", "langchain", "@langchain/"), name: "LLM / AI APIs", category: "library" },

  // JS testing / tooling
  { match: exact("jest", "ts-jest"), name: "Jest", category: "testing" },
  { match: exact("vitest"), name: "Vitest", category: "testing" },
  { match: prefix("@playwright/"), name: "Playwright", category: "testing" },
  { match: exact("cypress"), name: "Cypress", category: "testing" },
  { match: prefix("@testing-library/"), name: "Testing Library", category: "testing" },
  { match: exact("typescript"), name: "TypeScript", category: "language" },
  { match: exact("eslint", "prettier"), name: "ESLint / Prettier", category: "tooling" },
  { match: exact("turbo"), name: "Turborepo", category: "tooling" },
  { match: exact("webpack", "rollup", "esbuild"), name: "Bundlers", category: "tooling" },

  // Python
  { match: exact("django", "djangorestframework"), name: "Django", category: "framework" },
  { match: exact("flask"), name: "Flask", category: "framework" },
  { match: exact("fastapi"), name: "FastAPI", category: "framework" },
  { match: exact("sqlalchemy", "alembic"), name: "SQLAlchemy", category: "library" },
  { match: exact("celery"), name: "Celery", category: "library" },
  { match: exact("pandas", "numpy"), name: "pandas / NumPy", category: "library" },
  { match: exact("torch", "tensorflow", "keras"), name: "Deep learning (PyTorch/TF)", category: "library" },
  { match: exact("scikit-learn", "sklearn", "xgboost"), name: "scikit-learn", category: "library" },
  { match: exact("pytest"), name: "pytest", category: "testing" },
  { match: exact("boto3"), name: "AWS SDK", category: "infrastructure" },

  // Go / Rust / Java / PHP / Ruby
  { match: prefix("github.com/gin-gonic/gin"), name: "Gin", category: "framework" },
  { match: prefix("github.com/gofiber/fiber"), name: "Fiber", category: "framework" },
  { match: prefix("github.com/labstack/echo"), name: "Echo", category: "framework" },
  { match: prefix("gorm.io/gorm"), name: "GORM", category: "library" },
  { match: exact("actix-web"), name: "Actix Web", category: "framework" },
  { match: exact("axum"), name: "Axum", category: "framework" },
  { match: exact("tokio"), name: "Tokio", category: "library" },
  { match: prefix("org.springframework", "spring-boot"), name: "Spring Boot", category: "framework" },
  { match: prefix("org.hibernate"), name: "Hibernate", category: "library" },
  { match: prefix("laravel/"), name: "Laravel", category: "framework" },
  { match: prefix("symfony/"), name: "Symfony", category: "framework" },
  { match: exact("rails"), name: "Ruby on Rails", category: "framework" },
];

/** Manifest files worth downloading, in priority order. */
const MANIFEST_PATTERNS: RegExp[] = [
  /^package\.json$/,
  /^requirements\.txt$/,
  /^pyproject\.toml$/,
  /^go\.mod$/,
  /^Cargo\.toml$/,
  /^composer\.json$/,
  /^Gemfile$/,
  /^pom\.xml$/,
  /^build\.gradle(\.kts)?$/,
];

/** Pick the root-level manifests to fetch, plus a few from workspace folders. */
export function selectManifests(tree: RepoTreeEntry[], limit = 4): string[] {
  const files = tree.filter((entry) => entry.type === "blob").map((e) => e.path);

  const roots: string[] = [];
  for (const pattern of MANIFEST_PATTERNS) {
    const hit = files.find((path) => pattern.test(path));
    if (hit) roots.push(hit);
  }

  // Monorepos keep the interesting dependencies one level down.
  const nested = files.filter(
    (path) =>
      /^(apps|packages|services)\/[^/]+\/package\.json$/.test(path) ||
      /^(apps|packages|services)\/[^/]+\/(requirements\.txt|pyproject\.toml|go\.mod)$/.test(
        path,
      ),
  );

  return [...new Set([...roots, ...nested])].slice(0, limit);
}

export function detectFromTree(tree: RepoTreeEntry[]): DetectedTech[] {
  const found = new Map<string, DetectedTech>();

  for (const entry of tree) {
    const path = entry.path.toLowerCase();
    for (const rule of PATH_RULES) {
      if (rule.test.test(path)) {
        found.set(rule.name, { name: rule.name, category: rule.category });
      }
    }
  }

  return [...found.values()];
}

function parsePackageJson(text: string): string[] {
  try {
    const json = JSON.parse(text) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    return [
      ...Object.keys(json.dependencies ?? {}),
      ...Object.keys(json.devDependencies ?? {}),
      ...Object.keys(json.peerDependencies ?? {}),
    ];
  } catch {
    return [];
  }
}

function parseRequirementsTxt(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("-"))
    .map((line) => {
      const name = line.split(/[=<>!~[;]/)[0];
      return (name ?? "").trim().toLowerCase();
    })
    .filter((name) => name.length > 0);
}

function parsePyproject(text: string): string[] {
  // Covers both [project].dependencies and [tool.poetry.dependencies].
  const names: string[] = [];

  for (const match of text.matchAll(/^\s*["']?([A-Za-z0-9._-]+)["']?\s*=\s*["{]/gm)) {
    const name = match[1];
    if (name) names.push(name.toLowerCase());
  }
  for (const match of text.matchAll(/["']([A-Za-z0-9._-]+)\s*[><=~!]+[^"']*["']/g)) {
    const name = match[1];
    if (name) names.push(name.toLowerCase());
  }

  return names;
}

function parseGoMod(text: string): string[] {
  return [...text.matchAll(/^\s*([a-z0-9.\-/]+\.[a-z]{2,}\/[^\s]+)\s+v/gim)].map(
    (match) => (match[1] ?? "").toLowerCase(),
  );
}

function parseCargoToml(text: string): string[] {
  const section = text.split(/^\[dependencies\]/m)[1];
  if (!section) return [];
  const body = section.split(/^\[/m)[0] ?? "";
  return [...body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*=/gm)].map((m) =>
    (m[1] ?? "").toLowerCase(),
  );
}

function parseComposerJson(text: string): string[] {
  try {
    const json = JSON.parse(text) as {
      require?: Record<string, string>;
      "require-dev"?: Record<string, string>;
    };
    return [
      ...Object.keys(json.require ?? {}),
      ...Object.keys(json["require-dev"] ?? {}),
    ].map((n) => n.toLowerCase());
  } catch {
    return [];
  }
}

function parseGemfile(text: string): string[] {
  return [...text.matchAll(/^\s*gem\s+["']([^"']+)["']/gm)].map((m) =>
    (m[1] ?? "").toLowerCase(),
  );
}

function parseMavenOrGradle(text: string): string[] {
  const names: string[] = [];
  for (const match of text.matchAll(/<groupId>([^<]+)<\/groupId>/g)) {
    const name = match[1];
    if (name) names.push(name.trim().toLowerCase());
  }
  for (const match of text.matchAll(/["']([a-z0-9.\-]+:[a-z0-9.\-]+)(?::[^"']*)?["']/gi)) {
    const coord = match[1];
    if (coord) names.push(coord.split(":")[0]?.toLowerCase() ?? "");
  }
  return names.filter((n) => n.length > 0);
}

export function parseManifestDependencies(path: string, text: string): string[] {
  const file = path.split("/").pop() ?? path;

  if (file === "package.json") return parsePackageJson(text);
  if (file === "requirements.txt") return parseRequirementsTxt(text);
  if (file === "pyproject.toml") return parsePyproject(text);
  if (file === "go.mod") return parseGoMod(text);
  if (file === "Cargo.toml") return parseCargoToml(text);
  if (file === "composer.json") return parseComposerJson(text);
  if (file === "Gemfile") return parseGemfile(text);
  if (file === "pom.xml" || file.startsWith("build.gradle")) {
    return parseMavenOrGradle(text);
  }

  return [];
}

export function detectFromDependencies(dependencies: string[]): DetectedTech[] {
  const found = new Map<string, DetectedTech>();

  for (const dep of dependencies) {
    for (const rule of DEP_RULES) {
      if (rule.match(dep)) {
        found.set(rule.name, { name: rule.name, category: rule.category });
      }
    }
  }

  return [...found.values()];
}

export function mergeTech(...groups: DetectedTech[][]): DetectedTech[] {
  const found = new Map<string, DetectedTech>();
  for (const group of groups) {
    for (const tech of group) found.set(tech.name, tech);
  }
  return [...found.values()];
}
