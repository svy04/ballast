---
name: setup
description: Conversational first-time setup — prove the hook is alive, then build the user's first rule catalog without showing them JSON or regex. Use when the user just installed ballast, asks how to set it up or "where do rules go", or the session-start line says "no rule catalog yet".
---

# Setup — from installed to armed, four questions or fewer

Installing ballast puts the hook in place; it does nothing until a rule catalog exists. This skill walks a user — including one who has never edited a JSON file — from "installed" to "my first rules fired in front of me". You do all the file work; the user only answers questions and watches the proof.

Two principles, taken from setups that work: never ask a question whose answer is always yes, and never claim something works — show it firing.

## Steps

1. **Prove the hook is alive before building anything (no question).** Run `node --version` (the hook needs ≥ 18) and the status line: `node "$CLAUDE_PLUGIN_ROOT/hooks/scripts/ballast-rules.mjs" --status` (when `CLAUDE_PLUGIN_ROOT` is not set, find the install path via `claude plugin list`, or use the repo checkout). If node is missing or the line does not appear, **stop here** and hand the user the doctor skill — a catalog written on top of a dead hook is the worst outcome ballast has: silence that looks like working.
2. **Detect a returning user (at most one question).** If `.claude/ballast.rules.json` already exists (project or `~/.claude/`), this is not first-time setup — offer three paths and follow the answer: add a rule (pin skill), check health (doctor skill), or start over.
3. **Confirm chat language (one question, confirmation only).** Keywords are literal text — a rule keyed only in English never fires on a Korean sentence. Detect the language(s) the user has been typing and confirm: "You write in Korean and English — should rules listen for both?" Pair every keyword list in the confirmed languages from here on.
4. **Pick starter rules (one question).** Present the example catalog's rules as a multi-choice list in plain words — label plus one-line reason, no ids, no JSON. For example: "Estimate before spending — anything that costs credits waits for your approval first." Let them pick any number, including none.
5. **Set the danger level (one question).** "Dangerous commands (mass delete, force push): warn about them, or block them outright?" If they choose block, show the honesty line that ships with the example: it stops the prompt, it is not a sandbox.
6. **Write the files and fire a live proof (no question).** Create `.claude/ballast.rules.json` with the chosen rules, keywords paired in the confirmed languages, wrapped as `{"version": 1, "rules": [...]}`. Show the file list you created. Then have the user send (or send yourself) a test sentence containing a trigger word, and point at the `[ballast]` block that arrives: *that* is the mechanism, live. No restart is needed.
7. **Leave one habit and two doors (no question).** The habit: "When I get something wrong, correct me in plain words — a correction can become a permanent rule (I'll draft it, you approve; that's the pin skill)." The doors: brain-init if they want memory files for decisions and facts; doctor if anything ever feels off.

## Rules

- **The user never sees JSON, regex, or paths** unless they ask. You write; they choose.
- **Do not invent starter rules** beyond the example catalog — new rules are pin's job, born from real corrections, not guessed at setup.
- **Do not pad the flow.** Four questions is the ceiling, not the target; a returning user might need one.
- **A dead hook ends setup.** No catalog work until the status line proves delivery is possible.

---

*Part of [ballast](https://github.com/svy04/ballast) — foundations first, every solved path kept, done means checks pass.*
