# Publish checklist — before anything leaves a Claude-operated workspace

Why this exists: the leak vector is *convenience*. Public reports from 2026 include hundreds of npm packages that shipped `.claude/settings.local.json` (some with live credentials — the file records full approved command strings, including any inline `API_KEY=...`), live keys found in session transcript `.jsonl` files, and a major vendor shipping its internal `CLAUDE.md` files inside a signed mobile app. Dedicated scanners like [claudleak](https://github.com/hazcod/claudleak) exist because this keeps happening.

## Never commit

- [ ] `.claude/settings.local.json` — approved-command log; treat as a secrets file
- [ ] Session transcripts (`*.jsonl`) and agent logs
- [ ] `.env` and friends (allow only a scrubbed `.env.example`)
- [ ] Live `memory/` files — decisions, session logs, and truth files describe your real business
- [ ] MCP / tool configs carrying tokens (`.claude.json`, `.mcp.json` with auth blocks)

## Before the first push

1. **Fresh-clone review.** Clone into a new folder and read every file as a stranger would. You are not looking for code bugs; you are looking for *your life* in the files.
2. **Grep the tree** (including dotfiles) for:
   - key patterns: `sk-ant-`, `sk-`, `ghp_`, `github_pat_`, `AKIA`, `xox`, `Bearer `
   - your company and product names, teammates' real names
   - internal hostnames, dashboards, ticket URLs
   - absolute personal paths (`C:\Users\<you>`, `/Users/<you>/`)
   - currency amounts and revenue-ish numbers that came from real work
3. **Check `.gitignore`** covers the Never-commit list *before* the first commit — ignoring after the fact does not remove files already tracked.
4. **History is forever.** If a secret was ever committed, deleting the file does not help — rewrite history or (better) **rotate the secret** and assume it burned.
5. **Templates over redaction.** Don't scrub a real file and publish it; write a clean template from scratch and diff it against nothing. Redaction misses; blank pages don't.

## Repeat offenders (check on every release, not just the first)

- New scripts that hardcode a token "just for now"
- Screenshots and asset files with names, dashboards, or numbers in-frame
- Example configs updated by copying your real config
