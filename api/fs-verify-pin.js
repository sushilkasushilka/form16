// api/fs-verify-pin.js — exchanges PIN (oauth_verifier) for permanent access token
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const FS_ACCESS_TOKEN_URL = "https://authentication.fatsecret.com/oauth/access_token";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g,"%21").replace(/'/g,"%27")
    .replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/\*/g,"%2A");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, oauth_token, oauth_token_secret, pin } = req.body;
  if (!userId || !oauth_token || !oauth_token_secret || !pin) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const consumerKey    = process.env.FATSECRET_CLIENT_ID;
  const consumerSecret = process.env.FATSECRET_CLIENT_SECRET;

  const nonce     = crypto.randomBytes(16).toString("hex");
  const timestamp = String(Math.floor(Date.now() / 1000));

  const oauthParams = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        timestamp,
    oauth_token,
    oauth_verifier:         pin.trim(),
    oauth_version:          "1.0",
  };

  const normalized = Object.keys(oauthParams).sort()
    .map(k => `${pct(k)}=${pct(oauthParams[k])}`).join("&");

  const base = ["POST", pct(FS_ACCESS_TOKEN_URL), pct(normalized)].join("&");
  // Sign with consumer secret + temporary token secret
  const signingKey = `${pct(consumerSecret)}&${pct(oauth_token_secret)}`;
  oauthParams.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  try {
    const response = await fetch(FS_ACCESS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(oauthParams).toString(),
    });

    const text = await response.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    if (!params.oauth_token || !params.oauth_token_secret) {
      return res.status(400).json({ error: "Invalid PIN or expired token", raw: text });
    }

    // Save permanent tokens to Supabase
    const { error } = await supabase.from("profiles").update({
      fs_oauth_token:      params.oauth_token,
      fs_oauth_secret:     params.oauth_token_secret,
      fatsecret_connected: true,
    }).eq("id", userId);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
