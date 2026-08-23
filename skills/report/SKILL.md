---
name: report
description: Read the delivery log and say which rules actually fire, which never have, and what to prune or fix. Use when the user asks whether ballast is doing anything, wants to clean up their rule catalog, or on a periodic review.
---

# Report — a rule that never fires is a question, not a decoration

Every delivery is logged — rule ids, counts and sizes only, never prompt text — to `~/.claude/ballast/log.jsonl`. This skill turns that log into decisions: keep, fix, or prune. Without it a catalog only ever grows, and every injected character of a dead rule is paid for by the work.

## Steps

1. **Run the aggregation**: `node "$CLAUDE_PLUGIN_ROOT/hooks/scripts/ballast-rules.mjs" --report` (find the path via `claude plugin list` if the variable is not set). It prints fires per rule, last-fired dates, blocks, rules present in the log but gone from the catalog, and — the load-bearing list — catalog rules that have **never fired**.
2. **Read the never-fired list as symptoms, not verdicts.** A rule can be silent for three different reasons, with three different fixes:
   - **Wrong-language keywords** — the user types Korean, the keywords are English. Fix the keywords (pin skill), don't prune.
   - **Safe-by-default** — a danger block that never fired may be doing its job. Keep, and say why.
   - **Dead weight** — a rule about work the user no longer does. Propose pruning.
3. **Read the top of the table too.** A rule firing on most messages is either genuinely always-relevant (should it be `always: true`, or is it too generic a keyword spamming every turn?) — propose the tightening, with the numbers.
4. **Propose changes one at a time, apply only on approval.** The user is the author of their catalog; the report is evidence, not authority.

## Honesty

- An empty log is reported as exactly that, with its candidate causes (new install / no matches yet / `BALLAST_NO_LOG=1`) — never as "everything works".
- Fire counts measure **delivery, not obedience**. A rule that fired forty times was placed in front of the model forty times; whether it was followed is a different question this log cannot answer.

---

*Part of [ballast](https://github.com/svy04/ballast) — foundations first, every solved path kept, done means checks pass.*
