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

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map(c => c.trim().split("=").map(decodeURIComponent))
  );
}

/**
 * GET /api/fs-callback — legacy redirect-based FatSecret OAuth callback.
 *
 * The current flow uses the PIN variant (fs-request-token + fs-verify-pin) and
 * does not hit this handler. This is kept for FatSecret app configurations that
 * still have a registered redirect URL.
 *
 * Query params:
 *   @param {string} oauth_token     — temporary token from request_token step
 *   @param {string} oauth_verifier  — verifier appended by FatSecret
 *   @param {string} userId          — Supabase profile id round-tripped via the URL
 *
 * Cookies:
 *   Reads `fs_token_secret` set by /api/fs-request-token (when in cookie mode).
 *
 * Responses:
 *   302  → redirects to `${VITE_APP_URL}/?fs_connected=1` on success
 *   400 { error: "Missing OAuth params" }
 *   500 { error: "No access token", raw? } | { error: string }
 *
 * Side effects:
 *   On success, sets `profiles.fs_oauth_token`, `profiles.fs_oauth_secret`, and
 *   `profiles.fatsecret_connected = true`, then clears the fs_token_secret cookie.
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  const { oauth_token, oauth_verifier, userId } = req.query;
  if (!oauth_token || !oauth_verifier || !userId)
    return res.status(400).json({ error: "Missing OAuth params" });

  const consumerKey    = process.env.FATSECRET_CLIENT_ID;
  const consumerSecret = process.env.FATSECRET_CLIENT_SECRET;

  // Get token secret from cookie set by fs-request-token
  const cookies = parseCookies(req.headers.cookie);
  const tokenSecret = cookies.fs_token_secret || "";

  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = String(Math.floor(Date.now() / 1000));

  const oauthParams = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        timestamp,
    oauth_token,
    oauth_verifier,
    oauth_version:          "1.0",
  };

  const normalized = Object.keys(oauthParams).sort()
    .map(k => `${pct(k)}=${pct(oauthParams[k])}`).join("&");

  const base = ["POST", pct(FS_ACCESS_TOKEN_URL), pct(normalized)].join("&");
  // Sign with consumer secret + token secret
  const signingKey = `${pct(consumerSecret)}&${pct(tokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  oauthParams.oauth_signature = signature;

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

    // Clear the token secret cookie
    res.setHeader("Set-Cookie", "fs_token_secret=; Path=/; HttpOnly; Max-Age=0");

    const appUrl = process.env.VITE_APP_URL || `https://${req.headers.host}`;
    res.redirect(302, `${appUrl}/?fs_connected=1`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
