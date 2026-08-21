#!/usr/bin/env node
/**
 * ballast-codex — rule delivery for `codex exec`.
 *
 * Codex CLI runs UserPromptSubmit hooks natively — project .codex/hooks.json,
 * user ~/.codex/hooks.json, or the plugin's hooks/hooks.json — so on a current
 * build the hook itself is the primary path (see docs/CODEX.md). This wrapper
 * stays for builds and environments without hooks, and for automation that
 * would rather prepend rules than bypass hook trust: it runs the same
 * ballast-rules engine, prepends every matching rule to the prompt, honors
 * "block" rules, then hands off to `codex exec`.
 *
 *   node ballast-codex.mjs "your prompt here"
 *   node ballast-codex.mjs "your prompt" -- -C /path/to/project -s read-only
 *
 * Everything after `--` is passed to `codex exec` unchanged.
 * Set CODEX_BIN if `codex` is not on your PATH.
 *
 * Same contract as the hook: zero dependencies, and a failure in the rule
 * step never eats your run — delivery is skipped, the prompt goes through,
 * and you get one line on stderr. Interactive sessions are the hook's job,
 * not this wrapper's.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
  console.log('usage: node ballast-codex.mjs "<prompt>" [-- codex exec args...]');
  process.exit(argv.length === 0 ? 1 : 0);
}

const sep = argv.indexOf("--");
const prompt = (sep === -1 ? argv : argv.slice(0, sep)).join(" ");
const extra = sep === -1 ? [] : argv.slice(sep + 1);

// Resolve the project dir the same way codex exec will: -C wins, else cwd.
const cIdx = extra.findIndex((a) => a === "-C" || a === "--cd");
const projectDir = cIdx !== -1 && extra[cIdx + 1] ? extra[cIdx + 1] : process.cwd();

const hookPath = join(dirname(fileURLToPath(import.meta.url)), "ballast-rules.mjs");

let delivered = prompt;
const run = spawnSync(process.execPath, [hookPath], {
  input: JSON.stringify({ prompt, cwd: projectDir, hook_event_name: "UserPromptSubmit" }),
  encoding: "utf8",
  timeout: 10_000,
});

if (run.status === 2) {
  // A "block" rule matched — same behavior as the hook: refuse, show the reason.
  process.stderr.write(run.stderr || "[ballast] blocked by rule\n");
  process.exit(2);
} else if (run.status === 0 && run.stdout) {
  try {
    const out = JSON.parse(run.stdout);
    const ctx = out?.hookSpecificOutput?.additionalContext;
    if (ctx) delivered = `${ctx}\n\n---\n\n${prompt}`;
  } catch {
    process.stderr.write("[ballast-codex] rule step returned unreadable output — delivering prompt without rules\n");
  }
} else if (run.error || run.status !== 0) {
  process.stderr.write("[ballast-codex] rule step failed — delivering prompt without rules\n");
}

const codexBin = process.env.CODEX_BIN || "codex";
const codex = spawnSync(codexBin, ["exec", delivered, ...extra], { stdio: "inherit" });
if (codex.error) {
  console.error(`[ballast-codex] could not run "${codexBin}" — set CODEX_BIN to your codex binary`);
  process.exit(1);
}
process.exit(codex.status ?? 0);