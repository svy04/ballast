---
name: doctor
description: Health check for the ballast installation — is the hook alive, are the catalogs sane, is anything silently dead. Use when rules stop arriving, the session-start line is missing, the user asks "is ballast working", or after an update or reinstall.
---

# Doctor — silence diagnosed, not trusted

The failure mode this skill exists for: a dead hook looks exactly like a quiet one. Doctor tells them apart, and reports in four states — **healthy**, **off** (disabled on purpose), **broken** (something the user relies on is not happening), **unchecked** (could not be verified). Three rules govern the report:

- Off is not a problem. `BALLAST_DISABLE=1` or `BALLAST_QUIET=1` set on purpose gets reported as "off — as configured", never as a failure.
- Never hide what you could not check. An "unchecked" row is information; silently skipping it is not.
- "Fixed" is claimed only after re-running the check that failed.

## Checks, in order

1. **node exists, version ≥ 18** — `node --version`. Missing node means every other check is moot; the fix (install node) is the user's, with a link.
2. **Hook wiring** — the plugin's `hooks/hooks.json` parses and its script file exists. Find the plugin root via `CLAUDE_PLUGIN_ROOT` or `claude plugin list`.
3. **Live fire** — run the engine's status line for real: `node .../ballast-rules.mjs --status`. The line appearing IS the proof; a wiring check alone is not (a manifest that parses can still fail to load — that was ballast's own 0.8.1 bug).
4. **Off switches** — `BALLAST_DISABLE`, `BALLAST_QUIET`, `BALLAST_NO_LOG` set? Report as "off — as configured" and ask nothing.
5. **Catalog presence** — user (`~/.claude/ballast.rules.json`) and project paths. Neither existing is not broken; it is "before first setup" — point at the setup skill.
6. **Catalog health** — run `node .../ballast-rules.mjs --check`. It flags parse failures, rules that can never fire, patterns that do not compile, duplicate ids, and budget overruns (20+ rules, 3+ always-on). Translate its findings to plain words: "rule 3's detection condition is broken", not the regex error.
7. **Delivery history** — run `node .../ballast-rules.mjs --report`. An empty log with an old install suggests keywords in the wrong language or a hook that died some time ago; cross-check with check 3.
8. **Language pairing** — keywords in one language while the user chats in another is the top silent killer of rules. Compare catalog keywords against the language of the current conversation.
9. **Memory files (optional)** — `memory/` absent is "off — brain-init not used", not a failure. If present, confirm `DECISIONS.md` exists.
10. **Self-instrument** — say whether every check above actually ran. A doctor that skipped half its checks and printed "healthy" is the exact disease it treats.

## Report shape

Broken first (each: one plain sentence on what stopped working for the user → the fix path), then unchecked, then off in one line, then "N healthy". Close with a four-cell summary: auto-fixed / awaiting approval / user's hands / healthy·off·unchecked.

Repairs come in three tiers: harmless ones you just do (creating a missing `.claude/` folder); catalog edits proposed one at a time and applied only on approval — the user is the author of their rules, doctor included; node installs and plugin reinstalls stay in the user's hands, with exact commands.

---

*Part of [ballast](https://github.com/svy04/ballast) — foundations first, every solved path kept, done means checks pass.*
