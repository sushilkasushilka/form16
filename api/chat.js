// api/chat.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DAILY_LIMIT_FREE = 3;
const DAILY_LIMIT_PAID = 10;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, message } = req.body;
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
        system: systemPrompt,
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
