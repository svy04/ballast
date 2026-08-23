#!/usr/bin/env node
/**
 * ballast — rules delivery hook
 *
 * Events served (all from the same script, routed on hook_event_name / argv):
 *   UserPromptSubmit  — match the prompt against rule catalogs; inject matching
 *                       rule bodies as additional context, or block (exit 2).
 *   PreToolUse        — match the tool call (name + command / file path) against
 *                       rules that opt in with "when": {"tools": [...]}; inject,
 *                       or deny the call with the rule as the reason.
 *   PreCompact        — one reminder before context compaction: write the
 *                       checkpoint now, details outside files are about to go.
 *   SessionStart      — one status line (rule counts, broken catalogs) so a dead
 *                       hook never looks like a quiet one. After a compaction
 *                       (source: "compact") the line says that instead.
 *
 * Maintenance modes (run by hand or by the doctor/report skills, no stdin needed):
 *   --status          — the SessionStart line, on demand
 *   --check           — catalog health: parse errors, rules that can never fire,
 *                       bad regexes, duplicate ids, budget warnings
 *   --report          — delivery counts per rule from the log; names the rules
 *                       that have never fired
 *
 * Delivery log: one JSON line per delivery/block in ~/.claude/ballast/log.jsonl —
 * timestamps, rule ids and sizes only, NEVER prompt or tool-input text. Rotated
 * once past ~512 KB. BALLAST_NO_LOG=1 turns it off.
 *
 * Catalogs (merged, project wins on duplicate ids):
 *   1. <home>/.claude/ballast.rules.json      — user-level rules
 *   2. <project>/.claude/ballast.rules.json   — project-level rules
 *
 * Design contract: this hook must NEVER break a session.
 * Any internal error -> exit 0. Output stays empty except for one case:
 * a catalog that exists but cannot be parsed gets one line back to the user,
 * because a silently dropped catalog is indistinguishable from "nothing matched".
 * Set BALLAST_DEBUG=1 to see errors on stderr.
 * Set BALLAST_DISABLE=1 to turn the hook off without uninstalling.
 * Set BALLAST_QUIET=1 to turn the session-start status line off.
 */

import {
  readFileSync,
  existsSync,
  mkdirSync,
  appendFileSync,
  statSync,
  renameSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, basename } from "node:path";

const MAX_RULES = 12;
const MAX_CHARS = 6000;
const LOG_ROTATE_BYTES = 512 * 1024;

function debug(...args) {
  if (process.env.BALLAST_DEBUG === "1") console.error("[ballast]", ...args);
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// A missing catalog and a broken one are different events. Missing is the normal
// starting state and stays silent. Broken means rules the user wrote are not being
// delivered, and a silent session looks identical to one where nothing matched —
// so the failure gets one line back to the user, never an exception.
function loadCatalog(path, broken) {
  try {
    if (!existsSync(path)) return [];
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    const rules = Array.isArray(parsed) ? parsed : parsed.rules;
    if (!Array.isArray(rules)) {
      debug("no rules array", path);
      broken.push(path);
      return [];
    }
    return rules.filter((r) => r && typeof r === "object" && typeof r.body === "string");
  } catch (e) {
    debug("failed to load", path, e && e.message);
    broken.push(path);
    return [];
  }
}

function textMatch(when, textLower, textRaw) {
  const keywords = Array.isArray(when.keywords) ? when.keywords : [];
  for (const k of keywords) {
    if (typeof k === "string" && k && textLower.includes(k.toLowerCase())) return true;
  }
  const patterns = Array.isArray(when.patterns) ? when.patterns : [];
  for (const p of patterns) {
    try {
      if (typeof p === "string" && p && new RegExp(p, "i").test(textRaw)) return true;
    } catch (e) {
      debug("bad pattern", p, e && e.message);
    }
  }
  return false;
}

// Rules with "when.tools" belong to the tool layer and stay out of prompt matching.
function matchesPrompt(rule, promptLower, promptRaw) {
  const when = rule.when || {};
  if (when.tools !== undefined) return false;
  if (when.always === true) return true;
  return textMatch(when, promptLower, promptRaw);
}

// Tool layer is opt-in: a rule joins it only by declaring "when.tools".
// tools: true means any tool; an array names the tools it watches.
function matchesTool(rule, toolName, targetLower, targetRaw) {
  const when = rule.when || {};
  const tools = when.tools;
  if (tools !== true && !Array.isArray(tools)) return false;
  if (Array.isArray(tools)) {
    const name = toolName.toLowerCase();
    if (!tools.some((t) => typeof t === "string" && t.toLowerCase() === name)) return false;
  }
  if (when.always === true) return true;
  return textMatch(when, targetLower, targetRaw);
}

// ---------------------------------------------------------------------------
// Delivery log — ids, counts and sizes only. Never prompt or tool-input text.
// ---------------------------------------------------------------------------

function logDir() {
  return join(homedir(), ".claude", "ballast");
}

function logDelivery(entry) {
  if (process.env.BALLAST_NO_LOG === "1") return;
  try {
    const dir = logDir();
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "log.jsonl");
    try {
      if (statSync(file).size > LOG_ROTATE_BYTES) {
        renameSync(file, join(dir, "log.1.jsonl")); // replaces the previous rotation
      }
    } catch {
      /* first write, or stat failed — either way just append */
    }
    appendFileSync(file, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
  } catch (e) {
    debug("log write failed", e && e.message);
  }
}

function readLogLines() {
  const lines = [];
  for (const name of ["log.1.jsonl", "log.jsonl"]) {
    try {
      const file = join(logDir(), name);
      if (!existsSync(file)) continue;
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (!line.trim()) continue;
        try {
          lines.push(JSON.parse(line));
        } catch {
          /* skip torn line */
        }
      }
    } catch (e) {
      debug("log read failed", e && e.message);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Catalog loading shared by every mode
// ---------------------------------------------------------------------------

function loadAll(projectDir) {
  const catalogPaths = [
    join(homedir(), ".claude", "ballast.rules.json"),
    join(projectDir, ".claude", "ballast.rules.json"),
  ];
  const byId = new Map();
  const broken = [];
  const counts = []; // per catalog path: rules loaded, or -1 when the file does not exist
  const duplicates = [];
  let anon = 0;
  for (const path of catalogPaths) {
    if (!existsSync(path)) {
      counts.push(-1);
      continue;
    }
    const rules = loadCatalog(path, broken);
    counts.push(rules.length);
    for (const rule of rules) {
      const id = typeof rule.id === "string" && rule.id ? rule.id : `anon-${anon++}`;
      if (byId.has(id)) duplicates.push(id);
      byId.set(id, rule);
    }
  }
  return { catalogPaths, byId, broken, counts, duplicates };
}

function brokenNotice(broken) {
  return `[ballast] The rule catalog at ${broken.join(", ")} could not be read — rules from it are NOT being delivered this session. Fix the JSON, or set BALLAST_DEBUG=1 to see the parse error.`;
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

function statusMode(input, loaded) {
  if (process.env.BALLAST_QUIET === "1") return 0;
  const { catalogPaths, byId, broken, counts } = loaded;
  const notices = broken.length ? [brokenNotice(broken)] : [];
  const always = [...byId.values()].filter((r) => r.when && r.when.always === true).length;
  const seen = catalogPaths
    .map((_, i) => (counts[i] < 0 ? null : `${counts[i]} from the ${i === 0 ? "user" : "project"} catalog`))
    .filter(Boolean);
  const compacted = input.source === "compact" || input.matcher === "compact";
  let line;
  if (byId.size === 0 && seen.length === 0 && broken.length === 0) {
    line = "[ballast] hook live — no rule catalog yet (create .claude/ballast.rules.json; see the README's Quick start)";
  } else if (compacted) {
    const n = byId.size;
    line = `[ballast] context compacted — ${n} rule${n === 1 ? "" : "s"} still loaded; matching rules re-deliver on the next message. If the pre-compaction checkpoint was skipped, write it now (checkpoint skill).`;
  } else {
    const n = byId.size;
    line = `[ballast] hook live — ${n} rule${n === 1 ? "" : "s"} loaded (${seen.join(", ") || "none readable"}${always ? `; ${always} always-on` : ""})`;
  }
  const context = [line, ...notices].join("\n");
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
      systemMessage: context,
    })
  );
  return 0;
}

function preCompactMode(input, loaded, projectDir) {
  const line =
    "[ballast] Compaction imminent — anything settled only in this conversation is about to be summarized away. Before it goes: update memory/CHECKPOINT.md (checkpoint skill), append confirmed decisions to the ledger, and register open readings in OPEN-QUESTIONS.md. Compression tools stay out of memory/.";
  logDelivery({ ev: "precompact", dir: basename(projectDir) });
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreCompact", additionalContext: line },
      systemMessage: "[ballast] compaction imminent — checkpoint reminder delivered",
    })
  );
  return 0;
}

function renderRules(matched) {
  const lines = [];
  let used = 0;
  let shown = 0;
  for (const rule of matched) {
    if (shown >= MAX_RULES) break;
    const title = rule.title || rule.id || "rule";
    const entry = `- ${title}: ${rule.body}`;
    if (used + entry.length > MAX_CHARS) break;
    lines.push(entry);
    used += entry.length;
    shown++;
  }
  if (lines.length && shown < matched.length) {
    lines.push(`(${matched.length - shown} more matched rules truncated — keep catalogs lean)`);
  }
  return { lines, chars: used };
}

function ruleIds(rules) {
  return rules.map((r) => (typeof r.id === "string" && r.id ? r.id : "anon"));
}

function promptMode(input, loaded, projectDir) {
  const { byId, broken } = loaded;
  const notices = broken.length ? [brokenNotice(broken)] : [];

  // Field name differs across Claude Code versions: current docs say prompt_text,
  // earlier versions used prompt. Codex sends prompt. Accept both.
  const prompt =
    [input.prompt_text, input.prompt].find((v) => typeof v === "string" && v.trim()) || "";
  if (!prompt) return 0;

  const promptLower = prompt.toLowerCase();
  const matched = byId.size
    ? [...byId.values()].filter((r) => matchesPrompt(r, promptLower, prompt))
    : [];

  const block = matched.find((r) => r.action === "block");
  if (block) {
    // Exit 2 blocks the prompt; stderr becomes the reason shown to the user.
    console.error(`[ballast] blocked by rule "${block.title || block.id || "rule"}": ${block.body}`);
    logDelivery({ ev: "block", dir: basename(projectDir), rule: block.id || "anon" });
    return 2;
  }

  const { lines, chars } = renderRules(matched);
  const sections = [...notices];
  if (lines.length) {
    sections.push(["[ballast] Standing rules that apply to this request:", ...lines].join("\n"));
    logDelivery({
      ev: "prompt",
      dir: basename(projectDir),
      rules: ruleIds(matched.slice(0, MAX_RULES)),
      chars,
    });
  }
  if (sections.length === 0) return 0;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: sections.join("\n\n"),
      },
    })
  );
  return 0;
}

function toolMode(input, loaded, projectDir) {
  const { byId } = loaded;
  if (byId.size === 0) return 0;
  const toolName = typeof input.tool_name === "string" ? input.tool_name : "";
  if (!toolName) return 0;
  const ti = input.tool_input && typeof input.tool_input === "object" ? input.tool_input : {};
  // The strings a rule author can aim at: the tool's name plus the fields where
  // commands and paths live. Free-form prompt text stays out of this layer.
  const target = [toolName, ti.command, ti.file_path, ti.notebook_path, ti.url, ti.description]
    .filter((s) => typeof s === "string" && s)
    .join("\n");
  const targetLower = target.toLowerCase();

  const matched = [...byId.values()].filter((r) => matchesTool(r, toolName, targetLower, target));
  if (matched.length === 0) return 0;

  const block = matched.find((r) => r.action === "block");
  if (block) {
    logDelivery({ ev: "tool-block", dir: basename(projectDir), tool: toolName, rule: block.id || "anon" });
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `[ballast] blocked by rule "${block.title || block.id || "rule"}": ${block.body}`,
        },
      })
    );
    return 0;
  }

  const { lines, chars } = renderRules(matched);
  if (!lines.length) return 0;
  logDelivery({
    ev: "tool",
    dir: basename(projectDir),
    tool: toolName,
    rules: ruleIds(matched.slice(0, MAX_RULES)),
    chars,
  });
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: [`[ballast] Standing rules that apply to this ${toolName} call:`, ...lines].join("\n"),
      },
    })
  );
  return 0;
}

function checkMode(loaded) {
  const { catalogPaths, byId, broken, counts, duplicates } = loaded;
  const out = [];
  out.push("[ballast] catalog check");
  catalogPaths.forEach((path, i) => {
    const label = i === 0 ? "user   " : "project";
    if (counts[i] === -1) out.push(`  ${label}  (absent) ${path}`);
    else if (broken.includes(path)) out.push(`  ${label}  BROKEN — could not be parsed: ${path}`);
    else out.push(`  ${label}  ${counts[i]} rules   ${path}`);
  });
  let problems = 0;
  for (const [id, rule] of byId) {
    const when = rule.when || {};
    const issues = [];
    if (!rule.id) issues.push("no id (counted as anonymous — report cannot track it)");
    const hasTrigger =
      when.always === true ||
      (Array.isArray(when.keywords) && when.keywords.length) ||
      (Array.isArray(when.patterns) && when.patterns.length) ||
      when.tools !== undefined;
    if (!hasTrigger) issues.push("no keywords, patterns, always or tools — this rule can never fire");
    if (when.tools !== undefined && when.always !== true &&
        !(Array.isArray(when.keywords) && when.keywords.length) &&
        !(Array.isArray(when.patterns) && when.patterns.length)) {
      issues.push('tool rule with no keywords/patterns/always — add one, or set "always": true to fire on every call of those tools');
    }
    for (const p of Array.isArray(when.patterns) ? when.patterns : []) {
      try {
        new RegExp(p, "i");
      } catch (e) {
        issues.push(`pattern does not compile: ${p} (${e && e.message})`);
      }
    }
    if (issues.length) {
      problems += issues.length;
      out.push(`  rule "${id}":`);
      for (const issue of issues) out.push(`    - ${issue}`);
    }
  }
  if (duplicates.length) {
    out.push(`  duplicate ids (project overrides user): ${[...new Set(duplicates)].join(", ")}`);
  }
  const always = [...byId.values()].filter((r) => r.when && r.when.always === true).length;
  if (always > 2) out.push(`  ${always} always-on rules — past 2, every message pays for all of them; prune`);
  if (byId.size > 20) out.push(`  ${byId.size} rules total — past ~20, consider pruning before adding (pin skill)`);
  out.push(problems === 0 && broken.length === 0 ? "  no problems found" : `  ${problems + broken.length} problem(s) found`);
  process.stdout.write(out.join("\n") + "\n");
  return 0;
}

function reportMode(loaded) {
  const { byId } = loaded;
  const lines = readLogLines();
  const fires = new Map(); // id -> { n, last, blocked }
  let deliveries = 0;
  let first = null;
  let last = null;
  for (const e of lines) {
    if (!e || typeof e !== "object") continue;
    if (!["prompt", "tool", "block", "tool-block"].includes(e.ev)) continue;
    deliveries++;
    if (!first || e.ts < first) first = e.ts;
    if (!last || e.ts > last) last = e.ts;
    const ids = Array.isArray(e.rules) ? e.rules : e.rule ? [e.rule] : [];
    for (const id of ids) {
      const f = fires.get(id) || { n: 0, last: "", blocked: 0 };
      f.n++;
      if (e.ts > f.last) f.last = e.ts;
      if (e.ev === "block" || e.ev === "tool-block") f.blocked++;
      fires.set(id, f);
    }
  }
  const out = [];
  if (deliveries === 0) {
    out.push("[ballast] delivery report — the log is empty. Either the hook was installed recently, no rule has matched yet, or BALLAST_NO_LOG is set. The log lives at ~/.claude/ballast/log.jsonl.");
  } else {
    out.push(`[ballast] delivery report — ${deliveries} deliveries logged, ${(first || "").slice(0, 10)} → ${(last || "").slice(0, 10)}`);
    const rows = [...fires.entries()].sort((a, b) => b[1].n - a[1].n);
    out.push("  fires  last        rule");
    for (const [id, f] of rows) {
      const inCatalog = byId.has(id) ? "" : "   (not in any current catalog — renamed or removed?)";
      out.push(`  ${String(f.n).padStart(5)}  ${f.last.slice(0, 10)}  ${id}${f.blocked ? ` (${f.blocked} blocked)` : ""}${inCatalog}`);
    }
    const dead = [...byId.keys()].filter((id) => !fires.has(id));
    if (dead.length) {
      out.push(`  never fired (${dead.length} of ${byId.size} catalog rules): ${dead.join(", ")}`);
      out.push("  A rule that never fires is either safe-by-default or mis-keyed — check its keywords against the language you actually type, then prune or fix (pin skill).");
    } else if (byId.size) {
      out.push(`  every rule in the current catalogs has fired at least once (${byId.size} rules).`);
    }
  }
  process.stdout.write(out.join("\n") + "\n");
  return 0;
}

// ---------------------------------------------------------------------------

/** @returns {number} process exit code */
function main() {
  if (process.env.BALLAST_DISABLE === "1") return 0;

  const argv = process.argv.slice(2);
  const wantsReport = argv.includes("--report");
  const wantsCheck = argv.includes("--check");
  const wantsStatus = argv.includes("--status");

  // Maintenance modes must work from a plain terminal — never wait on stdin there.
  let input = {};
  if (!(wantsReport || wantsCheck || (wantsStatus && process.stdin.isTTY))) {
    try {
      input = JSON.parse(readStdin() || "{}");
    } catch {
      input = {};
    }
  }
  const event = typeof input.hook_event_name === "string" ? input.hook_event_name : "";

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const loaded = loadAll(projectDir);

  if (wantsCheck) return checkMode(loaded);
  if (wantsReport) return reportMode(loaded);
  if (wantsStatus || event === "SessionStart") return statusMode(input, loaded);
  if (event === "PreCompact") return preCompactMode(input, loaded, projectDir);
  if (event === "PreToolUse") return toolMode(input, loaded, projectDir);
  return promptMode(input, loaded, projectDir);
}

let code = 0;
try {
  code = main() || 0;
} catch (e) {
  debug("fatal", e && e.message);
  code = 0; // never break the session on our own bugs
}
process.exit(code);
