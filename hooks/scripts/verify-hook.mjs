#!/usr/bin/env node
/**
 * ballast — hook verification harness
 *
 * Runs ballast-rules.mjs as a child process against twenty cases and checks
 * the observable contract (stdout / stderr / exit code / log file), plus the
 * shape of the plugin's hook manifest:
 *
 *   1. keyword match      -> injects matching rule bodies as additionalContext
 *   2. no match           -> stays silent (no stdout, exit 0)
 *   3. action: "block"    -> blocks the prompt (exit 2, reason on stderr)
 *   4. legacy input field -> accepts "prompt" as well as "prompt_text"
 *   5. broken catalog     -> says so, and delivers no rules
 *   6. broken catalog     -> still never blocks the session (exit 0)
 *   7. hooks/hooks.json   -> every event entry wraps its commands in a nested
 *                            "hooks" array (the shape Claude Code and Codex load;
 *                            the flat shape fails plugin load — fixed in 0.8.1)
 *   8. SessionStart       -> status line says the hook is live and counts the rules
 *   9. SessionStart       -> with no catalog at all, the line still appears ("no rule catalog yet")
 *  10. SessionStart       -> with a broken catalog, the line appears and names the failure
 *  11. delivery log       -> one JSON line per delivery: rule ids and sizes, never prompt text
 *  12. BALLAST_NO_LOG=1   -> writes nothing
 *  13. tools-scoped rule  -> stays out of prompt matching (action layer is opt-in)
 *  14. PreToolUse         -> injects a rule whose "when.tools" names the tool
 *  15. PreToolUse block   -> denies the call (permissionDecision, exit 0 — not exit 2)
 *  16. PreToolUse         -> a tool the rule does not name stays silent
 *  17. PreCompact         -> emits the checkpoint reminder
 *  18. SessionStart       -> after compaction (source: "compact") the line says so
 *  19. --report           -> names fired rules and never-fired rules from the log
 *  20. --check            -> flags a rule that can never fire and a pattern that
 *                            does not compile
 *
 * Self-contained: builds its own temp catalogs, isolates the child's home
 * and project directories from the real machine, and cleans up after itself.
 * No dependencies beyond node built-ins.
 *
 * Run: node hooks/scripts/verify-hook.mjs
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK = join(dirname(fileURLToPath(import.meta.url)), "ballast-rules.mjs");
const MANIFEST = join(dirname(fileURLToPath(import.meta.url)), "..", "hooks.json");

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
    {
      id: "tool-inject",
      title: "pnpm only",
      when: { tools: ["Bash"], keywords: ["npm install"] },
      body: "This repo uses pnpm; npm install has broken the lockfile before.",
    },
    {
      id: "tool-block",
      title: "no recursive root delete",
      when: { tools: ["Bash"], patterns: ["rm -rf /"] },
      action: "block",
      body: "Recursive deletion from the filesystem root is not allowed.",
    },
  ],
};

/**
 * Run the hook once with an isolated home + project dir and a given catalog.
 * opts.args     — extra argv (e.g. ["--report"])
 * opts.env      — extra environment entries
 * opts.seedLog  — JSONL text written to <home>/.claude/ballast/log.jsonl first
 * Returns stdout/stderr/status plus logText (the isolated delivery log, "" if absent).
 */
function runHook(stdinObj, catalogText, opts = {}) {
  const root = mkdtempSync(join(tmpdir(), "ballast-verify-"));
  try {
    const home = join(root, "home");
    const project = join(root, "project");
    mkdirSync(join(home, ".claude"), { recursive: true });
    mkdirSync(join(project, ".claude"), { recursive: true });
    if (catalogText !== undefined) {
      writeFileSync(join(project, ".claude", "ballast.rules.json"), catalogText);
    }
    if (opts.seedLog !== undefined) {
      mkdirSync(join(home, ".claude", "ballast"), { recursive: true });
      writeFileSync(join(home, ".claude", "ballast", "log.jsonl"), opts.seedLog);
    }
    const res = spawnSync(process.execPath, [HOOK, ...(opts.args || [])], {
      input: stdinObj === undefined ? "" : JSON.stringify(stdinObj),
      encoding: "utf8",
      timeout: 10_000,
      env: {
        ...process.env,
        HOME: home,           // POSIX homedir()
        USERPROFILE: home,    // Windows homedir()
        CLAUDE_PROJECT_DIR: project,
        BALLAST_DISABLE: "",
        BALLAST_DEBUG: "",
        BALLAST_NO_LOG: "",
        ...(opts.env || {}),
      },
    });
    if (res.error) throw res.error;
    const logFile = join(home, ".claude", "ballast", "log.jsonl");
    const logText = existsSync(logFile) ? readFileSync(logFile, "utf8") : "";
    return { status: res.status, stdout: res.stdout || "", stderr: res.stderr || "", logText };
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
  {
    name: "hooks.json wraps every command in a nested hooks array",
    run: () => JSON.parse(readFileSync(MANIFEST, "utf8")),
    check: (manifest) => {
      const events = manifest && manifest.hooks;
      if (!events || typeof events !== "object") return "manifest has no top-level hooks object";
      const names = Object.keys(events);
      if (names.length === 0) return "manifest declares no events";
      for (const name of names) {
        const entries = events[name];
        if (!Array.isArray(entries) || entries.length === 0) return `${name}: expected a non-empty array of entries`;
        entries.forEach((entry, i) => {
          if (!entry || !Array.isArray(entry.hooks) || entry.hooks.length === 0)
            throw new Error(`${name}[${i}]: expected a nested "hooks" array (flat type/command entries fail to load)`);
          entry.hooks.forEach((h, j) => {
            if (!h || h.type !== "command" || typeof h.command !== "string" || !h.command)
              throw new Error(`${name}[${i}].hooks[${j}]: expected { type: "command", command: "..." }`);
            if (!h.command.includes("ballast-rules.mjs")) throw new Error(`${name}[${i}].hooks[${j}]: command does not run ballast-rules.mjs`);
          });
        });
      }
      return null;
    },
  },
  {
    name: "session start: status line counts the loaded rules",
    run: () => runHook({ hook_event_name: "SessionStart", source: "startup" }, goodCatalog),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      let out;
      try { out = JSON.parse(r.stdout); } catch { return `expected JSON on stdout, got: ${r.stdout || "(empty)"}`; }
      const ctx = out.hookSpecificOutput && out.hookSpecificOutput.additionalContext;
      if (!ctx) return "expected hookSpecificOutput.additionalContext";
      if (out.hookSpecificOutput.hookEventName !== "SessionStart") return "hookEventName should be SessionStart";
      if (!ctx.includes("hook live")) return `status line missing: ${ctx}`;
      if (!ctx.includes("4 rules")) return `expected the 4 catalog rules to be counted: ${ctx}`;
      if (!ctx.includes("project catalog")) return `expected the project catalog to be named: ${ctx}`;
      if (typeof out.systemMessage !== "string" || !out.systemMessage.includes("hook live")) return "systemMessage (the user-visible copy) missing";
      if (ctx.includes("Standing rules that apply")) return "status mode must not deliver rules";
      return null;
    },
  },
  {
    name: "session start: no catalog at all still prints the line",
    run: () => runHook({ hook_event_name: "SessionStart", source: "startup" }, undefined),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      const ctx = parseContext(r.stdout);
      if (!ctx) return `expected a status line, got: ${r.stdout || "(empty)"}`;
      if (!ctx.includes("no rule catalog yet")) return `expected "no rule catalog yet": ${ctx}`;
      return null;
    },
  },
  {
    name: "session start: a broken catalog is named in the status line",
    run: () => runHook({ hook_event_name: "SessionStart", source: "startup" }, "{ this is not valid JSON"),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      const ctx = parseContext(r.stdout);
      if (!ctx) return "expected a status line";
      if (!ctx.includes("hook live")) return `status line missing: ${ctx}`;
      if (!ctx.includes("could not be read")) return `broken catalog not named: ${ctx}`;
      return null;
    },
  },
  {
    name: "delivery log: rule ids and sizes, never prompt text",
    run: () => runHook({ prompt_text: "please deploy the new build" }, goodCatalog),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      const lines = r.logText.trim().split("\n").filter(Boolean);
      if (lines.length !== 1) return `expected exactly 1 log line, got ${lines.length}`;
      let e;
      try { e = JSON.parse(lines[0]); } catch { return `log line is not JSON: ${lines[0]}`; }
      if (e.ev !== "prompt") return `expected ev "prompt", got ${e.ev}`;
      if (!Array.isArray(e.rules) || !e.rules.includes("test-inject")) return "fired rule id missing from log";
      if (typeof e.chars !== "number") return "delivered size missing from log";
      if (r.logText.includes("deploy the new build")) return "PROMPT TEXT LEAKED INTO THE LOG";
      return null;
    },
  },
  {
    name: "BALLAST_NO_LOG=1 writes nothing",
    run: () => runHook({ prompt_text: "please deploy the new build" }, goodCatalog, { env: { BALLAST_NO_LOG: "1" } }),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      if (r.logText !== "") return `expected no log file, got: ${r.logText}`;
      const ctx = parseContext(r.stdout);
      if (!ctx || !ctx.includes("Run the release checklist")) return "delivery itself must still work with logging off";
      return null;
    },
  },
  {
    name: "tools-scoped rule stays out of prompt matching",
    run: () => runHook({ prompt_text: "should I run npm install here?" }, goodCatalog),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      if (r.stdout.trim() !== "") return `a when.tools rule fired on a prompt: ${r.stdout}`;
      return null;
    },
  },
  {
    name: "PreToolUse injects a rule that names the tool",
    run: () =>
      runHook(
        { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm install express" } },
        goodCatalog
      ),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      let out;
      try { out = JSON.parse(r.stdout); } catch { return `expected JSON on stdout, got: ${r.stdout || "(empty)"}`; }
      if (out.hookSpecificOutput.hookEventName !== "PreToolUse") return "hookEventName should be PreToolUse";
      const ctx = out.hookSpecificOutput.additionalContext;
      if (!ctx || !ctx.includes("pnpm")) return `tool rule body missing: ${ctx}`;
      if (ctx.includes("release checklist")) return "a prompt-layer rule leaked into the tool layer";
      const e = JSON.parse(r.logText.trim());
      if (e.ev !== "tool" || e.tool !== "Bash") return "tool delivery not logged";
      if (r.logText.includes("express")) return "TOOL INPUT TEXT LEAKED INTO THE LOG";
      return null;
    },
  },
  {
    name: "PreToolUse block denies the call without breaking the session",
    run: () =>
      runHook(
        { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "rm -rf / --no-preserve-root" } },
        goodCatalog
      ),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0 (deny is JSON, not exit 2), got ${r.status}`;
      let out;
      try { out = JSON.parse(r.stdout); } catch { return `expected JSON on stdout, got: ${r.stdout || "(empty)"}`; }
      if (out.hookSpecificOutput.permissionDecision !== "deny") return "expected permissionDecision deny";
      if (!String(out.hookSpecificOutput.permissionDecisionReason).includes("Recursive deletion"))
        return "deny reason missing the rule body";
      return null;
    },
  },
  {
    name: "PreToolUse: a tool the rule does not name stays silent",
    run: () =>
      runHook(
        { hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: "npm install notes.md" } },
        goodCatalog
      ),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      if (r.stdout.trim() !== "") return `rule fired for a tool it does not name: ${r.stdout}`;
      return null;
    },
  },
  {
    name: "PreCompact emits the checkpoint reminder",
    run: () => runHook({ hook_event_name: "PreCompact", trigger: "auto" }, goodCatalog),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      let out;
      try { out = JSON.parse(r.stdout); } catch { return `expected JSON on stdout, got: ${r.stdout || "(empty)"}`; }
      if (out.hookSpecificOutput.hookEventName !== "PreCompact") return "hookEventName should be PreCompact";
      const ctx = out.hookSpecificOutput.additionalContext;
      if (!ctx || !ctx.includes("CHECKPOINT")) return `checkpoint reminder missing: ${ctx}`;
      if (typeof out.systemMessage !== "string") return "user-visible line missing";
      return null;
    },
  },
  {
    name: 'session start after compaction (source: "compact") says so',
    run: () => runHook({ hook_event_name: "SessionStart", source: "compact" }, goodCatalog),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      const ctx = parseContext(r.stdout);
      if (!ctx) return "expected a status line";
      if (!ctx.includes("context compacted")) return `expected the compaction variant: ${ctx}`;
      if (!ctx.includes("4 rules")) return `rule count missing from the compaction line: ${ctx}`;
      return null;
    },
  },
  {
    name: "--report names fired and never-fired rules",
    run: () =>
      runHook(undefined, goodCatalog, {
        args: ["--report"],
        seedLog:
          JSON.stringify({ ts: "2026-08-20T10:00:00Z", ev: "prompt", dir: "proj", rules: ["test-inject"], chars: 50 }) +
          "\n" +
          JSON.stringify({ ts: "2026-08-21T10:00:00Z", ev: "tool", dir: "proj", tool: "Bash", rules: ["tool-inject"], chars: 40 }) +
          "\n",
      }),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      if (!r.stdout.includes("delivery report")) return `report header missing: ${r.stdout}`;
      if (!r.stdout.includes("test-inject")) return "fired rule missing from report";
      if (!r.stdout.includes("never fired")) return "never-fired section missing";
      if (!r.stdout.includes("test-block")) return "dead rule not named";
      return null;
    },
  },
  {
    name: "--check flags a rule that can never fire and a bad regex",
    run: () =>
      runHook(undefined, JSON.stringify({
        rules: [
          { id: "no-trigger", body: "x", when: {} },
          { id: "bad-regex", body: "y", when: { patterns: ["("] } },
        ],
      }), { args: ["--check"] }),
    check: (r) => {
      if (r.status !== 0) return `expected exit 0, got ${r.status}`;
      if (!r.stdout.includes("can never fire")) return `never-fires warning missing: ${r.stdout}`;
      if (!r.stdout.includes("does not compile")) return `bad-regex warning missing: ${r.stdout}`;
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
