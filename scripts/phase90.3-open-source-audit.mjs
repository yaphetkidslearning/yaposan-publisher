import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import {
  join,
  relative,
} from "node:path";

const root = process.cwd();

const required = [
  "README.md",
  "LICENSE",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "public/robots.txt",
  "public/sitemap.xml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  "docs/OPEN-SOURCE-SECURITY-CHECKLIST.md",
];

const missing = required.filter(
  (file) => !existsSync(join(root, file))
);

if (missing.length) {
  console.error(
    "Phase 90.3 missing required files:"
  );

  for (const file of missing) {
    console.error(`- ${file}`);
  }

  process.exit(1);
}

const layoutPath = join(
  root,
  "src/app/_layout.tsx"
);

const layout = readFileSync(
  layoutPath,
  "utf8"
);

for (const expected of [
  "Yaposan — Creative Design & Publishing Suite",
  'name="description"',
  'rel="canonical"',
  'property="og:title"',
  'type="application/ld+json"',
]) {
  if (!layout.includes(expected)) {
    console.error(
      `SEO metadata missing from src/app/_layout.tsx: ${expected}`
    );

    process.exit(1);
  }
}

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".expo",
  "dist",
  "coverage",
]);

const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".md",
  ".txt",
  ".env",
  ".example",
  ".ps1",
  ".sh",
  ".toml",
]);

const obviousPlaceholderValues = [
  "CHANGE_ME",
  "GENERATE_A_LONG_RANDOM_PASSWORD",
  "GENERATE_64_RANDOM_CHARACTERS",
  "replace-with-at-least-32-random-characters",
  "development-only-change-me",
  "localhost",
  "127.0.0.1",
  "postgres://db",
  "postgresql://db",
  "redis://redis",
  "redis://localhost",
  "r2.example",
  "example.com",
  "admin@example.com",
  "sk_test",
  "secret",
  "token",
  "openai",
  "stripe",
  "replace",
];

function looksLikePlaceholder(
  value
) {
  const normalized =
    String(value ?? "").toLowerCase();

  return obviousPlaceholderValues.some(
    (placeholder) =>
      normalized.includes(
        placeholder.toLowerCase()
      )
  );
}

const suspicious = [
  {
    label: "OpenAI key",
    pattern:
      /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    validate: (match) =>
      !looksLikePlaceholder(match),
  },
  {
    label: "Stripe live secret",
    pattern:
      /\b(?:sk_live|rk_live)_[A-Za-z0-9]{16,}\b/g,
    validate: () => true,
  },
  {
    label: "Stripe webhook secret",
    pattern:
      /\bwhsec_[A-Za-z0-9]{20,}\b/g,
    validate: (match) =>
      !looksLikePlaceholder(match),
  },
  {
    label: "GitHub token",
    pattern:
      /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
    validate: () => true,
  },
  {
    label: "Private key",
    pattern:
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    validate: () => true,
  },
  {
    label: "Database URL with credentials",
    pattern:
      /\bpostgres(?:ql)?:\/\/([^:\s]+):([^@\s]+)@([^/\s]+)(?:\/[^\s]*)?/gi,
    validate: (
      match,
      username,
      password,
      host
    ) => {
      if (
        looksLikePlaceholder(match) ||
        looksLikePlaceholder(username) ||
        looksLikePlaceholder(password) ||
        looksLikePlaceholder(host)
      ) {
        return false;
      }

      const passwordText =
        String(password ?? "");

      return (
        passwordText.length >= 12 ||
        /[A-Z]/.test(passwordText) ||
        /[0-9]/.test(passwordText) ||
        /[^A-Za-z0-9]/.test(
          passwordText
        )
      );
    },
  },
  {
    label: "Redis URL with credentials",
    pattern:
      /\bredis(?:s)?:\/\/(?::?([^@\s]+))@([^/\s]+)/gi,
    validate: (
      match,
      password,
      host
    ) => {
      if (
        looksLikePlaceholder(match) ||
        looksLikePlaceholder(password) ||
        looksLikePlaceholder(host)
      ) {
        return false;
      }

      return (
        String(password ?? "").length >=
        12
      );
    },
  },
  {
    label: "AWS access key",
    pattern:
      /\bAKIA[0-9A-Z]{16}\b/g,
    validate: () => true,
  },
];

const findings = [];

function walk(directory) {
  for (
    const name of readdirSync(
      directory
    )
  ) {
    if (
      ignoredDirectories.has(name)
    ) {
      continue;
    }

    const path = join(
      directory,
      name
    );

    const info = statSync(path);

    if (info.isDirectory()) {
      walk(path);
      continue;
    }

    const rel = relative(
      root,
      path
    ).replaceAll("\\", "/");

    if (
      rel.endsWith(".zip") ||
      rel.endsWith(".png") ||
      rel.endsWith(".jpg") ||
      rel.endsWith(".jpeg") ||
      rel.endsWith(".gif") ||
      rel.endsWith(".pdf") ||
      rel.endsWith(".docx") ||
      rel.endsWith(
        "package-lock.json"
      )
    ) {
      continue;
    }

    const ext = name.includes(".")
      ? name.slice(
          name.lastIndexOf(".")
        )
      : "";

    if (
      !allowedExtensions.has(ext) &&
      !name.startsWith(".env")
    ) {
      continue;
    }

    let content;

    try {
      content = readFileSync(
        path,
        "utf8"
      );
    } catch {
      continue;
    }

    for (
      const rule of suspicious
    ) {
      rule.pattern.lastIndex = 0;

      let match;

      while (
        (
          match =
            rule.pattern.exec(content)
        ) !== null
      ) {
        const isFinding =
          rule.validate(
            ...match
          );

        if (isFinding) {
          findings.push(
            `${rule.label}: ${rel}`
          );
          break;
        }

        if (
          match.index ===
          rule.pattern.lastIndex
        ) {
          rule.pattern.lastIndex++;
        }
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error(
    "Potential secrets detected. Review before making the repository public:"
  );

  for (
    const finding of findings
  ) {
    console.error(
      `- ${finding}`
    );
  }

  process.exit(1);
}

console.log(
  "Phase 90.3 verification passed."
);

console.log(
  "- SEO/community files present"
);

console.log(
  "- Root metadata present"
);

console.log(
  "- No high-confidence production secret pattern detected in current text files"
);

console.log(
  "- Known placeholders and test fixtures ignored"
);

console.log(
  "Reminder: this does not replace a full Git-history secret scan."
);