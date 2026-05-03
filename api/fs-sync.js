// api/fs-sync.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const FS_API_URL = "https://platform.fatsecret.com/rest/server.api";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g,"%21").replace(/'/g,"%27")
    .replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/\*/g,"%2A");
}

function toFSDate(date = new Date()) {
  return Math.floor((date - new Date(1970,0,1)) / 86400000);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("fs_oauth_token, fs_oauth_secret")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.fs_oauth_token)
    return res.status(400).json({ error: "FatSecret not connected" });

  const consumerKey    = process.env.FATSECRET_CLIENT_ID;
  const consumerSecret = process.env.FATSECRET_CLIENT_SECRET;

  const apiParams = {
    format:  "json",
    method:  "food_entries.get.v2",
    date:    String(toFSDate()),
  };

  const oauthParams = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            profile.fs_oauth_token,
    oauth_version:          "1.0",
  };

  // Signature covers both oauth params + api params
  const allParams = { ...oauthParams, ...apiParams };
  const normalized = Object.keys(allParams).sort()
    .map(k => `${pct(k)}=${pct(allParams[k])}`).join("&");

  const base = ["POST", pct(FS_API_URL), pct(normalized)].join("&");
  const signingKey = `${pct(consumerSecret)}&${pct(profile.fs_oauth_secret)}`;
  oauthParams.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  const body = new URLSearchParams({ ...oauthParams, ...apiParams }).toString();

  try {
    const response = await fetch(FS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await response.json();

    if (data.error || !data.food_entries)
      return res.status(200).json({ calories:0, protein:0, carbs:0, fat:0, entries:0 });

    const entries = Array.isArray(data.food_entries.food_entry)
      ? data.food_entries.food_entry
      : [data.food_entries.food_entry];

    const totals = entries.reduce((acc, e) => {
      const n = e.nutritional_content || {};
      acc.calories += parseFloat(n.calories||0);
      acc.protein  += parseFloat(n.protein||0);
      acc.carbs    += parseFloat(n.carbohydrate||0);
      acc.fat      += parseFloat(n.fat||0);
      return acc;
    }, { calories:0, protein:0, carbs:0, fat:0 });

    return res.status(200).json({
      calories: Math.round(totals.calories),
      protein:  Math.round(totals.protein),
      carbs:    Math.round(totals.carbs),
      fat:      Math.round(totals.fat),
      entries:  entries.length,
      fromFatSecret: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
