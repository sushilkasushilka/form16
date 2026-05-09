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
  const { userId, debug } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const consumerKey    = process.env.FATSECRET_CLIENT_ID;
  const consumerSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  const appUrl = process.env.VITE_APP_URL || `https://${req.headers.host}`;
  const callbackUrl = `${appUrl}/api/fs-callback?userId=${userId}`;

  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = String(Math.floor(Date.now() / 1000));

  const oauthParams = {
    oauth_callback:         callbackUrl,
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
  const signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  oauthParams.oauth_signature = signature;

  const body = new URLSearchParams(oauthParams).toString();

  try {
    const response = await fetch(FS_REQUEST_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const text = await response.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    // Debug mode — show full response without redirecting
    if (debug === "1") {
      return res.status(200).json({
        httpStatus: response.status,
        rawResponse: text,
        parsedParams: params,
        requestBody: body,
        signatureBase: base,
        callbackUrl,
        hasToken: !!params.oauth_token,
        hasConfirmed: params.oauth_callback_confirmed,
        authorizeUrl: params.oauth_token
          ? `${FS_AUTHORIZE_URL}?oauth_token=${params.oauth_token}`
          : null,
      });
    }

    if (!params.oauth_token) {
      return res.status(500).json({ error: "No token", raw: text, status: response.status });
    }

    // Store token secret in a short-lived cookie so callback can use it
    res.setHeader("Set-Cookie", `fs_token_secret=${params.oauth_token_secret}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    res.redirect(302, `${FS_AUTHORIZE_URL}?oauth_token=${params.oauth_token}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
