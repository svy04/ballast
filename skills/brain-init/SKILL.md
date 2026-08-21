---
name: brain-init
description: Scaffold a file-based memory system (index, decision ledger, open questions, session log, optional product truth file) so a project can serve as a durable second brain. Use when the user wants to set up memory, an external brain, or the ballast structure in a project.
---

# Brain scaffold

Set up the ballast memory structure in the current project. Decide everything you can yourself; report what you created instead of asking questions.

## Steps

1. Create `memory/` in the project root and copy these templates from this skill's `templates/` directory, filling `<project>` placeholders with the actual project name:
   - `templates/00-INDEX.md` → `memory/00-INDEX.md`
   - `templates/DECISIONS.md` → `memory/DECISIONS.md`
   - `templates/OPEN-QUESTIONS.md` → `memory/OPEN-QUESTIONS.md`
   - `templates/SESSION-LOG.md` → `memory/SESSION-LOG.md`
   - `templates/PRODUCT-TRUTH.md` → `memory/PRODUCT-TRUTH.md` — only if the project is (or documents) a product; skip for pure-knowledge projects and say so
2. Append the session-start block from `templates/CLAUDE-snippet.md` to the project's `CLAUDE.md` (create the file if missing; if the block is already there, don't duplicate it). The snippet is tool-neutral — if the project also uses Codex, append the same block to `AGENTS.md` (see `docs/CODEX.md`).
3. If the user keeps rules in `.claude/ballast.rules.json`, leave it untouched; if they ask for a starter catalog, copy `rules/ballast.rules.example.json` from the plugin root to `.claude/ballast.rules.json` and tell them to prune it.
4. Report: files created, files skipped (and why), and the one-line habit — "decisions get recorded the moment they're confirmed."

## Conventions (explain these to the user once, briefly)

- **The index is the map.** `00-INDEX.md` says what lives where and the write rules. New file types get a row there first.
- **The ledger is append-only.** See the decision-ledger skill — never edit, only supersede.
- **Open questions never dissolve silently.** Unresolved items are registered in `OPEN-QUESTIONS.md` and closed with a link to the decision that resolved them. The same file holds *readings in force* — an "ok" that could have meant anything, written down as what the user said plus what you assumed — so a non-answer never quietly becomes a decision.
- **The session log is cheap insurance.** A few dated bullets per working session; when context resets, this is the recovery path.
- **Claims carry labels; product claims carry proof.** See verify-gate and proof-standard.
- **The scaffold is a floor, not a ceiling.** Other skills grow `memory/` later — checkpoint adds `CHECKPOINT.md`, `checkpoints/`, and the single-use `HANDOFF.md`; verified reference material accumulates under `memory/knowledge/`. Don't pre-create these; give each a row in the index when it first appears.
