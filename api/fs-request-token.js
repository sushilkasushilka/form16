// api/fs-request-token.js
import crypto from "crypto";

const FS_REQUEST_TOKEN_URL = "https://authentication.fatsecret.com/oauth/request_token";
const FS_AUTHORIZE_URL     = "https://www.fatsecret.com/oauth.aspx";

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
    return res.status(500).json({ error: "Missing env vars", hasKey: !!consumerKey, hasSecret: !!consumerSecret });
  }

  const appUrl = process.env.VITE_APP_URL || `https://${req.headers.host}`;
  const callbackUrl = `${appUrl}/api/fs-callback?userId=${userId}`;

  // Build OAuth params — send in POST body, not Authorization header
  const oauthParams = {
    oauth_callback:         callbackUrl,
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_version:          "1.0",
  };

  // Build signature base string
  const normalized = Object.keys(oauthParams).sort()
    .map(k => `${pct(k)}=${pct(oauthParams[k])}`).join("&");

  const base = [
    "POST",
    pct(FS_REQUEST_TOKEN_URL),
    pct(normalized),
  ].join("&");

  const signingKey = `${pct(consumerSecret)}&`;
  oauthParams.oauth_signature = crypto
    .createHmac("sha1", signingKey)
    .update(base)
    .digest("base64");

  try {
    const body = new URLSearchParams(oauthParams).toString();

    const response = await fetch(FS_REQUEST_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const text = await response.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    if (!params.oauth_token) {
      return res.status(500).json({
        error:  "No token from FatSecret",
        raw:    text,
        status: response.status,
        base:   base.substring(0, 200),
      });
    }

    res.redirect(302, `${FS_AUTHORIZE_URL}?oauth_token=${params.oauth_token}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
