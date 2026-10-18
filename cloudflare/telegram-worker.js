// AZMIN DIGITAL — Telegram instant-reply worker (Cloudflare Workers, free plan).
// Telegram sends every bot update here (webhook). The worker:
//   • answers ✅/❌ taps instantly and records them by starting the GitHub "telegram-inbox" workflow
//   • forwards clips/photos Jabir sends so GitHub saves them to media/inbox
// Secrets (Worker → Settings → Variables and Secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
// WEBHOOK_SECRET, GH_TOKEN (fine-grained token: this repo, Contents read/write). Plain variable: GH_REPO.
// Cron Trigger (Worker → Settings → Triggers → Cron Triggers): "*/5 * * * *" starts the publisher every
// 5 minutes, so scheduled posts go out on time even when GitHub's own timer is late.

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(fetch(`https://api.github.com/repos/${env.GH_REPO}/dispatches`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.GH_TOKEN}`, accept: "application/vnd.github+json",
        "user-agent": "azmin-telegram-worker", "content-type": "application/json",
      },
      body: JSON.stringify({ event_type: "publish" }),
    }));
  },

  async fetch(request, env) {
    if (request.method !== "POST") return new Response("AZMIN Telegram worker is running.");
    if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }
    const update = await request.json();
    const cq = update.callback_query;
    const msg = update.message || (cq && cq.message);
    if (!msg || String(msg.chat.id) !== String(env.TELEGRAM_CHAT_ID)) return new Response("ignored"); // only Jabir's chat

    const tg = (method, body) =>
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
    const toGitHub = () =>
      fetch(`https://api.github.com/repos/${env.GH_REPO}/dispatches`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.GH_TOKEN}`, accept: "application/vnd.github+json",
          "user-agent": "azmin-telegram-worker", "content-type": "application/json",
        },
        body: JSON.stringify({ event_type: "telegram", client_payload: { update } }),
      });

    if (cq) {
      const action = (cq.data || "").split(":")[0];
      if (action !== "approve" && action !== "reject") {
        await tg("answerCallbackQuery", { callback_query_id: cq.id });
        return new Response("ok");
      }
      const saved = (await toGitHub()).status === 204;
      const label = !saved ? "⚠️ Not saved — please tap again" : action === "approve" ? "✅ Approved" : "❌ Rejected";
      await tg("answerCallbackQuery", { callback_query_id: cq.id, text: label });
      if (saved) {
        await tg("editMessageReplyMarkup", {
          chat_id: msg.chat.id, message_id: msg.message_id,
          reply_markup: { inline_keyboard: [[{ text: `${label} · saving…`, callback_data: "noop" }]] },
        });
      }
      return new Response("ok");
    }

    const m = update.message;
    if (m.video || m.document || m.photo) {
      const saved = (await toGitHub()).status === 204;
      await tg("sendMessage", {
        chat_id: m.chat.id, reply_to_message_id: m.message_id,
        text: saved ? "📥 Got it — saving to the media inbox (about 1 min)" : "⚠️ Couldn't save — please send it again",
      });
    }
    return new Response("ok");
  },
};
