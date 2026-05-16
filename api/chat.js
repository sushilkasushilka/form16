// api/chat.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DAILY_LIMIT_FREE = 3;
const DAILY_LIMIT_PAID = 10;

/**
 * POST /api/chat — send a message to the AI coach.
 *
 * Request body:
 *   @param {{ userId: string, message: string }} body
 *
 * Responses:
 *   200 { reply: string, remaining: number, limit: number, isSubscribed: boolean }
 *   400 { error: "Missing fields" }                — userId or message missing
 *   404 { error: "Profile not found" }             — userId has no profiles row
 *   405                                            — non-POST method
 *   429 { error: "limit_reached", limit, isSubscribed }
 *                                                  — daily message cap hit
 *   500 { error: string | "No response from AI" }  — Claude or DB failure
 *
 * Side effects:
 * - Inserts user message into `messages` (read_by_coach=false).
 * - Inserts assistant reply into `messages` (read_by_coach=false).
 * - Bumps profiles.daily_ai_count and resets profiles.daily_ai_date when a new day rolls over.
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, message, userContext: clientCtx } = req.body;
  if (!userId || !message) return res.status(400).json({ error: "Missing fields" });

  // Load profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) return res.status(404).json({ error: "Profile not found" });

  // Check daily message limit
  const today = new Date().toISOString().split("T")[0];
  const isSubscribed = profile.is_subscribed;
  const limit = isSubscribed ? DAILY_LIMIT_PAID : DAILY_LIMIT_FREE;
  const lastDate = profile.daily_ai_date;
  const count = lastDate === today ? (profile.daily_ai_count || 0) : 0;

  if (count >= limit) {
    return res.status(429).json({
      error: "limit_reached",
      limit,
      isSubscribed,
    });
  }

  // Load last 10 messages for context
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const messages = (history || []).reverse();

  // Build system prompt with full user context
  const userGlobalDay = profile.joined_at
    ? Math.max(0, Math.floor((new Date() - new Date(profile.joined_at)) / 86400000))
    : 0;
  const currentWeek = Math.max(1, Math.ceil(userGlobalDay / 7));

  const systemPrompt = `Ты персональный тренер и нутрициолог в фитнес-приложении FORM16. Ты общаешься с пользователем на русском языке. Ты дружелюбный, мотивирующий и даёшь конкретные, практичные советы.

Информация о пользователе:
- Имя: ${profile.name}
- Возраст: ${profile.age} лет
- Рост: ${profile.height} см
- Вес: ${profile.weight} кг
- Цель: ${profile.goal === "fat_loss" ? "снижение жира" : profile.goal === "recomp" ? "рекомпозиция" : "здоровье"}
- TDEE: ${profile.tdee || "не указан"} ккал
- Целевые калории: ${profile.daily_calories || "не указаны"} ккал
- Целевой белок: ${profile.daily_protein || "не указан"} г
- Текущая неделя программы: ${currentWeek} из 16
- День программы: ${userGlobalDay}
- Стресс: ${profile.stress}/5
- Сон: ${profile.sleep}/5
- Качество питания: ${profile.diet_quality}/5
- Уровень активности: ${profile.activity || "умеренный"}
- Опыт тренировок: ${profile.training_exp || "не указан"}

Правила:
- Отвечай кратко и по делу (2-4 предложения максимум если не просят подробно)
- Используй данные пользователя в ответах — обращайся к его реальным цифрам
- Если вопрос не связан с фитнесом или питанием — вежливо направь обратно к теме
- Никогда не рекомендуй медицинские препараты
- Всегда поддерживай и мотивируй`;

  // ─── V2 ADDENDUM (Phase I §10.2) ─────────────────────────────────────
  // userContext is sent by the v2 client. Older clients omit it; fall back
  // to fields the server can derive from `profile` so the addendum is
  // always populated.
  const userCtx = {
    name:             clientCtx?.name             ?? profile.name,
    previousAttempts: clientCtx?.previousAttempts ?? profile.previous_attempts ?? "never",
    initialWhy:       clientCtx?.initialWhy       ?? profile.initial_why       ?? null,
    currentDay:       clientCtx?.currentDay       ?? userGlobalDay,
    currentWeek:      clientCtx?.currentWeek      ?? currentWeek,
  };

  const v2Addendum = `

USER CONTEXT (always available, do not repeat back to user unprompted):
- Name: ${userCtx.name}
- Previous fat-loss attempts: ${userCtx.previousAttempts} (one of: never, 1_2, 3_5, many)
- User's stated "why": ${userCtx.initialWhy || "(not set yet)"}
- Current day: ${userCtx.currentDay} / 112
- Current week: ${userCtx.currentWeek} / 16

VOCABULARY RULES (Russian):
- Never use: "диета", "сила воли", "читмил", "срыв", "силу воли", "ограничивать себя", "бороться с весом", "сбросить вес".
- Use instead: "план", "система", "эксперимент", "данные", "паттерн", "снижать жировую массу".
- Reframe past failures as data points, never as failures.

VOCABULARY RULES (English):
- Never use: "diet", "willpower", "cheat day/meal", "fall off the wagon", "lose weight".
- Use instead: "plan", "system", "experiment", "data", "pattern", "reduce body fat".

DAY-GATED TOPIC RULES:
- Before Day 18: do NOT recommend specific calorie targets. If asked, say: "We calculate yours on Day 18. Until then, focus on the current week's theme."
- Before Day 20: do NOT recommend food tracking. If asked, say: "Food tracking opens on Day 20. Until then we work on the why, not the what."
- Before Day 24: do NOT recommend specific protein numbers in g/kg. General "more protein" is fine.
- Before Day 33: do NOT recommend specific step targets.
- Before Day 92: training questions are answered as education only, not as prescriptive workouts.

TONE BY previousAttempts:
- "never": Encouraging, scientific, explains the basics, doesn't assume prior knowledge.
- "1_2": Acknowledges some experience. Asks what didn't work before.
- "3_5": Treats user as informed. Focus on systems, not information.
- "many": Treats user as expert. Explicitly acknowledges that information isn't the problem. Focus on identity, environment, and behavioral architecture.

If userContext.initialWhy is set, you can reference it occasionally (not every message) — anchor the user back to their stated reason when motivation comes up.`;

  const finalSystemPrompt = systemPrompt + v2Addendum;

  // Save user message to DB
  await supabase.from("messages").insert({
    user_id: userId,
    role: "user",
    content: message,
    read_by_coach: false,
  });

  // Call Claude API
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: finalSystemPrompt,
        messages: [
          ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text;

    if (!reply) return res.status(500).json({ error: "No response from AI" });

    // Save AI reply to DB
    await supabase.from("messages").insert({
      user_id: userId,
      role: "assistant",
      content: reply,
      read_by_coach: false,
    });

    // Update daily count
    await supabase.from("profiles").update({
      daily_ai_count: count + 1,
      daily_ai_date: today,
    }).eq("id", userId);

    return res.status(200).json({
      reply,
      remaining: limit - count - 1,
      limit,
      isSubscribed,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
