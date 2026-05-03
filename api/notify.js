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

export default async function handler(req, res) {
  // Verify cron secret
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hour = new Date().getUTCHours();
  const isMorning = hour === MORNING_UTC_HOUR;
  const isEvening = hour === EVENING_UTC_HOUR;
  const isForced = req.method === "POST"; // POST = force send regardless of hour

  if (!isForced && !isMorning && !isEvening) {
    return res.status(200).json({ ok: true, message: "Not a notification hour" });
  }

  // Build notification payload
  const payload = (isForced || isMorning)
    ? {
        title: "FORM16 — доброе утро",
        body: "Встань на весы до завтрака и запиши вес. Это займёт 30 секунд.",
        tag: "morning-weight",
        url: "/?action=log",
        actions: [{ action: "log", title: "Записать вес" }],
      }
    : {
        title: "FORM16 — итог дня",
        body: "Ты записал всё питание сегодня? Дозапиши, пока не забыл.",
        tag: "evening-meals",
        url: "/?action=log",
        actions: [{ action: "log", title: "Дозаписать" }],
      };

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
