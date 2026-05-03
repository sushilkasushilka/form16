// api/fs-callback.js
// Step 2 of FatSecret OAuth 1.0a — user approved, exchange for permanent token
// FatSecret redirects here with oauth_token + oauth_verifier

import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const FS_ACCESS_TOKEN_URL = "https://authentication.fatsecret.com/oauth/access_token";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function makeOAuth(tokenSecret = "") {
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

export default async function handler(req, res) {
  const { oauth_token, oauth_verifier, userId } = req.query;

  if (!oauth_token || !oauth_verifier || !userId) {
    return res.status(400).json({ error: "Missing OAuth params" });
  }

  const oauth = makeOAuth();
  const requestData = {
    url: FS_ACCESS_TOKEN_URL,
    method: "POST",
    data: { oauth_verifier },
  };

  // Sign with the temporary token
  const token = { key: oauth_token, secret: "" };
  const headers = oauth.toHeader(oauth.authorize(requestData, token));

  try {
    const response = await fetch(FS_ACCESS_TOKEN_URL, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ oauth_verifier }),
    });

    const text = await response.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    if (!params.oauth_token || !params.oauth_token_secret) {
      return res.status(500).json({ error: "No access token", raw: text });
    }

    // Save permanent token to Supabase
    const { error } = await supabase
      .from("profiles")
      .update({
        fs_oauth_token:  params.oauth_token,
        fs_oauth_secret: params.oauth_token_secret,
        fatsecret_connected: true,
      })
      .eq("id", userId);

    if (error) return res.status(500).json({ error: error.message });

    // Redirect back to the app
    const appUrl = process.env.VITE_APP_URL || "https://form16-git-main-sushilkasushilkas-projects.vercel.app";
    res.redirect(302, `${appUrl}/?fs_connected=1`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
