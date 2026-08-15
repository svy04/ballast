# Changelog

## 0.3.0 — 2026-08-15

Repair release: documentation brought in line with what the engine actually reads. No engine changes.

- pin skill: rule entries were documented with a `triggers` field the hook never reads — corrected to the real schema (`when.keywords` / `when.patterns` / `when.always`), with a copy-exact example entry
- verify-gate skill: `.claude/ballast.verifier.json` now ships with an example (`rules/ballast.verifier.example.json`), and the skill states that the skill — not the rules hook — reads it
- verified `/ballast:goal` and `/ballast:brain-init` against current Claude Code (2.1.x): plugin skills are slash-invocable as `/plugin:skill` without a `commands/` directory (custom commands were merged into skills), so the README instructions stand as written
- new CONTRIBUTING.md
- README (EN/KO) rewritten: headline and demo now describe the same product; every piece is labeled code-enforced or convention — the rules hook is the only enforced row, and the README says so plainly; the non-developer origin story moved out of a footnote
- Korean edition rewritten as native Korean (not a translation): consistent register, terms defined at first use
- plugin/marketplace descriptions rewritten from mechanism lists to a single promise; version 0.3.0

## 0.2.0 — 2026-08-14

Repositioned: ballast is a goal engine that doesn't trust itself — not just a discipline layer.

- new skill `goal`: the full pipeline for big/unfamiliar goals — terrain scan (questions before answers), full skeleton, atomic leaves verified before load-bearing, re-check loop, done-means-verified
- new skill `pin`: turn a correction just made into a permanent rule catalog entry in one step
- README (EN/KO) rewritten around the goal-engine positioning; rules hook keeps the "tell Claude once" role
- no engine changes: hooks and existing skills untouched

## 0.1.0 — 2026-08-13

Initial release.

- rules hook (UserPromptSubmit): catalog-matched rule-body injection, block rules, user+project catalog merge, fail-silent design
- skills: decision-ledger, verify-gate, proof-standard, brain-init (+ memory templates)
- example rule catalog
- publish hygiene checklist and .gitignore baseline
- docs in English and Korean
