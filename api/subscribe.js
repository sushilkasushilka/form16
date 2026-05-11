// api/subscribe.js — saves push subscription to Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * POST /api/subscribe — register or update a push subscription for a user.
 *
 * Request body:
 *   @param {{ userId: string, subscription: PushSubscriptionJSON }} body
 *     `subscription` is the result of `PushSubscription.toJSON()` from the browser.
 *
 * Responses:
 *   200 { ok: true }
 *   400 { error: "Missing fields" }
 *   405                              — non-POST method
 *   500 { error: string }            — DB write failure
 *
 * Side effects:
 *   Upserts into `push_subscriptions` keyed by `user_id`, so re-subscribing
 *   from the same user (e.g. after permission re-grant) replaces the old row.
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { subscription, userId } = req.body;
  if (!subscription || !userId) return res.status(400).json({ error: "Missing fields" });

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: userId, subscription }, { onConflict: "user_id" });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
