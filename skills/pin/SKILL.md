---
name: pin
description: Turn a correction or working preference the user just expressed into a permanent ballast rule. Use when the user corrects your behavior, says "don't do X" / "always do Y" / "I told you before", or asks you to remember how they want things done.
---

# Pin — corrections become rules

A correction that lives only in the conversation dies with the conversation. Pinning it writes it into the ballast rule catalog, so the rules hook delivers it with every future message it applies to.

## Steps

1. **Extract the rule.** One imperative sentence, at most two. The user's own wording beats your paraphrase. If the correction references a specific incident, keep the incident as a short parenthetical — future-you needs the why.
2. **Propose the entry** in one compact block and ask nothing else:
   - `id`: short kebab-case
   - `triggers`: 4–8 keywords likely to appear in future messages where this rule matters — in the language(s) the user actually types. Too-generic triggers ("please", "make") spam every turn; too-narrow ones never fire.
   - `body`: the rule text
   - `action`: "inject" (default) or "block" if the user wants the request stopped outright
3. **On the user's OK** (a plain "yes/좋아/그래" is enough), merge it into `<project>/.claude/ballast.rules.json` — create the file with `{"version": 1, "rules": []}` if missing. If an entry with the same `id` exists, update its body and say what changed instead of duplicating.
4. **Confirm in one line**: "Pinned `<id>` — it now arrives with every matching message." Nothing more.

## Rules

- **Never pin silently.** Always show the entry once before writing — the user is the author of their own rules.
- **Offer proactively.** When the user corrects the same behavior a second time, or says "I told you", offer to pin it — that phrase is the exact pain this skill exists for.
- **Keep catalogs lean.** Past ~20 rules, suggest pruning before adding: an injected rule nobody reads is worse than none. The hook caps injection at 12 rules / ~6,000 characters.
- **User-level vs project-level.** Rules about how the user works everywhere go to `~/.claude/ballast.rules.json`; rules about this project stay in the project. Ask only when it's genuinely ambiguous.
- **Blocks are for danger, not style.** Reserve `action: "block"` for irreversible or costly actions; style preferences are injections.
