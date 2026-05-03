// api/fs-request-token.js
// Step 1 of FatSecret OAuth 1.0a — get a temporary request token
// Then redirect user to FatSecret authorization page

import OAuth from "oauth-1.0a";
import crypto from "crypto";

const FS_REQUEST_TOKEN_URL = "https://authentication.fatsecret.com/oauth/request_token";
const FS_AUTHORIZE_URL     = "https://www.fatsecret.com/oauth.aspx";

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

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const callbackUrl = `${process.env.VITE_APP_URL || "https://form16-git-main-sushilkasushilkas-projects.vercel.app"}/api/fs-callback?userId=${userId}`;

  const oauth = makeOAuth();
  const requestData = {
    url: FS_REQUEST_TOKEN_URL,
    method: "POST",
    data: { oauth_callback: callbackUrl },
  };

  const headers = oauth.toHeader(oauth.authorize(requestData));

  try {
    const response = await fetch(FS_REQUEST_TOKEN_URL, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ oauth_callback: callbackUrl }),
    });

    const text = await response.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    if (!params.oauth_token) {
      return res.status(500).json({ error: "No token from FatSecret", raw: text });
    }

    // Redirect user to FatSecret authorization page
    const authorizeUrl = `${FS_AUTHORIZE_URL}?oauth_token=${params.oauth_token}`;
    res.redirect(302, authorizeUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
