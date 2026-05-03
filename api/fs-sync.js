// api/fs-sync.js
// Pulls today's food diary from FatSecret and returns calories + protein

import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const FS_API_URL = "https://platform.fatsecret.com/rest/server.api";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function makeOAuth() {
  return OAuth({
    consumer: {
      key:    process.env.FATSECRET_CLIENT_ID,
      secret: process.env.FATSECRET_CLIENT_SECRET,
    },
    signature_method: "HMAC-SHA1",
    hash_function(base, key) {
      return crypto.createHmac("sha1", key).update(base).digest("base64");
    },
  });
}

// FatSecret uses days since Jan 1 1970 as date format
function toFSDate(date = new Date()) {
  const epoch = new Date(1970, 0, 1);
  return Math.floor((date - epoch) / (1000 * 60 * 60 * 24));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  // Get user's FatSecret tokens from Supabase
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("fs_oauth_token, fs_oauth_secret")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.fs_oauth_token) {
    return res.status(400).json({ error: "FatSecret not connected" });
  }

  const oauth = makeOAuth();
  const today = toFSDate();

  const requestData = {
    url: FS_API_URL,
    method: "POST",
    data: {
      method: "food_entries.get.v2",
      date: today,
      format: "json",
    },
  };

  const token = {
    key:    profile.fs_oauth_token,
    secret: profile.fs_oauth_secret,
  };

  const headers = oauth.toHeader(oauth.authorize(requestData, token));

  try {
    const response = await fetch(FS_API_URL, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        method: "food_entries.get.v2",
        date: today,
        format: "json",
      }),
    });

    const data = await response.json();

    // Handle empty diary
    if (data.error || !data.food_entries) {
      return res.status(200).json({ calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 });
    }

    const entries = Array.isArray(data.food_entries.food_entry)
      ? data.food_entries.food_entry
      : [data.food_entries.food_entry];

    // Sum up today's totals
    const totals = entries.reduce((acc, entry) => {
      const n = entry.nutritional_content || {};
      acc.calories += parseFloat(n.calories || 0);
      acc.protein  += parseFloat(n.protein  || 0);
      acc.carbs    += parseFloat(n.carbohydrate || 0);
      acc.fat      += parseFloat(n.fat      || 0);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

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
