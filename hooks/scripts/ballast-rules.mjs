#!/usr/bin/env node
/**
 * ballast — rules delivery hook (UserPromptSubmit)
 *
 * Matches the incoming user prompt against rule catalogs and:
 *   - injects the full text of matching rules as additional context, or
 *   - blocks the prompt (exit 2) when a matching rule has "action": "block".
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
 */

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const MAX_RULES = 12;
const MAX_CHARS = 6000;

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

function matches(rule, promptLower, promptRaw) {
  const when = rule.when || {};
  if (when.always === true) return true;
  const keywords = Array.isArray(when.keywords) ? when.keywords : [];
  for (const k of keywords) {
    if (typeof k === "string" && k && promptLower.includes(k.toLowerCase())) return true;
  }
  const patterns = Array.isArray(when.patterns) ? when.patterns : [];
  for (const p of patterns) {
    try {
      if (typeof p === "string" && p && new RegExp(p, "i").test(promptRaw)) return true;
    } catch (e) {
      debug("bad pattern", p, e && e.message);
    }
  }
  return false;
}

/** @returns {number} process exit code */
function main() {
  if (process.env.BALLAST_DISABLE === "1") return 0;

  let input = {};
  try {
    input = JSON.parse(readStdin() || "{}");
  } catch {
    return 0;
  }
  // Field name differs across Claude Code versions: current docs say prompt_text,
  // earlier versions used prompt. Accept both.
  const prompt =
    [input.prompt_text, input.prompt].find((v) => typeof v === "string" && v.trim()) || "";
  if (!prompt) return 0;

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const catalogPaths = [
    join(homedir(), ".claude", "ballast.rules.json"),
    join(projectDir, ".claude", "ballast.rules.json"),
  ];

  const byId = new Map();
  const broken = [];
  let anon = 0;
  for (const path of catalogPaths) {
    for (const rule of loadCatalog(path, broken)) {
      byId.set(typeof rule.id === "string" && rule.id ? rule.id : `anon-${anon++}`, rule);
    }
  }
  const notices = [];
  if (broken.length) {
    notices.push(
      `[ballast] The rule catalog at ${broken.join(", ")} could not be read — rules from it are NOT being delivered this session. Fix the JSON, or set BALLAST_DEBUG=1 to see the parse error.`
    );
  }

  const promptLower = prompt.toLowerCase();
  const matched = byId.size
    ? [...byId.values()].filter((r) => matches(r, promptLower, prompt))
    : [];

  const block = matched.find((r) => r.action === "block");
  if (block) {
    // Exit 2 blocks the prompt; stderr becomes the reason shown to the user.
    console.error(`[ballast] blocked by rule "${block.title || block.id || "rule"}": ${block.body}`);
    return 2;
  }

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

  const sections = [...notices];
  if (lines.length) {
    sections.push(["[ballast] Standing rules that apply to this request:", ...lines].join("\n"));
  }
  if (sections.length === 0) return 0;

  const context = sections.join("\n\n");

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: context,
      },
    })
  );
  return 0;
}

let code = 0;
try {
  code = main() || 0;
} catch (e) {
  debug("fatal", e && e.message);
  code = 0; // never break the session on our own bugs
}
process.exit(code);
