# memory/ — <project> brain

Purpose: this folder is the durable memory for <project>. Conversations forget; this folder does not. What is recorded here survives topic changes, session resets, and context compaction.

## File map

| File | What | Write rule |
|---|---|---|
| `DECISIONS.md` | Confirmed decisions | Append-only. Supersede protocol — never edit past entries |
| `OPEN-QUESTIONS.md` | Unresolved items awaiting a decision | Table rows. Close with a link to the resolving decision |
| `SESSION-LOG.md` | What happened, per working session | Append, dated |
| `PRODUCT-TRUTH.md` | What the product actually does (if applicable) | Evidence + date only. Three sections: implemented / not / excluded |

## Operating principles

1. **Record in-session.** Decisions and important facts are written the moment they appear, not at the end. Zero loss.
2. **User-confirmed vs AI-proposed are always distinguished.** A proposal the user hasn't confirmed is not a decision.
3. **Claims carry labels** — confirmed / observed / assumed / hearsay / unknown (see the ballast verify-gate skill).
4. **External product claims require truth-file evidence** (see the ballast proof-standard skill).
5. **Unresolved things get registered**, not remembered. If it's not in OPEN-QUESTIONS.md, it will be lost.
