# Start here (cloud setup, no files on your PC)

1. The kit is already in this repo.
2. Open **claude.ai/code**, connect GitHub, and start a session on `Mjabir07/azmin-digital-ads-agent`.
3. Paste the prompt below as your first message.

---

```
Hi Claude. I'm Jabir from AZMIN DIGITAL. Read CLAUDE.md, docs/PLAYBOOK.md, docs/SPEC.md and
docs/SETUP.md first.

I'm new to coding and Meta ads, and I keep everything in the cloud (GitHub), nothing on my PC.
Go one step at a time and explain simply.

Goal: build Phase 1 (the read-only daily reporting agent) from SPEC.md.
1. Check the repo has every kit file.
2. Create the Python project (uv, package "agent"), config files and .gitignore.
3. Walk me through getting my Meta read token, Telegram bot, Claude API key and Google
   service account, and tell me exactly which GitHub Secrets to add.
4. Build fetch_insights, the rules engine (with tests), the Google Sheets writer and the daily report.
5. Run it once in dry-run mode with sample data and show me the report.
6. Commit to a branch, open a pull request, and tell me how to run the workflow from the Actions tab.

Ask me before using any token or changing anything on Meta.
```
