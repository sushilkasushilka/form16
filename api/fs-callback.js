// api/fs-callback.js
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
  const { oauth_token, oauth_verifier, userId } = req.query;
  if (!oauth_token || !oauth_verifier || !userId)
    return res.status(400).json({ error: "Missing OAuth params" });

  const consumerKey    = process.env.FATSECRET_CLIENT_ID;
  const consumerSecret = process.env.FATSECRET_CLIENT_SECRET;

  const oauthParams = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token,
    oauth_verifier,
    oauth_version:          "1.0",
  };

  const normalized = Object.keys(oauthParams).sort()
    .map(k => `${pct(k)}=${pct(oauthParams[k])}`).join("&");

  const base = ["POST", pct(FS_ACCESS_TOKEN_URL), pct(normalized)].join("&");
  const signingKey = `${pct(consumerSecret)}&`; // no token secret at this stage
  oauthParams.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  try {
    const response = await fetch(FS_ACCESS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(oauthParams).toString(),
    });

    const text = await response.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    if (!params.oauth_token || !params.oauth_token_secret)
      return res.status(500).json({ error: "No access token", raw: text });

    const { error } = await supabase.from("profiles").update({
      fs_oauth_token:      params.oauth_token,
      fs_oauth_secret:     params.oauth_token_secret,
      fatsecret_connected: true,
    }).eq("id", userId);

    if (error) return res.status(500).json({ error: error.message });

    const appUrl = process.env.VITE_APP_URL || `https://${req.headers.host}`;
    res.redirect(302, `${appUrl}/?fs_connected=1`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
