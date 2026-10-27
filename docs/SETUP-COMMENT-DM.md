# Comment → DM: switch on automatic guide DMs

Code: `agent/social/comment_dm.py`, settings in `config/comment-dm.yaml`; it runs inside the publisher every 5 minutes.

**Today (`mode: alert`)**: when someone comments a keyword (e.g. SKILL), you get a Telegram message with their
username, a link to the post, and the DM text to copy. On Instagram: open the comment → **Reply privately** → paste.

**Automatic (`mode: auto`, on since 27 Oct)**: the agent DMs the person itself and replies under the comment
"Sent! Check your DMs 📩". The first DM carries the guide link and asks them to follow @azmin_digital.
`follow_gate: true` (guide only after they follow and reply DONE) is off: while our Meta app is in development mode
Meta blocks the follow-up DM ((#10) outside window, (#230) consent). Turn it on after App Review.
Setting it up takes about 10 minutes, once:

## 1. Instagram app (phone)
Profile → ☰ → **Settings and activity** → **Messages and story replies** → **Message controls** →
**Connected tools** → turn on **Allow access to messages**.

## 2. Give the robot user the DM permission
1. https://business.facebook.com/settings → **Users** → **System users** → `AZMIN_DIGITAL` → **Generate new token**.
2. App: **AZMIN Digital Portal** · Expiration: **Never**.
3. Tick every permission that is already ticked today, **plus `instagram_manage_messages`**.
   If you can't find `instagram_manage_messages`: developers.facebook.com → My apps → AZMIN Digital Portal →
   **Use cases** → **Add use case** → "Manage messaging & content on Instagram" → then generate the token again.
4. Copy the token (shown once). Never paste it in chat.

## 3. Put the new token in GitHub
Repo → **Settings** → **Secrets and variables** → **Actions** → `META_ACCESS_TOKEN` → **Update** → paste → save.

## 4. Tell Claude Code "DM token done"
Claude runs the read-only meta-check, switches `mode` to `auto` on a branch and asks you to comment
SKILL from a friend's account as a live test.

**Note:** our Meta app is in development mode. If Meta only lets it DM people who have a role on the app,
the test DM fails, nothing is sent, and you keep getting the Telegram alerts. The fix then is Meta's App Review
for `instagram_manage_messages` (needs business verification and a short screen recording), which Claude can prepare.
