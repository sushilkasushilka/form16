// api/fs-sync.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const FS_API_URL = "https://platform.fatsecret.com/rest/server.api";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g,"%21").replace(/'/g,"%27")
    .replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/\*/g,"%2A");
}

function toFSDate(date = new Date()) {
  return Math.floor((date - new Date(1970,0,1)) / 86400000);
}

// Greens detection — matches food entry names against vegetable keywords.
// Each key is a canonical vegetable; the array contains substrings (lowercased)
// that should map to it. We deliberately exclude the bare words "salad" / "салат"
// because they hit too many composed dishes (оливье, цезарь). When in doubt,
// prefer false negatives — the user can still tick the checkbox manually.
const GREENS_KEYWORDS = {
  spinach:     ["spinach", "шпинат"],
  kale:        ["kale", "кейл"],
  arugula:     ["arugula", "rocket", "руккола", "рукола"],
  lettuce:     ["lettuce", "romaine", "латук", "айсберг"],
  chard:       ["chard", "мангольд"],
  broccoli:    ["broccoli", "брокколи"],
  cauliflower: ["cauliflower", "цветная капуста"],
  brussels:    ["brussels sprout", "брюссельская"],
  cabbage:     ["cabbage", "белокочанная", "краснокочанная", "капуст"],
  cucumber:    ["cucumber", "огурец", "огурц"],
  tomato:      ["tomato", "помидор", "томат"],
  pepper:      ["bell pepper", "sweet pepper", "болгарский перец", "перец слад"],
  carrot:      ["carrot", "морков"],
  zucchini:    ["zucchini", "courgette", "кабачок", "цукини"],
  eggplant:    ["eggplant", "aubergine", "баклажан"],
  pumpkin:     ["pumpkin", "тыкв"],
  beet:        ["beetroot", "свекл"],
  radish:      ["radish", "редис", "редьк"],
  onion:       ["onion", "лук репчат", "лук-пор", "leek"],
  garlic:      ["garlic", "чеснок"],
  asparagus:   ["asparagus", "спаржа"],
  artichoke:   ["artichoke", "артишок"],
  celery:      ["celery", "сельдерей"],
  green_bean:  ["green bean", "стручковая фасоль", "стручк фасол"],
  herbs:       ["parsley", "dill", "cilantro", "basil", "петрушк", "укроп", "кинза", "базилик"],
  greens_misc: ["mixed greens", "salad greens", "зелень", "микс зелен"],
};

const GREENS_THRESHOLD = 2; // distinct vegetable types per day

function detectGreens(entries) {
  const detected = new Set();
  for (const entry of entries) {
    const name = String(entry?.food_entry_name || entry?.food_name || "").toLowerCase();
    if (!name) continue;
    for (const [key, keywords] of Object.entries(GREENS_KEYWORDS)) {
      if (keywords.some(kw => name.includes(kw))) detected.add(key);
    }
  }
  return { greens: detected.size >= GREENS_THRESHOLD, greensDetected: [...detected] };
}

/**
 * POST /api/fs-sync — pull today's diary totals from FatSecret for one user.
 *
 * Request body:
 *   @param {{ userId: string }} body
 *
 * Responses:
 *   200 { calories, protein, carbs, fat, entries, greens, greensDetected, fromFatSecret? }
 *       Numeric totals (rounded), plus a `greens` boolean (true when at least
 *       GREENS_THRESHOLD distinct vegetable types are detected in entry names)
 *       and `greensDetected` listing which canonical vegetables matched.
 *       When the user has no entries today, returns all zeros without
 *       `fromFatSecret`. When entries exist, includes `fromFatSecret: true`
 *       so the client can mark the log accordingly.
 *   400 { error: "Missing userId" | "FatSecret not connected" }
 *   405                                            — non-POST method
 *   500 { error: string }                          — network failure
 *
 * No DB writes — just signs and proxies a `food_entries.get.v2` call to
 * FatSecret using tokens stored on the user's profile.
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("fs_oauth_token, fs_oauth_secret")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.fs_oauth_token)
    return res.status(400).json({ error: "FatSecret not connected" });

  const consumerKey    = process.env.FATSECRET_CLIENT_ID;
  const consumerSecret = process.env.FATSECRET_CLIENT_SECRET;

  const apiParams = {
    format:  "json",
    method:  "food_entries.get.v2",
    date:    String(toFSDate()),
  };

  const oauthParams = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            profile.fs_oauth_token,
    oauth_version:          "1.0",
  };

  // Signature covers both oauth params + api params
  const allParams = { ...oauthParams, ...apiParams };
  const normalized = Object.keys(allParams).sort()
    .map(k => `${pct(k)}=${pct(allParams[k])}`).join("&");

  const base = ["POST", pct(FS_API_URL), pct(normalized)].join("&");
  const signingKey = `${pct(consumerSecret)}&${pct(profile.fs_oauth_secret)}`;
  oauthParams.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  const body = new URLSearchParams({ ...oauthParams, ...apiParams }).toString();

  try {
    const response = await fetch(FS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await response.json();

    if (data.error || !data.food_entries)
      return res.status(200).json({ calories:0, protein:0, carbs:0, fat:0, entries:0, greens:false, greensDetected:[] });

    const entries = Array.isArray(data.food_entries.food_entry)
      ? data.food_entries.food_entry
      : [data.food_entries.food_entry];

    // FatSecret's `food_entries.get.v2` response puts macros directly on each
    // `food_entry` object (per-entry totals already multiplied by servings).
    // We also fall back to a (legacy) nested `nutritional_content` shape just
    // in case the API surface ever returns one — costs nothing and avoids a
    // silent regression if FS changes the schema again.
    const num = (...candidates) => {
      for (const v of candidates) {
        if (v === undefined || v === null) continue;
        const n = parseFloat(v);
        if (!Number.isNaN(n)) return n;
      }
      return 0;
    };
    const totals = entries.reduce((acc, e) => {
      const n = e.nutritional_content || {};
      acc.calories += num(e.calories,     n.calories);
      acc.protein  += num(e.protein,      n.protein);
      acc.carbs    += num(e.carbohydrate, n.carbohydrate);
      acc.fat      += num(e.fat,          n.fat);
      return acc;
    }, { calories:0, protein:0, carbs:0, fat:0 });

    const { greens, greensDetected } = detectGreens(entries);

    return res.status(200).json({
      calories: Math.round(totals.calories),
      protein:  Math.round(totals.protein),
      carbs:    Math.round(totals.carbs),
      fat:      Math.round(totals.fat),
      entries:  entries.length,
      greens,
      greensDetected,
      fromFatSecret: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
