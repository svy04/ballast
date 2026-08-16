#!/usr/bin/env node
/**
 * ballast — hook verification harness
 *
 * Runs ballast-rules.mjs as a child process against six cases and checks
 * the observable contract (stdout / stderr / exit code):
 *
 *   1. keyword match      -> injects matching rule bodies as additionalContext
 *   2. no match           -> stays silent (no stdout, exit 0)
 *   3. action: "block"    -> blocks the prompt (exit 2, reason on stderr)
 *   4. legacy input field -> accepts "prompt" as well as "prompt_text"
 *   5. broken catalog     -> says so, and delivers no rules
 *   6. broken catalog     -> still never blocks the session (exit 0)
 *
 * Self-contained: builds its own temp catalogs, isolates the child's home
 * and project directories from the real machine, and cleans up after itself.
 * No dependencies beyond node built-ins.
 *
 * Run: node hooks/scripts/verify-hook.mjs
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK = join(dirname(fileURLToPath(import.meta.url)), "ballast-rules.mjs");

const CATALOG = {
  rules: [
    {
      id: "test-inject",
      title: "deploy checklist",
      when: { keywords: ["deploy"] },
      body: "Run the release checklist before any deploy.",
    },
    {
      id: "test-block",
      title: "no force push",
      when: { keywords: ["force push"] },
      action: "block",
      body: "Force pushes to shared branches are not allowed.",
    },
  ],
};

/** Run the hook once with an isolated home + project dir and a given catalog. */
function runHook(stdinObj, catalogText) {
  const root = mkdtempSync(join(tmpdir(), "ballast-verify-"));
  try {
    const home = join(root, "home");
    const project = join(root, "project");
    mkdirSync(join(home, ".claude"), { recursive: true });
    mkdirSync(join(project, ".claude"), { recursive: true });
    if (catalogText !== undefined) {
      writeFileSync(join(project, ".claude", "ballast.rules.json"), catalogText);
    }
    const res = spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify(stdinObj),
      encoding: "utf8",
      timeout: 10_000,
      env: {
        ...process.env,
        HOME: home,           // POSIX homedir()
        USERPROFILE: home,    // Windows homedir()
        CLAUDE_PROJECT_DIR: project,
        BALLAST_DISABLE: "",
        BALLAST_DEBUG: "",
      },
    });
    if (res.error) throw res.error;
    return { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function parseContext(stdout) {
  try {
    return JSON.parse(stdout).hookSpecificOutput.additionalContext;
  } catch {
    return null;
  }
}

const goodCatalog = JSON.stringify(CATALOG);

const cases = [
  {
    name: "keyword match injects matching rules",
    run: () => runHook({ prompt_text: "please deploy the new build" }, goodCatalog),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      const ctx = parseContext(r.stdout);
      if (!ctx) return `expected hookSpecificOutput JSON on stdout, got: ${r.stdout || "(empty)"}`;
      if (!ctx.includes("Run the release checklist")) return "matched rule body missing from context";
      if (ctx.includes("Force pushes")) return "unmatched rule leaked into context";
      return null;
    },
  },
  {
    name: "no match stays silent",
    run: () => runHook({ prompt_text: "write a haiku about rivers" }, goodCatalog),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      if (r.stdout.trim() !== "") return `expected empty stdout, got: ${r.stdout}`;
      return null;
    },
  },
  {
    name: 'action "block" blocks with exit 2',
    run: () => runHook({ prompt_text: "just force push it to main" }, goodCatalog),
    check: (r) => {
      if (r.status !== 2) return `expected exit 2, got ${r.status}`;
      if (!r.stderr.includes("Force pushes")) return "block reason missing from stderr";
      return null;
    },
  },
  {
    name: 'legacy "prompt" field still works',
    run: () => runHook({ prompt: "time to deploy again" }, goodCatalog),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      const ctx = parseContext(r.stdout);
      if (!ctx || !ctx.includes("Run the release checklist")) return "legacy field was not accepted";
      return null;
    },
  },
  {
    name: "broken catalog says so instead of failing silently",
    run: () => runHook({ prompt_text: "deploy something" }, "{ this is not valid JSON"),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      const ctx = parseContext(r.stdout);
      if (!ctx) return "expected a notice on stdout, got nothing";
      if (!ctx.includes("could not be read")) return `notice did not name the failure: ${ctx}`;
      if (ctx.includes("Standing rules that apply"))
        return "a broken catalog must not deliver rules";
      return null;
    },
  },
  {
    name: "a broken catalog never blocks the session",
    run: () => runHook({ prompt_text: "deploy something" }, "{ this is not valid JSON"),
    check: (r) => {
      if (r.status === 2) return "a parse failure must not block the prompt";
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      return null;
    },
  },
];

let failed = 0;
for (const c of cases) {
  let reason;
  try {
    reason = c.check(c.run());
  } catch (e) {
    reason = `harness error: ${e && e.message}`;
  }
  if (reason) {
    failed++;
    console.log(`FAIL  ${c.name}`);
    console.log(`      ${reason}`);
  } else {
    console.log(`PASS  ${c.name}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed === 0 ? 0 : 1);
