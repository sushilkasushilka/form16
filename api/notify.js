// api/notify.js — sends push notifications to all subscribers
// Called by Vercel Cron at 07:00 and 21:00 Moscow time (04:00 and 18:00 UTC)

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  "mailto:admin@form16.app",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Moscow is UTC+3. Cron runs at 04:00 UTC = 07:00 MSK and 18:00 UTC = 21:00 MSK
const MORNING_UTC_HOUR = 4;
const EVENING_UTC_HOUR = 18;

/**
 * /api/notify — fan out push notifications to every subscriber.
 *
 * Triggered by Vercel Cron at 04:00 and 18:00 UTC (07:00 and 21:00 Moscow).
 *
 * Auth:
 *   Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}` automatically when
 *   the CRON_SECRET env var exists on the project. Manual triggers can use
 *   `x-cron-secret` header or `?secret=` query string with the same value.
 *
 * Behavior:
 *   - GET: only sends during the morning (04–08 UTC) or evening (18–22 UTC)
 *     window. Outside those windows it returns `{ ok: true, message: "Not a notification hour" }`
 *     without sending — this lets the same handler safely tolerate cron misfires.
 *   - POST: forces the morning payload regardless of clock (useful for manual triggers).
 *
 * Responses:
 *   200 { ok: true, sent: number, total: number }
 *   200 { ok: true, sent: 0 }                       — no subscribers
 *   200 { ok: true, message: "Not a notification hour" }
 *   401 { error: "Unauthorized" }                   — bad/missing secret
 *   500 { error: string }                           — DB read failure
 *
 * Side effects:
 *   - Sends a web-push notification to every row in `push_subscriptions`.
 *   - Deletes rows whose endpoint returned 404/410 (expired subscriptions).
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  // Verify cron secret. Vercel Cron uses `Authorization: Bearer <CRON_SECRET>`
  // automatically; the other two forms exist for manual curl/Postman testing.
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const secret = bearer || req.headers["x-cron-secret"] || req.query.secret;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hour = new Date().getUTCHours();
  const isMorning = hour >= 4 && hour <= 8;   // 07:00–11:00 MSK
  const isEvening = hour >= 18 && hour <= 22; // 21:00–01:00 MSK
  const isForced = req.method === "POST";

  if (!isForced && !isMorning && !isEvening) {
    return res.status(200).json({ ok: true, message: "Not a notification hour" });
  }

  // Build notification payload
  const payload = (isForced || isMorning)
    ? { title:"FORM16 — доброе утро 🌅", body:"Встань на весы до завтрака. Это займёт 10 секунд.", tag:"morning-weight", url:"/?action=morning", actions:[{action:"morning",title:"⚖️ Записать вес"}] }
    : { title:"FORM16 — итог дня 🌙", body:"Ты записал всё питание сегодня? Дозапиши, пока не забыл.", tag:"evening-meals", url:"/?action=evening", actions:[{action:"evening",title:"🌙 Внести итог"}] };

  // Get all subscriptions
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  if (!subs || subs.length === 0) return res.status(200).json({ ok: true, sent: 0 });

  // Send to each subscriber
  const results = await Promise.allSettled(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(
          row.subscription,
          JSON.stringify(payload)
        );
        return { ok: true, id: row.user_id };
      } catch (err) {
        // Subscription expired — remove it
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", row.user_id);
        }
        return { ok: false, id: row.user_id, error: err.message };
      }
    })
  );

  const sent = results.filter(r => r.status === "fulfilled" && r.value.ok).length;
  return res.status(200).json({ ok: true, sent, total: subs.length });
}
