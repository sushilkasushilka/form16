// api/subscribe.js — saves push subscription to Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
