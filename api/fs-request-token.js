// api/fs-request-token.js
import crypto from "crypto";

const FS_REQUEST_TOKEN_URL = "https://authentication.fatsecret.com/oauth/request_token";
const FS_AUTHORIZE_URL     = "https://www.fatsecret.com/oauth.aspx";

function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g,"%21").replace(/'/g,"%27")
    .replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/\*/g,"%2A");
}

function buildAuthHeader(method, url, callbackUrl, consumerKey, consumerSecret) {
  const p = {
    oauth_callback:         callbackUrl,
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        String(Math.floor(Date.now()/1000)),
    oauth_version:          "1.0",
  };

  const normalized = Object.keys(p).sort()
    .map(k => `${pct(k)}=${pct(p[k])}`).join("&");

  const base = [method.toUpperCase(), pct(url), pct(normalized)].join("&");
  const signingKey = `${pct(consumerSecret)}&`;
  const sig = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  const all = { ...p, oauth_signature: sig };
  const headerStr = Object.keys(all).sort()
    .map(k => `${pct(k)}="${pct(all[k])}"`).join(", ");

  return `OAuth ${headerStr}`;
}

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const consumerKey    = process.env.FATSECRET_CLIENT_ID;
  const consumerSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({
      error: "Missing env vars",
      hasKey: !!consumerKey,
      hasSecret: !!consumerSecret,
    });
  }

  const appUrl = process.env.VITE_APP_URL || `https://${req.headers.host}`;
  const callbackUrl = `${appUrl}/api/fs-callback?userId=${userId}`;

  const authHeader = buildAuthHeader("POST", FS_REQUEST_TOKEN_URL, callbackUrl, consumerKey, consumerSecret);

  try {
    const response = await fetch(FS_REQUEST_TOKEN_URL, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type":  "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ oauth_callback: callbackUrl }).toString(),
    });

    const text = await response.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    if (!params.oauth_token) {
      return res.status(500).json({
        error:     "No token from FatSecret",
        raw:       text,
        status:    response.status,
        keyLength: consumerKey?.length,
        header:    authHeader,
      });
    }

    res.redirect(302, `${FS_AUTHORIZE_URL}?oauth_token=${params.oauth_token}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
