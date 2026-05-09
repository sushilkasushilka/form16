// api/fs-request-token.js — OOB mode: returns token for PIN-based auth
import crypto from "crypto";

const FS_REQUEST_TOKEN_URL = "https://authentication.fatsecret.com/oauth/request_token";
const FS_AUTHORIZE_URL     = "https://www.fatsecret.com/oauth/authorize";

function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g,"%21").replace(/'/g,"%27")
    .replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/\*/g,"%2A");
}

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const consumerKey    = process.env.FATSECRET_CLIENT_ID;
  const consumerSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  const nonce     = crypto.randomBytes(16).toString("hex");
  const timestamp = String(Math.floor(Date.now() / 1000));

  // Use "oob" (out-of-band) — FatSecret shows PIN instead of redirecting
  const oauthParams = {
    oauth_callback:         "oob",
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        timestamp,
    oauth_version:          "1.0",
  };

  const normalized = Object.keys(oauthParams).sort()
    .map(k => `${pct(k)}=${pct(oauthParams[k])}`).join("&");

  const base = ["POST", pct(FS_REQUEST_TOKEN_URL), pct(normalized)].join("&");
  const signingKey = `${pct(consumerSecret)}&`;
  oauthParams.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  try {
    const response = await fetch(FS_REQUEST_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(oauthParams).toString(),
    });

    const text = await response.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    if (!params.oauth_token) {
      return res.status(500).json({ error: "No token", raw: text });
    }

    // Return token + authorize URL — app will open URL and ask user for PIN
    return res.status(200).json({
      oauth_token:        params.oauth_token,
      oauth_token_secret: params.oauth_token_secret,
      authorize_url:      `${FS_AUTHORIZE_URL}?oauth_token=${params.oauth_token}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
