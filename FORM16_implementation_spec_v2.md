# FORM16 — Implementation Spec for Claude Code (v2)

**Scope:** Onboarding rework + Week 1–2 home screen progressive disclosure + AI trainer reframing + Day 0 fixes + curriculum scaffolding
**Target codebase:** Modular React structure in `src/` (post-optimization)
**Reference content file:** `FORM16_112_day_curriculum.md` (the 112-day theme list)

---

## CRITICAL READ FIRST

These four gotchas have caused bugs in this project before. Every change below assumes you're following them:

1. **Translation function is named `t`.** Never use `t` as a loop variable, map argument, callback parameter, or any local name. Anywhere you map over translated items inside JSX, use `item`, `entry`, `dayObj` — never `t`.
2. **All hooks before any conditional return.** `useState`, `useEffect`, etc. must be called unconditionally on every render of a component.
3. **DB column names are `snake_case`. JS uses `camelCase`.** Every new field needs both sides — the read mapping in `App.jsx::loadProfile` and the write mapping in `App.jsx::saveProfile` / `App.jsx::updateProfile`.
4. **Logic literals stay English.** Strings used in `if`/`switch` (e.g. `mode === "signup"`) are never translated. Only labels visible to the user go through `t()`.

---

## EXECUTION ORDER

Do the work in this order. Each phase is independently testable; don't move on until the previous one builds and renders without errors.

1. **Phase A — Foundation:** Schema migration + new i18n keys (sections 1–2)
2. **Phase B — Helpers:** New utility module for feature unlocks (section 3)
3. **Phase C — Day 0 fix:** Localize hardcoded strings + remove food references (section 4)
4. **Phase D — Onboarding rewrite:** New `SignUp.jsx` (section 5)
5. **Phase E — Welcome screen:** Updated `Day0Screen.jsx` with conditional copy + Why anchor + locked previews (section 6)
6. **Phase F — Member dashboard locks:** Progressive disclosure in `MemberDashboard.jsx` (section 7)
7. **Phase G — Log modal gating:** Wrap food-logging in `LogModals.jsx` and `FatSecretConnect.jsx` (section 8)
8. **Phase H — Carousel + tips fixes:** `DailyTaskCarousel.jsx` and `WeekendTipsBar.jsx` (section 9)
9. **Phase I — AI trainer reframing:** `Chat.jsx` plus `/api/chat` system prompt (section 10)
10. **Phase J — Curriculum scaffolding:** `program.js` structure update + Week 1–2 content example (section 11)
11. **Phase K — Migration + cleanup:** Existing user handling, final test pass (section 12)

---

## 1. SUPABASE SCHEMA CHANGES

Run this SQL against the `profiles` table. All columns are nullable so existing users don't break.

```sql
ALTER TABLE profiles
  ADD COLUMN previous_attempts text CHECK (previous_attempts IN ('never','1_2','3_5','many')),
  ADD COLUMN initial_why text,
  ADD COLUMN scoff_score integer CHECK (scoff_score >= 0 AND scoff_score <= 5),
  ADD COLUMN scoff_completed_at timestamptz,
  ADD COLUMN scoff_acknowledged_risk boolean DEFAULT false,
  ADD COLUMN medical_conditions text[],
  ADD COLUMN onboarding_version integer DEFAULT 1,
  ADD COLUMN keystone_habit text,
  ADD COLUMN morning_reminder_time text DEFAULT '07:00',
  ADD COLUMN evening_reminder_time text DEFAULT '21:00';

-- Mark all existing users as v1 so the routing logic can keep them on the old flow
UPDATE profiles SET onboarding_version = 1 WHERE onboarding_version IS NULL;
```

Create a new table for daily identity reflections (Days 4–14):

```sql
CREATE TABLE IF NOT EXISTS daily_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number BETWEEN 4 AND 14),
  prompt_key text NOT NULL,
  response text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_number)
);

CREATE INDEX idx_daily_reflections_user ON daily_reflections(user_id);
```

After the migration:
- Existing users: `onboarding_version = 1`, see existing SignUp.jsx flow
- New signups: `onboarding_version = 2`, see new SignUp.jsx flow
- Feature unlock logic (food diary at Day 20, steps at Day 33, etc.) applies to BOTH versions based on `getUserGlobalDay(profile)`

---

## 2. i18n ADDITIONS — `src/lang.js`

Append the following to the `TRANSLATIONS` object in `lang.js`. **Do not modify or remove any existing keys** — old SignUp flow still uses `step.1.title` through `step.6.title` and existing users need those.

Add a section comment block before this block:

```javascript
// ─── ONBOARDING V2 (NEW FLOW) ─────────────────────────────────────────────
// Used by the rewritten SignUp.jsx for users with onboarding_version=2.
// The original "step.N.title" keys above remain in use for legacy v1 users.

"v2.step1.title":          { en: "Before we start", ru: "Прежде чем начать" },
"v2.step1.subtitle":       { en: "Two questions that shape the next 16 weeks", ru: "Два вопроса определят следующие 16 недель" },
"v2.attempts.label":       { en: "How many times have you tried to lose weight before?", ru: "Сколько раз ты уже пытался снизить вес?" },
"v2.attempts.never":       { en: "This is my first time", ru: "Это первый раз" },
"v2.attempts.1_2":         { en: "1–2 times", ru: "1–2 раза" },
"v2.attempts.3_5":         { en: "3–5 times", ru: "3–5 раз" },
"v2.attempts.many":        { en: "Many times", ru: "Много раз" },
"v2.attempts.hint":        { en: "This shapes how the program speaks to you", ru: "От ответа зависит, как программа будет говорить с тобой" },
"v2.why.label":            { en: "In one sentence — why this, why now?", ru: "В одном предложении — зачем тебе это в этот раз?" },
"v2.why.placeholder":      { en: "e.g. To play with my daughter without getting tired", ru: "напр. Чтобы легко играть с дочкой и не уставать" },
"v2.why.hint":             { en: "Optional — you'll work on this deeper on Day 3", ru: "Можно пропустить — глубже разберём на 3-й день" },

"v2.step2.title":          { en: "Basic data", ru: "Базовые данные" },
"v2.step2.subtitle":       { en: "Only what's actually needed", ru: "Только то, что действительно нужно" },
"v2.weight.hint":          { en: "A starting point, not a verdict", ru: "Точка отсчёта, не приговор" },

"v2.step3.title":          { en: "Safety check", ru: "Безопасность" },
"v2.step3.subtitle":       { en: "To make sure the program fits you right now", ru: "Чтобы программа подошла именно тебе сейчас" },
"v2.conditions.label":     { en: "Does any of this apply to you?", ru: "Есть ли у тебя что-то из этого?" },
"v2.conditions.thyroid":   { en: "Thyroid condition", ru: "Заболевания щитовидной железы" },
"v2.conditions.diabetes1": { en: "Type 1 diabetes", ru: "Диабет 1 типа" },
"v2.conditions.diabetes2": { en: "Type 2 diabetes", ru: "Диабет 2 типа" },
"v2.conditions.meds":      { en: "On medication that affects weight", ru: "Принимаю препараты, влияющие на вес" },
"v2.conditions.pregnancy": { en: "Pregnant or breastfeeding", ru: "Беременность или кормление грудью" },
"v2.conditions.none":      { en: "None of the above", ru: "Ничего из перечисленного" },
"v2.pregnancy.block.title":{ en: "This program isn't right for now", ru: "Программа не подходит сейчас" },
"v2.pregnancy.block.body": { en: "Fat loss isn't recommended during pregnancy or breastfeeding. Come back after.", ru: "Снижение жировой массы во время беременности и кормления не рекомендуется. Возвращайся после." },

"v2.scoff.intro.title":    { en: "5 quick questions", ru: "5 коротких вопросов" },
"v2.scoff.intro.body":     { en: "Standard screening about your relationship with food. Helps us make sure the program fits you right now.", ru: "Стандартный скрининг отношения с едой. Помогает убедиться, что программа подходит тебе сейчас." },
"v2.scoff.q1":             { en: "Do you make yourself sick because you feel uncomfortably full?", ru: "Заставляешь ли ты себя вырвать, чувствуя себя некомфортно сытым?" },
"v2.scoff.q2":             { en: "Do you worry you've lost control over how much you eat?", ru: "Беспокоишься ли ты, что потерял(а) контроль над тем, сколько ешь?" },
"v2.scoff.q3":             { en: "Have you recently lost more than 6 kg in 3 months?", ru: "Терял(а) ли ты больше 6 кг за последние 3 месяца?" },
"v2.scoff.q4":             { en: "Do you believe yourself to be fat when others say you are too thin?", ru: "Считаешь ли ты себя толстым(ой), когда другие говорят, что ты худой(ая)?" },
"v2.scoff.q5":             { en: "Would you say food dominates your life?", ru: "Сказал(а) бы ты, что еда доминирует в твоей жизни?" },
"v2.scoff.yes":            { en: "Yes", ru: "Да" },
"v2.scoff.no":             { en: "No", ru: "Нет" },
"v2.scoff.flagged.title":  { en: "Let's talk to a professional first", ru: "Стоит сначала поговорить со специалистом" },
"v2.scoff.flagged.body":   { en: "Your answers suggest your relationship with food may be complicated. A fat loss program can make this worse. We strongly recommend speaking with a therapist or dietitian who specializes in eating disorders first.", ru: "Твои ответы указывают, что отношения с едой могут быть сложными. Программа снижения жира может усугубить это. Мы настоятельно рекомендуем сначала обратиться к специалисту по расстройствам пищевого поведения." },
"v2.scoff.flagged.resource":{ en: "International: NEDA (US) at nationaleatingdisorders.org · Beat ED (UK) at beateatingdisorders.org.uk", ru: "В России: Центр изучения расстройств пищевого поведения (ЦИРПП), cirpp.ru" },
"v2.scoff.flagged.acknowledge":{ en: "I understand this program doesn't replace professional help, and I take responsibility for participating", ru: "Я понимаю, что программа не заменяет профессиональную помощь, и беру на себя ответственность за участие" },
"v2.scoff.flagged.continue":{ en: "I understand the risks and want to continue", ru: "Я понимаю риски и хочу продолжить" },
"v2.scoff.flagged.back":   { en: "Back — not now", ru: "Назад — не сейчас" },

"v2.step4.title":          { en: "When to remind you", ru: "Когда напоминать" },
"v2.step4.subtitle":       { en: "Two notifications per day — no more", ru: "Два уведомления в день — больше не будет" },
"v2.morning.label":        { en: "Morning weigh-in", ru: "Утреннее взвешивание" },
"v2.morning.hint":         { en: "After bathroom, before breakfast", ru: "После туалета, до завтрака" },
"v2.evening.label":        { en: "Evening reflection", ru: "Вечерняя рефлексия" },
"v2.evening.hint":         { en: "Short end-of-day summary", ru: "Короткий итог дня" },
"v2.notifications.enable": { en: "Enable notifications", ru: "Включить уведомления" },
"v2.notifications.skip":   { en: "Set up later", ru: "Настрою позже" },
"v2.start":                { en: "Start the program →", ru: "Начать программу →" },

// ─── WELCOME / DAY 0 (NEW COPY) ───────────────────────────────────────────
"v2.welcome.title.first":  { en: "{name}, welcome", ru: "{name}, добро пожаловать" },
"v2.welcome.title.repeat": { en: "{name}, this time — differently", ru: "{name}, в этот раз — иначе" },
"v2.welcome.body.first":   { en: "A first attempt is the most important place to get the start right. The next 16 weeks are built so you don't have to do this again.", ru: "Первая попытка — самое важное место для правильного старта. Следующие 16 недель построены так, чтобы тебе не пришлось делать это ещё раз." },
"v2.welcome.body.1_2":     { en: "1–2 attempts means you already have experience. Each past attempt is data about what didn't work for you. This time we start from a different place.", ru: "1–2 попытки — это уже опыт. Каждая прошлая попытка — данные о том, что не сработало именно для тебя. В этот раз начинаем с другого места." },
"v2.welcome.body.3_5":     { en: "3–5 attempts aren't 3–5 failures. They're 3–5 data points about what doesn't work for you. This time we start from a different place.", ru: "3–5 попыток — это не 3–5 неудач. Это 3–5 источников данных о том, что не работает для тебя. В этот раз начинаем с другого места." },
"v2.welcome.body.many":    { en: "Many attempts behind you means you have far more data than the average beginner. The next 16 weeks aren't about a new diet. They're about a system.", ru: "Много попыток позади — значит у тебя гораздо больше данных, чем у среднего новичка. Следующие 16 недель — не про новую диету. Про систему." },
"v2.welcome.why.label":    { en: "Your why:", ru: "Твоё «зачем»:" },
"v2.welcome.starting.weight":{ en: "Starting weight", ru: "Стартовый вес" },
"v2.welcome.starts.tomorrow":{ en: "The program starts tomorrow morning", ru: "Программа начинается завтра утром" },
"v2.welcome.today.prep":   { en: "Today is for prep", ru: "Сегодня — подготовка" },
"v2.welcome.setup.title":  { en: "Prep for the start", ru: "Подготовка к старту" },
"v2.welcome.setup.notif":  { en: "Confirm notifications", ru: "Подтверди уведомления" },
"v2.welcome.setup.home":   { en: "Add the app to your home screen", ru: "Перенеси приложение на главный экран" },
"v2.welcome.setup.scales": { en: "Put your scale where you'll see it every morning", ru: "Поставь весы там, где будешь видеть их каждое утро" },
"v2.welcome.tomorrow.title":{ en: "Tomorrow — Day 1", ru: "Завтра — День 1" },
"v2.welcome.tomorrow.subtitle":{ en: "Here's what's ahead", ru: "Вот что тебя ждёт" },
"v2.welcome.tomorrow.morning":{ en: "Step on the scale", ru: "Встань на весы" },
"v2.welcome.tomorrow.morning.sub":{ en: "After bathroom, before breakfast", ru: "После туалета, до завтрака" },
"v2.welcome.tomorrow.lesson":{ en: "Lesson · Why 80% relapse — and why you'll be different", ru: "Урок · Почему 80% срываются — и почему ты будешь иначе" },
"v2.welcome.tomorrow.lesson.sub":{ en: "10 minutes — start the new way", ru: "10 минут — начало по-новому" },
"v2.welcome.tomorrow.evening":{ en: "Short evening reflection", ru: "Короткая рефлексия вечером" },
"v2.welcome.tomorrow.evening.sub":{ en: "We'll send a reminder", ru: "Пришлём напоминание" },
"v2.welcome.open":         { en: "Open the app →", ru: "Открыть приложение →" },
"v2.welcome.openSub":      { en: "Day 0 tasks remain on the home screen", ru: "Задачи дня 0 останутся на главном экране" },

// ─── PINNED "WHY" ANCHOR (always visible from Day 0) ──────────────────────
"v2.why.anchor.label":     { en: "Why I'm here", ru: "Зачем я здесь" },
"v2.why.anchor.empty":     { en: "We'll write this together on Day 3", ru: "Напишем вместе на 3-й день" },
"v2.why.anchor.add":       { en: "Add your why →", ru: "Записать своё «зачем» →" },
"v2.why.anchor.edit":      { en: "Edit", ru: "Изменить" },

// ─── LOCKED FEATURE STATES ────────────────────────────────────────────────
"v2.locked.food.title":    { en: "Food diary unlocks in Week 3", ru: "Дневник питания откроется на Неделе 3" },
"v2.locked.food.body":     { en: "First we figure out the why — then we count the what. Day 20.", ru: "Сначала разберёмся почему — потом считаем что. День 20." },
"v2.locked.food.countdown":{ en: "Unlocks in {days} days", ru: "Откроется через {days} дней" },
"v2.locked.steps.title":   { en: "Step counter unlocks in Week 6", ru: "Счётчик шагов откроется на Неделе 6" },
"v2.locked.steps.body":    { en: "We talk NEAT first — then we count. Day 33.", ru: "Поговорим про NEAT — потом будем считать. День 33." },
"v2.locked.protein.title": { en: "Protein target unlocks in Week 4", ru: "Цель по белку откроется на Неделе 4" },
"v2.locked.protein.body":  { en: "Day 24 — we'll calculate your number based on your weight.", ru: "День 24 — рассчитаем твою норму на основе веса." },
"v2.locked.calories.title":{ en: "Calorie target unlocks in Week 3", ru: "Калорийная цель откроется на Неделе 3" },
"v2.locked.calories.body": { en: "Day 18 — we'll calculate your TDEE and deficit together.", ru: "День 18 — рассчитаем твой TDEE и дефицит вместе." },

// ─── IDENTITY AFFIRMATIONS (Days 4–14) ────────────────────────────────────
"v2.identity.day4":        { en: "Today I am someone who…", ru: "Сегодня я — человек, который…" },
"v2.identity.day5":        { en: "It wasn't my fault it was hard. Today I…", ru: "Это не моя вина, что было трудно. Сегодня я…" },
"v2.identity.day6":        { en: "One thing I learned from past attempts…", ru: "Одно, что я узнал(а) из прошлых попыток…" },
"v2.identity.day7":        { en: "My one-sentence why for this week…", ru: "Моя одна фраза «зачем» на эту неделю…" },
"v2.identity.day8":        { en: "A habit I want to replace…", ru: "Привычка, которую я хочу заменить…" },
"v2.identity.day9":        { en: "A trigger I noticed today…", ru: "Триггер, который я заметил(а) сегодня…" },
"v2.identity.day10":       { en: "One small step today is…", ru: "Маленький шаг сегодня — это…" },
"v2.identity.day11":       { en: "I trust myself because…", ru: "Я доверяю себе, потому что…" },
"v2.identity.day12":       { en: "My next 'if–then' plan…", ru: "Мой следующий «если — то» план…" },
"v2.identity.day13":       { en: "What I'm doing differently this time…", ru: "Что я делаю иначе в этот раз…" },
"v2.identity.day14":       { en: "My keystone habit for the next 14 weeks…", ru: "Мой ключевой habit на следующие 14 недель…" },
"v2.identity.save":        { en: "Save", ru: "Сохранить" },
"v2.identity.saved":       { en: "Saved", ru: "Сохранено" },
```

---

## 3. NEW FILE: `src/featureUnlocks.js`

Create a new utility module that becomes the single source of truth for feature gating.

```javascript
// Centralized feature unlock thresholds, keyed off getUserGlobalDay(profile).
// Day 0 = signup day. Day 1 = next calendar day. See program.js::getUserGlobalDay.
//
// Add a new feature here in one place, then read it via isFeatureUnlocked()
// in components — no need to scatter day-number constants across files.

export const FEATURE_UNLOCK_DAYS = {
  food_diary:     20,  // Week 3 — calorie/tracking lesson day
  step_tracker:   33,  // Week 6 — NEAT baseline action
  protein_target: 24,  // Week 4 — protein calculation
  calorie_target: 18,  // Week 3 — TDEE estimation
  greens_check:   29,  // Week 5 — fiber lesson (existing pattern in MissionStrip)
  why_editable:    3,  // Day 3 — the "5 Whys" lesson where users fill in their why
};

export function isFeatureUnlocked(featureName, currentDay) {
  const threshold = FEATURE_UNLOCK_DAYS[featureName];
  if (threshold === undefined) return true; // unknown feature defaults open
  return currentDay >= threshold;
}

export function daysUntilUnlock(featureName, currentDay) {
  const threshold = FEATURE_UNLOCK_DAYS[featureName];
  if (threshold === undefined) return 0;
  return Math.max(0, threshold - currentDay);
}

// Returns the i18n key prefix for a given locked feature, or null if open.
// Components use: t(`${getLockKey('food_diary')}.title`)
export function getLockKey(featureName) {
  const map = {
    food_diary:     "v2.locked.food",
    step_tracker:   "v2.locked.steps",
    protein_target: "v2.locked.protein",
    calorie_target: "v2.locked.calories",
  };
  return map[featureName] || null;
}
```

Import this in any file that needs unlock logic:
```javascript
import { isFeatureUnlocked, daysUntilUnlock, FEATURE_UNLOCK_DAYS } from "../featureUnlocks.js";
```

---

## 4. FIX: `src/screens/Day0Screen.jsx` — Localize hardcoded strings

`Day0Screen.jsx` currently has Russian strings hardcoded throughout. They must be moved to i18n so the English flow works.

### 4.1 Add these keys to `lang.js` (in the same v2 block as section 2):

```javascript
// ─── DAY 0 SCREEN (existing screen, was hardcoded Russian) ────────────────
"day0.title":              { en: "You're in, {name}!", ru: "Ты в программе, {name}!" },
"day0.subtitle.line1":     { en: "The 16 weeks start tomorrow morning.", ru: "16 недель начинаются завтра утром." },
"day0.subtitle.line2":     { en: "Today is for prep.", ru: "Сегодня — подготовка." },
"day0.weight.label":       { en: "Current weight", ru: "Текущий вес" },
"day0.weight.sub":         { en: "kg · starting point", ru: "кг · точка отсчёта" },
"day0.bmi.label":          { en: "BMI", ru: "Индекс массы тела" },
"day0.checklist.title":    { en: "Do today", ru: "Сделай сегодня" },
"day0.task.profile":       { en: "Profile complete", ru: "Профиль заполнен" },
"day0.task.profile.sub":   { en: "Onboarding done — data saved", ru: "Анкета завершена — данные сохранены" },
"day0.task.profile.done":  { en: "done", ru: "готово" },
"day0.task.notif":         { en: "Enable notifications", ru: "Включить уведомления" },
"day0.task.notif.sub":     { en: "7:00 weigh-in · 21:00 reflection", ru: "7:00 — замер веса · 21:00 — рефлексия" },
"day0.task.notif.badge":   { en: "now", ru: "сейчас" },
"day0.task.home":          { en: "Add to home screen", ru: "Добавить на главный экран" },
"day0.task.home.installed":{ en: "Already installed — perfect!", ru: "Уже установлено — отлично!" },
"day0.task.home.android":  { en: "Tap to install the app", ru: "Нажми, чтобы установить приложение" },
"day0.task.home.ios":      { en: "Safari → Share → Add to Home Screen", ru: "Safari → Поделиться → На экран «Домой»" },
"day0.task.home.other":    { en: "Bookmark or add to home screen", ru: "Добавь в закладки или на главный экран" },
"day0.task.home.badge":    { en: "today", ru: "сегодня" },
"day0.ios.step1":          { en: "Tap the **Share** button at the bottom of Safari", ru: "Нажми **кнопку «Поделиться»** внизу экрана Safari" },
"day0.ios.step2":          { en: "Scroll down and select **Add to Home Screen**", ru: "Прокрути вниз и выбери **«На экран Домой»**" },
"day0.ios.step3":          { en: "Tap **Add**", ru: "Нажми **«Добавить»**" },
"day0.ios.done":           { en: "Done ✓", ru: "Готово ✓" },
"day0.tomorrow.label":     { en: "Tomorrow — Day 1", ru: "Завтра — День 1" },
"day0.tomorrow.sub":       { en: "Here's what's ahead", ru: "Вот что тебя ждёт" },
"day0.tomorrow.morning":   { en: "Step on the scale", ru: "Встань на весы" },
"day0.tomorrow.morning.sub":{ en: "After bathroom, before breakfast. Log with one tap.", ru: "После туалета, до завтрака. Введи вес одним нажатием" },
"day0.tomorrow.lesson":    { en: "Lesson of the day", ru: "Урок дня" },
"day0.tomorrow.lesson.sub":{ en: "Why 80% relapse — and why you'll be different", ru: "Почему 80% срываются — и почему ты будешь иначе" },
"day0.tomorrow.evening":   { en: "End of day", ru: "Итог дня" },
"day0.tomorrow.evening.sub":{ en: "Short reflection. We'll send a reminder.", ru: "Короткая рефлексия. Пришлём напоминание." },
"day0.cta.open":           { en: "Open the app →", ru: "Открыть приложение →" },
"day0.cta.openSub":        { en: "Day 0 tasks remain on the home screen", ru: "Задачи дня 0 останутся на главном экране" },
```

### 4.2 Refactor `Day0Screen.jsx`

Replace every hardcoded Russian string with a `t()` call using the keys above. Specific replacements:

| Hardcoded current value | Replace with |
|------------------------|-------------|
| `"Ты в программе,"` line | `t("day0.title", { name: profile.name?.split(" ")[0] })` (note: split out the name part and merge — currently it's a JSX template that hardcodes "Ты в программе,\n<span>name!</span>") |
| `"16 недель начинаются завтра утром."` | `t("day0.subtitle.line1")` |
| `"Сегодня — подготовка."` | `t("day0.subtitle.line2")` |
| `"Текущий вес"` | `t("day0.weight.label")` |
| `"кг · точка отсчёта"` | `t("day0.weight.sub")` |
| `"Индекс массы тела"` | `t("day0.bmi.label")` |
| `"Сделай сегодня"` | `t("day0.checklist.title")` |
| All 3 task labels (profile/notif/home) | use `day0.task.*` keys |
| All 3 task sub labels | use `day0.task.*.sub` keys |
| Badges (`"готово"`, `"сейчас"`, `"сегодня"`) | use `day0.task.*.badge` keys |
| `homeSubtext` variable's 4 strings | use `day0.task.home.{installed,android,ios,other}` |
| iOS instructions HTML | use `day0.ios.step1/2/3` |
| `"Готово ✓"` | `t("day0.ios.done")` |
| `"Завтра — День 1"` | `t("day0.tomorrow.label")` |
| `"Вот что тебя ждёт"` | `t("day0.tomorrow.sub")` |
| Tomorrow's 3-item array (`label` + `sub`) | use `day0.tomorrow.{morning,lesson,evening}` and their `.sub` variants |
| `"Открыть приложение →"` | `t("day0.cta.open")` |
| `"Задачи дня 0 останутся на главном экране"` | `t("day0.cta.openSub")` |

### 4.3 Replace the "tomorrow preview" content

In the current Day0Screen the `tomorrow` array contains:
```javascript
{time:"Днём",icon:"🍽️",col:C.blue,label:"Записывай еду",sub:"Каждый приём пищи сразу после еды — так точнее всего"},
```

**Replace this entire object** with:
```javascript
{time:"Днём",icon:"📖",col:C.blue,label:t("day0.tomorrow.lesson"),sub:t("day0.tomorrow.lesson.sub")},
```

Reason: food tracking is locked until Day 20 in the new flow; the Day 0 preview should not advertise it. The middle slot of Day 1's day is the lesson, not food logging.

### 4.4 Add Why anchor + previous_attempts conditional body

After the weight + BMI tiles block, before the checklist card, insert a new block:

```javascript
{/* Welcome message based on previous attempts */}
{profile.previousAttempts && (
  <div style={{padding:"0 24px 20px",animation:"slideUp 0.4s 0.1s both"}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"16px 18px"}}>
      <div style={{fontSize:13,color:C.text,lineHeight:1.65}}>
        {t(`v2.welcome.body.${profile.previousAttempts}`)}
      </div>
    </div>
  </div>
)}

{/* Pinned "Why" anchor — visible from Day 0 forward */}
{profile.initialWhy && (
  <div style={{padding:"0 24px 20px",animation:"slideUp 0.4s 0.12s both"}}>
    <div style={{background:C.accentDim,border:`1px solid ${C.accent}44`,borderRadius:18,padding:"14px 18px"}}>
      <div style={{fontSize:10,color:C.accent,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>
        {t("v2.why.anchor.label")}
      </div>
      <div style={{fontSize:14,color:C.text,lineHeight:1.55,fontStyle:"italic"}}>
        «{profile.initialWhy}»
      </div>
    </div>
  </div>
)}
```

The `profile.previousAttempts` and `profile.initialWhy` fields will be populated by the new SignUp (section 5). For legacy v1 users they'll be null and these blocks won't render — clean fallback.

### 4.5 Make BMI display optional

The BMI tile reinforces body-measurement-as-identity right after signup, which is exactly what the new curriculum reframes away from. Don't remove it entirely (some users want it), but change the BMI grid card from `+bmi<25?"normal":...` color-coded to a single muted display.

In the BMI tile, replace the `bmiColor` lookup with `C.text` (constant) and remove the colored label sub-text. Keep just the number and a neutral "BMI" label.

---

## 5. REWRITE: `src/screens/SignUp.jsx`

The current `SignUp.jsx` is the v1 onboarding. **Don't delete it** — rename it to `SignUpV1.jsx` and keep it for legacy support, then create the new `SignUp.jsx` as the v2 flow. Routing in `App.jsx` (section 12) decides which to render.

### 5.1 Rename existing file

```bash
mv src/screens/SignUp.jsx src/screens/SignUpV1.jsx
```

Update the `export` statement inside the renamed file:
```javascript
export function SignUpV1({onComplete,onBack}){ /* ...existing code... */ }
```

Update `App.jsx` import:
```javascript
import { SignUpV1 } from "./screens/SignUpV1.jsx";
import { SignUp } from "./screens/SignUp.jsx";
```

### 5.2 Create new `src/screens/SignUp.jsx`

The new file follows the same patterns as v1 (ProgressDots, Btn, etc.) but with 4 different steps:

```javascript
// New 4-step onboarding (v2). Identity-first, no goal selection,
// no NEAT collection (deferred to Day 33), no TDEE preview.
// Includes SCOFF eating disorder screener.
import { useState } from "react";
import { C } from "../theme.js";
import { todayStr, calcBMI } from "../utils.js";
import { t } from "../i18n.js";
import { ProgressDots, TextInput, NumberInput, PillSelect, CardSelect, Btn } from "../components/ui.jsx";
import { Avatar, AVATAR_OPTIONS } from "../components/icons.jsx";

const STEP_META = [
  { titleKey: "v2.step1.title", subKey: "v2.step1.subtitle" },
  { titleKey: "v2.step2.title", subKey: "v2.step2.subtitle" },
  { titleKey: "v2.step3.title", subKey: "v2.step3.subtitle" },
  { titleKey: "v2.step4.title", subKey: "v2.step4.subtitle" },
];

const SCOFF_QUESTIONS = ["q1", "q2", "q3", "q4", "q5"];

export function SignUp({ onComplete, onBack }) {
  // Step state — extended from v1 to support 4 steps + SCOFF substeps
  const [step, setStep] = useState(0);
  // Within step 3 (safety), substeps: conditions → scoff intro → 5 questions → maybe flagged
  const [step3Sub, setStep3Sub] = useState("conditions"); // conditions | scoffIntro | scoffQ1..5 | scoffFlagged | scoffOk
  const [scoffIndex, setScoffIndex] = useState(0);

  const [f, setF] = useState({
    // Step 1 — identity
    previousAttempts: "",
    initialWhy: "",
    // Step 2 — body
    avatar: "fox",
    name: "",
    gender: "male",
    age: "",
    height: "",
    weight: "",
    // Step 3 — safety
    conditions: [],
    scoffAnswers: [null, null, null, null, null],
    scoffAcknowledged: false,
    // Step 4 — logistics
    morningTime: "07:00",
    eveningTime: "21:00",
    notificationsEnabled: false,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Derived
  const wNum = parseFloat(f.weight), hNum = parseFloat(f.height);
  const bmi = (wNum && hNum) ? calcBMI(wNum, hNum) : null;
  const scoffScore = f.scoffAnswers.filter(a => a === "yes").length;
  const isPregnant = f.conditions.includes("pregnancy");

  // canNext rules per step
  const canNext = [
    !!f.previousAttempts,                                     // step 1 — attempts required, why optional
    f.name.trim() && f.age && f.height && f.weight,          // step 2 — body required
    step3Sub === "conditions"
      ? f.conditions.length > 0 || f.conditions.includes("none")  // need at least one selection
      : step3Sub === "scoffOk" || (step3Sub === "scoffFlagged" && f.scoffAcknowledged),
    true,                                                     // step 4 — always allowed
  ][step];

  function next() {
    // Step 3 has internal substeps to navigate before advancing
    if (step === 2) {
      if (step3Sub === "conditions") {
        // Pregnancy → hard block (handled in render)
        if (isPregnant) return;
        // Move to SCOFF intro
        setStep3Sub("scoffIntro");
        return;
      }
      if (step3Sub === "scoffIntro") {
        setStep3Sub("scoffQ");
        setScoffIndex(0);
        return;
      }
      if (step3Sub === "scoffQ") {
        // Advance to next question or evaluate
        if (scoffIndex < 4) {
          setScoffIndex(scoffIndex + 1);
        } else {
          // Done with SCOFF — decide route
          setStep3Sub(scoffScore >= 2 ? "scoffFlagged" : "scoffOk");
        }
        return;
      }
      if (step3Sub === "scoffOk" || step3Sub === "scoffFlagged") {
        setStep(3);
        return;
      }
    }
    // Normal step advance
    if (step < 3) setStep(s => s + 1);
    else finish();
  }

  function back() {
    if (step === 2 && step3Sub !== "conditions") {
      // Navigate within step 3 backwards
      if (step3Sub === "scoffIntro")    return setStep3Sub("conditions");
      if (step3Sub === "scoffQ" && scoffIndex > 0) return setScoffIndex(scoffIndex - 1);
      if (step3Sub === "scoffQ" && scoffIndex === 0) return setStep3Sub("scoffIntro");
      if (step3Sub === "scoffOk" || step3Sub === "scoffFlagged") {
        setStep3Sub("scoffQ");
        setScoffIndex(4);
        return;
      }
    }
    if (step > 0) setStep(s => s - 1);
    else onBack();
  }

  async function requestNotifications() {
    if (!("Notification" in window)) { set("notificationsEnabled", false); return; }
    const result = await Notification.requestPermission();
    set("notificationsEnabled", result === "granted");
  }

  function finish() {
    onComplete({
      id: "u_" + Date.now(),
      // Identity (v2-only fields)
      previousAttempts: f.previousAttempts,
      initialWhy: f.initialWhy || null,
      // Body
      avatar: f.avatar,
      name: f.name,
      gender: f.gender,
      age: parseFloat(f.age),
      height: parseFloat(f.height),
      weight: parseFloat(f.weight),
      bmi: bmi ? parseFloat(bmi) : null,
      // Safety
      medicalConditions: f.conditions,
      scoffScore: scoffScore,
      scoffCompletedAt: new Date().toISOString(),
      scoffAcknowledgedRisk: scoffScore >= 2 && f.scoffAcknowledged,
      // Logistics
      morningReminderTime: f.morningTime,
      eveningReminderTime: f.eveningTime,
      // Deferred fields — populated later in the program
      goal: null,
      activity: null,
      training: null,
      trainingExp: null,
      stress: null,
      sleep: null,
      dietQuality: null,
      targetWeight: null,
      tdee: null,
      bfp: null,
      waist: null, neck: null, thigh: null,
      // System
      onboardingVersion: 2,
      currentWeek: 1,
      streak: 0,
      totalXP: 0,
      fatsecretConnected: false,
      joinedAt: todayStr(),
      notes: "",
      logs: [],
      foodLog: [],
      dailyTargets: { calories: null, protein: null, steps: null }, // null until unlocked
    });
  }

  const headerTitle = STEP_META[step].titleKey;
  const headerSub   = STEP_META[step].subKey;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "52px 22px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={back} style={{ width: 40, height: 40, borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}><ProgressDots total={4} current={step} /></div>
      </div>

      {/* Title bar */}
      <div style={{ padding: "0 22px 6px" }}>
        <div style={{ fontSize: 11, color: C.accent, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>{step + 1} / 4</div>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{t(headerTitle)}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{t(headerSub)}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 0" }}>

        {/* STEP 1 — Identity */}
        {step === 0 && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{t("v2.attempts.label")}</div>
              {["never", "1_2", "3_5", "many"].map(opt => (
                <button
                  key={opt}
                  onClick={() => set("previousAttempts", opt)}
                  style={{
                    width: "100%", padding: "14px 16px", marginBottom: 8,
                    background: f.previousAttempts === opt ? C.accentDim : C.surface,
                    border: `1.5px solid ${f.previousAttempts === opt ? C.accent : C.border}`,
                    borderRadius: 14, color: C.text, textAlign: "left", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 14,
                  }}
                >
                  {t(`v2.attempts.${opt}`)}
                </button>
              ))}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>{t("v2.attempts.hint")}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>{t("v2.why.label")}</div>
              <textarea
                value={f.initialWhy}
                onChange={e => set("initialWhy", e.target.value.slice(0, 200))}
                placeholder={t("v2.why.placeholder")}
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: "12px 14px", color: C.text, fontSize: 14,
                  fontFamily: "'Inter',system-ui,sans-serif", outline: "none", resize: "none",
                  lineHeight: 1.55,
                }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{t("v2.why.hint")}</div>
            </div>
          </div>
        )}

        {/* STEP 2 — Body */}
        {step === 1 && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 22 }}>
              {AVATAR_OPTIONS.map(a => (
                <button key={a} type="button" onClick={() => set("avatar", a)}
                  style={{ width: 50, height: 50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                           background: f.avatar === a ? C.accentDim : C.surface,
                           border: `1.5px solid ${f.avatar === a ? C.accent : C.border}`,
                           color: f.avatar === a ? C.accent : C.text,
                           cursor: "pointer", transition: "all 0.15s", padding: 0 }}>
                  <Avatar value={a} size={28} strokeWidth={f.avatar === a ? 1.75 : 1.5} />
                </button>
              ))}
            </div>
            <TextInput label={t("field.name")} value={f.name} onChange={v => set("name", v)} placeholder={t("field.name.ph")} />
            <PillSelect label={t("field.gender")} value={f.gender} onChange={v => set("gender", v)}
              options={[{ value: "male", label: t("field.gender.male") }, { value: "female", label: t("field.gender.female") }]} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <NumberInput label={t("field.age")} value={f.age} onChange={v => set("age", v)} unit={t("field.age.unit")} placeholder={t("field.age.ph")} step="1" />
              <NumberInput label={t("field.height")} value={f.height} onChange={v => set("height", v)} unit="cm" placeholder={t("field.height.ph")} step="1" />
            </div>
            <NumberInput label={t("field.weight")} value={f.weight} onChange={v => set("weight", v)} unit="kg" placeholder={t("field.weight.ph")} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: -10, marginBottom: 14 }}>{t("v2.weight.hint")}</div>
            {/* DO NOT show BMI/TDEE preview here — different from v1 */}
          </div>
        )}

        {/* STEP 3 — Safety (multi-substep) */}
        {step === 2 && step3Sub === "conditions" && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{t("v2.conditions.label")}</div>
            {["thyroid", "diabetes1", "diabetes2", "meds", "pregnancy", "none"].map(cond => {
              const checked = f.conditions.includes(cond);
              return (
                <button
                  key={cond}
                  onClick={() => {
                    if (cond === "none") {
                      set("conditions", checked ? [] : ["none"]);
                    } else {
                      const without = f.conditions.filter(c => c !== "none");
                      set("conditions", checked
                        ? without.filter(c => c !== cond)
                        : [...without, cond]);
                    }
                  }}
                  style={{
                    width: "100%", padding: "13px 16px", marginBottom: 8,
                    background: checked ? C.accentDim : C.surface,
                    border: `1.5px solid ${checked ? C.accent : C.border}`,
                    borderRadius: 14, color: C.text, textAlign: "left", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 14,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <span>{t(`v2.conditions.${cond}`)}</span>
                  {checked && <span style={{ color: C.accent }}>✓</span>}
                </button>
              );
            })}

            {/* Pregnancy hard block */}
            {isPregnant && (
              <div style={{ marginTop: 16, padding: "14px 16px", background: C.surface, border: `1.5px solid ${C.red || "#c44"}`, borderRadius: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                  {t("v2.pregnancy.block.title")}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
                  {t("v2.pregnancy.block.body")}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && step3Sub === "scoffIntro" && (
          <div style={{ animation: "slideUp 0.3s both", padding: "20px 0" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 10 }}>
              {t("v2.scoff.intro.title")}
            </div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>
              {t("v2.scoff.intro.body")}
            </div>
          </div>
        )}

        {step === 2 && step3Sub === "scoffQ" && (
          <div style={{ animation: "slideUp 0.3s both", padding: "8px 0" }}>
            <div style={{ fontSize: 11, color: C.accent, marginBottom: 12, fontWeight: 600 }}>
              {scoffIndex + 1} / 5
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: C.text, marginBottom: 24, lineHeight: 1.4 }}>
              {t(`v2.scoff.q${scoffIndex + 1}`)}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["yes", "no"].map(ans => (
                <button
                  key={ans}
                  onClick={() => {
                    const newAnswers = [...f.scoffAnswers];
                    newAnswers[scoffIndex] = ans;
                    set("scoffAnswers", newAnswers);
                    // Auto-advance after a brief delay
                    setTimeout(() => {
                      if (scoffIndex < 4) setScoffIndex(scoffIndex + 1);
                      else {
                        const score = newAnswers.filter(a => a === "yes").length;
                        setStep3Sub(score >= 2 ? "scoffFlagged" : "scoffOk");
                      }
                    }, 220);
                  }}
                  style={{
                    flex: 1, padding: "16px",
                    background: f.scoffAnswers[scoffIndex] === ans ? C.accentDim : C.surface,
                    border: `1.5px solid ${f.scoffAnswers[scoffIndex] === ans ? C.accent : C.border}`,
                    borderRadius: 14, color: C.text, fontSize: 15, fontWeight: 500,
                    fontFamily: "inherit", cursor: "pointer",
                  }}
                >
                  {t(`v2.scoff.${ans}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && step3Sub === "scoffFlagged" && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ background: C.surface, border: `1.5px solid ${C.orange || "#d4a847"}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 10 }}>
                {t("v2.scoff.flagged.title")}
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginBottom: 12 }}>
                {t("v2.scoff.flagged.body")}
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, padding: "10px 12px", background: C.card, borderRadius: 10 }}>
                {t("v2.scoff.flagged.resource")}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 0" }}>
              <input
                type="checkbox"
                checked={f.scoffAcknowledged}
                onChange={e => set("scoffAcknowledged", e.target.checked)}
                style={{ marginTop: 3, accentColor: C.accent, transform: "scale(1.2)" }}
              />
              <span style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>
                {t("v2.scoff.flagged.acknowledge")}
              </span>
            </label>
          </div>
        )}

        {step === 2 && step3Sub === "scoffOk" && (
          <div style={{ animation: "slideUp 0.3s both", padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 15, color: C.text }}>
              {/* Simple all-clear — no extra copy needed, button below advances */}
            </div>
          </div>
        )}

        {/* STEP 4 — Logistics */}
        {step === 3 && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{t("v2.morning.label")}</div>
              <input
                type="time"
                value={f.morningTime}
                onChange={e => set("morningTime", e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: "12px 14px", color: C.text, fontSize: 16,
                  fontFamily: "inherit", outline: "none",
                }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{t("v2.morning.hint")}</div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{t("v2.evening.label")}</div>
              <input
                type="time"
                value={f.eveningTime}
                onChange={e => set("eveningTime", e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: "12px 14px", color: C.text, fontSize: 16,
                  fontFamily: "inherit", outline: "none",
                }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{t("v2.evening.hint")}</div>
            </div>
            <button
              onClick={requestNotifications}
              style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: f.notificationsEnabled ? C.accentDim : C.card,
                border: `1.5px solid ${f.notificationsEnabled ? C.accent : C.border}`,
                color: f.notificationsEnabled ? C.accent : C.text,
                fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
              }}
            >
              {f.notificationsEnabled ? "✓ " : ""}{t("v2.notifications.enable")}
            </button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "18px 22px 48px" }}>
        <Btn onClick={next} disabled={!canNext}>
          {step === 3 ? t("v2.start") : t("onboarding.continue")}
        </Btn>
      </div>
    </div>
  );
}
```

### 5.3 Update `App.jsx` routing logic

Find the `screen==="onboarding"` block (around line 538) and replace with:

```javascript
{chosen && screen==="onboarding" && (
  profile?.onboardingVersion === 1
    ? <SignUpV1
        onComplete={saveProfile}
        onBack={async()=>{ userInitiatedSignOut.current = true; await supabase.auth.signOut(); setScreen("auth"); }}
      />
    : <SignUp
        onComplete={saveProfile}
        onBack={async()=>{ userInitiatedSignOut.current = true; await supabase.auth.signOut(); setScreen("auth"); }}
      />
)}
```

Note: new signups will never hit the `=== 1` branch because they have no profile yet. The branch exists for safety only — in practice the v1 flow is only relevant for existing users who already completed onboarding (and thus aren't on this screen anymore).

### 5.4 Update `App.jsx::saveProfile`

Find `saveProfile` (around line 335) and extend the upsert payload to write the new v2 fields:

```javascript
async function saveProfile(p) {
  const userId = session.user.id;
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    name: p.name,
    avatar: p.avatar,
    gender: p.gender,
    age: p.age,
    height: p.height,
    weight: p.weight,
    waist: p.waist,
    neck: p.neck,
    thigh: p.thigh,
    goal: p.goal,
    activity: p.activity,
    stress: p.stress,
    sleep: p.sleep,
    diet_quality: p.dietQuality,
    training: p.training,
    training_exp: p.trainingExp,
    bmi: p.bmi,
    bfp: p.bfp,
    tdee: p.tdee,
    current_week: p.currentWeek || 1,
    streak: p.streak || 0,
    total_xp: p.totalXP || 0,
    fatsecret_connected: p.fatsecretConnected || false,
    joined_at: p.joinedAt || todayStr(),
    daily_calories: p.dailyTargets?.calories,
    daily_protein: p.dailyTargets?.protein,
    daily_steps: p.dailyTargets?.steps,
    // ─── NEW v2 fields ───────────────────────────────────────────────
    previous_attempts: p.previousAttempts || null,
    initial_why: p.initialWhy || null,
    scoff_score: p.scoffScore ?? null,
    scoff_completed_at: p.scoffCompletedAt || null,
    scoff_acknowledged_risk: p.scoffAcknowledgedRisk || false,
    medical_conditions: p.medicalConditions || null,
    onboarding_version: p.onboardingVersion || 1,
    morning_reminder_time: p.morningReminderTime || '07:00',
    evening_reminder_time: p.eveningReminderTime || '21:00',
  });

  if (!error) {
    setProfile({ ...p, id: userId, logs: [], foodLog: [] });
    setScreen("day0");
  }
}
```

### 5.5 Update `App.jsx::loadProfile`

Inside `loadProfile`, in the `fullProfile = {...}` object (around line 285), add the camelCase mappings:

```javascript
const fullProfile = {
  ...data,
  currentWeek: data.current_week || 1,
  streak: data.streak || 0,
  totalXP: data.total_xp || 0,
  fatsecretConnected: data.fatsecret_connected || false,
  dietQuality: data.diet_quality || 3,
  trainingExp: data.training_exp || "",
  joinedAt: data.joined_at || todayStr(),
  // ─── NEW v2 mappings ─────────────────────────────────────────────
  previousAttempts: data.previous_attempts || null,
  initialWhy: data.initial_why || null,
  scoffScore: data.scoff_score ?? null,
  scoffCompletedAt: data.scoff_completed_at || null,
  scoffAcknowledgedRisk: data.scoff_acknowledged_risk || false,
  medicalConditions: data.medical_conditions || null,
  onboardingVersion: data.onboarding_version || 1,
  morningReminderTime: data.morning_reminder_time || '07:00',
  eveningReminderTime: data.evening_reminder_time || '21:00',
  keystoneHabit: data.keystone_habit || null,
  // ... (existing logs/dailyTargets/foodLog mappings continue)
  logs: (logs || []).map(l => ({ /* unchanged */ })),
  dailyTargets: {
    calories: data.daily_calories || 2000,
    protein: data.daily_protein || 150,
    steps: data.daily_steps || 10000,
  },
  foodLog: [],
};
```

---

## 6. UPDATE: `src/screens/Day0Screen.jsx` — Cross-reference with section 4

Section 4 covers all the Day0Screen changes. After section 4 is applied:
- All strings are localized
- The food-tracking entry in tomorrow preview is replaced with a lesson preview
- Previous attempts conditional message renders
- Why anchor renders if `profile.initialWhy` is set

No additional changes needed here beyond section 4.

---

## 7. UPDATE: `src/screens/MemberDashboard.jsx` — Progressive disclosure

### 7.1 Add imports

At the top of `MemberDashboard.jsx`, add:

```javascript
import { isFeatureUnlocked, daysUntilUnlock, FEATURE_UNLOCK_DAYS } from "../featureUnlocks.js";
import { supabase } from "../supabase.js"; // already imported
```

### 7.2 Add unlock computation after `userGlobalDay` derivation

After the line `const userGlobalDay = getUserGlobalDay(profile);` (around line 58), add:

```javascript
const showFoodDiary     = isFeatureUnlocked('food_diary',     userGlobalDay);
const showStepTracker   = isFeatureUnlocked('step_tracker',   userGlobalDay);
const showProteinTarget = isFeatureUnlocked('protein_target', userGlobalDay);
const showCalorieTarget = isFeatureUnlocked('calorie_target', userGlobalDay);
const showIdentityCard  = userGlobalDay >= 4 && userGlobalDay <= 14;
```

### 7.3 Pinned "Why" anchor component

Create a new component file `src/components/WhyAnchor.jsx`:

```javascript
// Pinned "Why I'm here" anchor card — visible on every home screen from Day 0
// to Day 112. Three states:
//   - empty (currentDay < 3 and no initial_why): placeholder, not editable
//   - cta (currentDay >= 3 and no initial_why): prompt to write one
//   - filled (initial_why set): displays the quote with an edit affordance
import { useState } from "react";
import { C, F } from "../theme.js";
import { t } from "../i18n.js";

export function WhyAnchor({ profile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.initialWhy || "");
  const currentDay = profile.currentDay ?? 0; // caller passes via prop or it derives from getUserGlobalDay

  const hasWhy = !!profile.initialWhy;
  const canEdit = currentDay >= 3 || hasWhy;

  function handleSave() {
    onSave(draft.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{
        background: C.accentDim, border: `1px solid ${C.accent}44`,
        borderRadius: 18, padding: "14px 18px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          {t("v2.why.anchor.label")}
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, 200))}
          placeholder={t("v2.why.placeholder")}
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "10px 12px", color: C.text, fontSize: 14,
            fontFamily: F.sans, outline: "none", resize: "none", lineHeight: 1.5,
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={handleSave} disabled={!draft.trim()}
            style={{
              flex: 1, padding: "10px", borderRadius: 10,
              background: draft.trim() ? C.accent : C.dim,
              color: draft.trim() ? C.bg : C.muted,
              border: "none", fontSize: 13, fontWeight: 500,
              fontFamily: F.sans, cursor: draft.trim() ? "pointer" : "default",
            }}>
            {t("v2.identity.save")}
          </button>
          <button onClick={() => { setDraft(profile.initialWhy || ""); setEditing(false); }}
            style={{
              padding: "10px 14px", borderRadius: 10, background: "none",
              border: `1px solid ${C.border}`, color: C.muted, fontSize: 13,
              fontFamily: F.sans, cursor: "pointer",
            }}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (!hasWhy && currentDay < 3) {
    return (
      <div style={{
        background: C.card, border: `1px dashed ${C.border}`,
        borderRadius: 18, padding: "14px 18px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
          {t("v2.why.anchor.label")}
        </div>
        <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
          {t("v2.why.anchor.empty")}
        </div>
      </div>
    );
  }

  if (!hasWhy && currentDay >= 3) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{
          width: "100%", textAlign: "left",
          background: C.card, border: `1px solid ${C.accent}88`,
          borderRadius: 18, padding: "14px 18px", marginBottom: 14,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
          {t("v2.why.anchor.label")}
        </div>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>
          {t("v2.why.anchor.add")}
        </div>
      </button>
    );
  }

  return (
    <div style={{
      background: C.accentDim, border: `1px solid ${C.accent}44`,
      borderRadius: 18, padding: "14px 18px", marginBottom: 14,
      position: "relative",
    }}>
      <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
        {t("v2.why.anchor.label")}
      </div>
      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55, fontStyle: "italic", paddingRight: 36 }}>
        «{profile.initialWhy}»
      </div>
      <button onClick={() => { setDraft(profile.initialWhy); setEditing(true); }}
        style={{
          position: "absolute", top: 12, right: 12,
          background: "none", border: "none", color: C.muted,
          fontSize: 11, cursor: "pointer", fontFamily: "inherit",
        }}>
        {t("v2.why.anchor.edit")}
      </button>
    </div>
  );
}
```

### 7.4 Use WhyAnchor in MemberDashboard's today tab

In `MemberDashboard.jsx`, find the today tab content render block. Import the component:

```javascript
import { WhyAnchor } from "../components/WhyAnchor.jsx";
```

Then near the top of the today tab JSX (above the daily carousel, below the day counter), insert:

```jsx
<WhyAnchor
  profile={{ ...profile, currentDay: userGlobalDay }}
  onSave={(why) => {
    setProfile(p => ({ ...p, initialWhy: why }));
    // Persist
    supabase.from("profiles").update({ initial_why: why }).eq("id", profile.id);
  }}
/>
```

### 7.5 Identity affirmation card (Days 4–14)

Create a new component `src/components/IdentityCard.jsx`:

```javascript
// Identity affirmation prompt — appears on the home screen Days 4–14 only.
// One day-specific prompt per day, persisted to daily_reflections table.
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, F } from "../theme.js";
import { t } from "../i18n.js";

export function IdentityCard({ profile, currentDay }) {
  const [response, setResponse] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const promptKey = `v2.identity.day${currentDay}`;

  useEffect(() => {
    if (!profile?.id || currentDay < 4 || currentDay > 14) {
      setLoading(false); return;
    }
    supabase
      .from("daily_reflections")
      .select("response")
      .eq("user_id", profile.id)
      .eq("day_number", currentDay)
      .single()
      .then(({ data }) => {
        if (data?.response) {
          setResponse(data.response);
          setSaved(true);
        }
        setLoading(false);
      });
  }, [profile?.id, currentDay]);

  async function handleSave() {
    if (!response.trim()) return;
    await supabase
      .from("daily_reflections")
      .upsert({
        user_id: profile.id,
        day_number: currentDay,
        prompt_key: promptKey,
        response: response.trim(),
      }, { onConflict: "user_id,day_number" });
    setSaved(true);
  }

  if (loading || currentDay < 4 || currentDay > 14) return null;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 18, padding: "14px 18px", marginBottom: 14,
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
        Identity · Day {currentDay}
      </div>
      <div style={{ fontSize: 14, color: C.text, marginBottom: 10, lineHeight: 1.5, fontStyle: "italic" }}>
        {t(promptKey)}
      </div>
      <textarea
        value={response}
        onChange={e => { setResponse(e.target.value.slice(0, 300)); setSaved(false); }}
        rows={2}
        placeholder="…"
        style={{
          width: "100%", boxSizing: "border-box",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "10px 12px", color: C.text, fontSize: 13,
          fontFamily: F.sans, outline: "none", resize: "none", lineHeight: 1.55,
        }}
      />
      <button onClick={handleSave} disabled={!response.trim() || saved}
        style={{
          marginTop: 8, padding: "8px 14px", borderRadius: 10,
          background: saved ? C.accentDim : (response.trim() ? C.accent : C.dim),
          color: saved ? C.accent : (response.trim() ? C.bg : C.muted),
          border: "none", fontSize: 12, fontWeight: 500,
          fontFamily: F.sans, cursor: response.trim() && !saved ? "pointer" : "default",
        }}>
        {saved ? `✓ ${t("v2.identity.saved")}` : t("v2.identity.save")}
      </button>
    </div>
  );
}
```

In `MemberDashboard.jsx`, import and conditionally render:

```javascript
import { IdentityCard } from "../components/IdentityCard.jsx";

// ...inside the today tab, after WhyAnchor:
{showIdentityCard && <IdentityCard profile={profile} currentDay={userGlobalDay} />}
```

### 7.6 Gate the food / calorie / protein / steps metric rows

The "Показатели дня" (day metrics) section in MemberDashboard contains rows for calories, protein, and steps. Wrap each row with the relevant unlock check:

```javascript
// Only render food-related metrics after Day 20
{showFoodDiary && (
  <MetricBar label="Калории" value={nutritionSource?.calories || 0} max={profile.dailyTargets?.calories || 2000} /* ... */ />
)}

{showProteinTarget && (
  <MetricBar label="Белок" value={nutritionSource?.protein || 0} max={profile.dailyTargets?.protein || 150} /* ... */ />
)}

{showStepTracker && (
  <MetricBar label="Шаги" value={todayLog?.steps || 0} max={profile.dailyTargets?.steps || 10000} /* ... */ />
)}
```

If ALL of `showFoodDiary`, `showProteinTarget`, and `showStepTracker` are false (Week 1–2), hide the entire "Показатели дня" section.

### 7.7 Replace FatSecret card on locked days

Find where `<FatSecretConnect />` is rendered. Wrap it:

```javascript
{showFoodDiary
  ? <FatSecretConnect profile={profile} setProfile={setProfile} userId={profile.id} />
  : <LockedCard featureName="food_diary" currentDay={userGlobalDay} />
}
```

Create a small `LockedCard` component (can live at the top of MemberDashboard.jsx or in a new file):

```javascript
function LockedCard({ featureName, currentDay }) {
  const days = daysUntilUnlock(featureName, currentDay);
  const titleKey = `v2.locked.${featureName === 'food_diary' ? 'food' : featureName === 'step_tracker' ? 'steps' : featureName === 'protein_target' ? 'protein' : 'calories'}.title`;
  const bodyKey  = `v2.locked.${featureName === 'food_diary' ? 'food' : featureName === 'step_tracker' ? 'steps' : featureName === 'protein_target' ? 'protein' : 'calories'}.body`;

  return (
    <div style={{
      background: C.card, border: `1px dashed ${C.border}`,
      borderRadius: 20, padding: "16px 18px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: C.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.muted }}>🔒</div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: C.text }}>{t(titleKey)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t("v2.locked.food.countdown", { days })}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{t(bodyKey)}</div>
    </div>
  );
}
```

---

## 8. UPDATE: `src/components/LogModals.jsx` + `FatSecretConnect.jsx`

### 8.1 LogModals — gate calorie/protein inputs in evening modal

`LogModals.jsx` contains `EveningLogModal` which asks for calories, protein, etc. The evening log itself should still open (so users can log greens, weight if missed, etc.), but the calorie/protein input fields should be hidden until Day 20.

Add an import at the top of `LogModals.jsx`:
```javascript
import { isFeatureUnlocked } from "../featureUnlocks.js";
import { getUserGlobalDay } from "../program.js";
```

Inside `EveningLogModal`, after the `profile` prop is destructured, add:
```javascript
const currentDay = getUserGlobalDay(profile);
const showFoodInputs   = isFeatureUnlocked('food_diary',     currentDay);
const showProteinInput = isFeatureUnlocked('protein_target', currentDay);
const showStepsInput   = isFeatureUnlocked('step_tracker',   currentDay);
```

Then wrap each input field (calories, protein, steps) with the relevant flag. If none of them are open, the evening modal should still show but contain only the greens checkbox + a notice:

```jsx
{!showFoodInputs && !showProteinInput && !showStepsInput && (
  <div style={{ background: C.card, padding: "12px 14px", borderRadius: 10, fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.55 }}>
    Сегодня в дневнике — только короткая рефлексия. Калории, белок и шаги будут добавлены на соответствующих неделях.
  </div>
)}
```

Add the equivalent English to the i18n keys block (use key `v2.evening.locked.notice`).

### 8.2 FatSecretConnect — gate behind unlock

`FatSecretConnect.jsx` is a component that runs the connect flow. It should never be reachable before Day 20. The MemberDashboard gating in section 7.7 prevents it from rendering, so no internal change needed — but add a defensive check at the top of the component:

```javascript
import { getUserGlobalDay } from "../program.js";
import { isFeatureUnlocked } from "../featureUnlocks.js";

export function FatSecretConnect({ profile, setProfile, userId }) {
  const currentDay = getUserGlobalDay(profile);
  if (!isFeatureUnlocked('food_diary', currentDay)) return null;
  // ...rest of component unchanged
}
```

---

## 9. FIXES: `DailyTaskCarousel.jsx` + `WeekendTipsBar.jsx`

### 9.1 WeekendTipsBar — Fix the premature steps tip

`WeekendTipsBar.jsx` currently shows `"Длинная прогулка вместо привычной тренировки. 8–10 тысяч шагов — это уже хороший день."` as Saturday Tip #1 (Week 1), before the step counter unlocks at Day 33. This contradicts the curriculum.

Replace the SATURDAY_TIPS array (in WeekendTipsBar.jsx, lines ~22–31) with this version, which ordered so the first 4 Saturdays (covering Weeks 1–4) don't reference step counts:

```javascript
const SATURDAY_TIPS = [
  "Готовка дома вместо доставки. Контроль над процессом + удовольствие от приготовления.",
  "Завтрак с белком (яйца, творог, греческий йогурт) — выходные начинаются с правильной ноты.",
  "Если планируется большой ужин, не \"экономь\" еду днём. Голод = срыв.",
  "Сходи на рынок или в фермерский магазин. Свежие продукты + время на воздухе.",
  // Tips below appear from Saturday of Week 5+ (step counter is unlocked)
  "Длинная прогулка вместо привычной тренировки. 8–10 тысяч шагов — это уже хороший день.",
  "Активный отдых засчитывается. Поход в парк — это тоже движение.",
  "Попробуй новый рецепт. Готовка — лучший способ узнать, из чего реально состоит еда.",
  "Если устал — отдыхай. Восстановление важнее, чем добить норму шагов любой ценой.",
];
```

Same logic applies to FRIDAY_TIPS — review and reorder so no tip mentioning calories appears in Week 1–2 (before energy balance lesson on Day 15). Specifically move these to indices 4+:
- `"Алкоголь = 7 ккал/г. Бокал вина ≈ 130 ккал, пинта пива ≈ 200 ккал. Учитывай в дневнике."`
- `"Большой ужин не страшен, если день был спокойным по калориям…"`

### 9.2 DailyTaskCarousel — Match new curriculum types

`DailyTaskCarousel.jsx` reads from `currentWeekData.days` (the PROGRAM array). After section 11 below restructures the curriculum data, this component will receive different day data. Two changes are needed:

a) The current day rendering uses `day.type` with values `"nutrition" | "training" | "mindset" | "rest"`. The new curriculum uses `"lesson" | "action" | "reflection"`. Add an explicit mapping at the top:

```javascript
const TYPE_DISPLAY = {
  // Old curriculum types — kept for v1 users still on the existing PROGRAM
  nutrition: { color: C.blue,   label: "Питание"     },
  training:  { color: C.orange, label: "Тренировка"  },
  mindset:   { color: C.purple, label: "Психология"  },
  rest:      { color: C.green || C.accent, label: "Восстановление" },
  // New curriculum types (post-restructure)
  lesson:     { color: C.blue,    label: "Урок"      },
  action:     { color: C.orange,  label: "Действие"  },
  reflection: { color: C.accent,  label: "Рефлексия" },
};
```

Then use `TYPE_DISPLAY[day.type] || TYPE_DISPLAY.lesson` wherever the type is currently looked up.

b) If `day.action_prompt_ru` exists (new curriculum action days), show it prominently. If it's a reflection day, show the prompt as a text input field rather than a paragraph.

---

## 10. UPDATE: `src/components/Chat.jsx` + `/api/chat`

### 10.1 Pass user context with every chat message

In `Chat.jsx`, find both `quickSend` and `sendMessage` functions. Both POST to `/api/chat` with `{ userId, message }`. Extend to include identity context:

```javascript
async function quickSend(){
  if(!chatInput.trim()||chatLoading) return;
  const text=chatInput.trim();
  setChatInput(""); setChatLoading(true);
  try{
    const res=await fetch("/api/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        userId: profile.id,
        message: text,
        // ─── NEW: user context for system prompt ───────────────
        userContext: {
          name: profile.name,
          previousAttempts: profile.previousAttempts,
          initialWhy: profile.initialWhy,
          currentDay: getUserGlobalDay(profile),
          currentWeek: profile.currentWeek,
        },
      }),
    });
    // ...rest unchanged
  }catch{}
}
```

Make the same change in `sendMessage` inside `ChatModal`.

### 10.2 Server-side system prompt — `api/chat.js`

Update the system prompt construction in `/api/chat.js` (this file is in `api/` not `src/`). Tell Claude Code:

> Look at `api/chat.js`. Find where the system prompt is built (likely as a string before the API call to Anthropic). Append the following section to that system prompt, interpolating `userContext` fields:

```
USER CONTEXT (always available, do not repeat back to user unprompted):
- Name: {userContext.name}
- Previous fat-loss attempts: {userContext.previousAttempts} (one of: never, 1_2, 3_5, many)
- User's stated "why": {userContext.initialWhy || "(not set yet)"}
- Current day: {userContext.currentDay} / 112
- Current week: {userContext.currentWeek} / 16

VOCABULARY RULES (Russian):
- Never use: "диета", "сила воли", "читмил", "срыв", "силу воли", "ограничивать себя", "бороться с весом", "сбросить вес".
- Use instead: "план", "система", "эксперимент", "данные", "паттерн", "снижать жировую массу".
- Reframe past failures as data points, never as failures.

VOCABULARY RULES (English):
- Never use: "diet", "willpower", "cheat day/meal", "fall off the wagon", "lose weight".
- Use instead: "plan", "system", "experiment", "data", "pattern", "reduce body fat".

DAY-GATED TOPIC RULES:
- Before Day 18: do NOT recommend specific calorie targets. If asked, say: "We calculate yours on Day 18. Until then, focus on {current week's theme}."
- Before Day 20: do NOT recommend food tracking. If asked, say: "Food tracking opens on Day 20. Until then we work on the why, not the what."
- Before Day 24: do NOT recommend specific protein numbers in g/kg. General "more protein" is fine.
- Before Day 33: do NOT recommend specific step targets.
- Before Day 92: training questions are answered as education only, not as prescriptive workouts.

TONE BY previousAttempts:
- "never": Encouraging, scientific, explains the basics, doesn't assume prior knowledge.
- "1_2": Acknowledges some experience. Asks what didn't work before.
- "3_5": Treats user as informed. Focus on systems, not information.
- "many": Treats user as expert. Explicitly acknowledges that information isn't the problem. Focus on identity, environment, and behavioral architecture.

If userContext.initialWhy is set, you can reference it occasionally (not every message) — anchor the user back to their stated reason when motivation comes up.
```

### 10.3 Update the "Quick suggestion" prompts in ChatModal

Inside `ChatModal`'s empty state, three default prompts are shown:
```javascript
["Почему мой вес не снижается?","Сколько белка мне нужно?","Что делать если нет мотивации?"]
```

The middle one violates the day-gated rules (asks for protein numbers, but Day < 24 users will get a deferral). Replace with day-aware suggestions:

```javascript
const currentDay = getUserGlobalDay(profile);
const defaultPrompts = currentDay < 18
  ? [
      "Почему я раньше всегда срывался?",
      "Что делает эту программу другой?",
      "Что я могу сделать сегодня?",
    ]
  : currentDay < 33
  ? [
      "Я не вижу прогресса — что делать?",
      "Сколько белка мне нужно?",
      "Как справляться с тягой к еде?",
    ]
  : [
      "Почему вес встал?",
      "Как улучшить сон?",
      "Чем заменить тренировку, если устал?",
    ];
```

---

## 11. CURRICULUM SCAFFOLDING: `src/program.js`

### 11.1 Keep existing PROGRAM, add NEW_PROGRAM

The existing `PROGRAM` array drives v1 users. We need to add a separate `NEW_PROGRAM` for v2 users that follows the curriculum file's structure.

At the bottom of `program.js`, before `export { PROGRAM };`, add a new export:

```javascript
// ─── NEW CURRICULUM (v2) ───────────────────────────────────────────────────
// Structure aligned with FORM16_112_day_curriculum.md.
// Each week has: { week, phase, theme_ru, theme_en, overview_ru, overview_en, days: [...] }
// Each day has: { day, type, category, title_ru, title_en, body_ru, body_en,
//                 action_prompt_ru?, action_prompt_en?, citations?: [] }
//
// LESSON BODY COPY IS A SEPARATE EDITORIAL TASK. Days here have title +
// placeholder body. Real body text will be pasted in during content phase.

export const NEW_PROGRAM = [
  {
    week: 1, phase: "foundation",
    theme_ru: "Зачем ты здесь — Идентичность и внутренняя мотивация",
    theme_en: "Why you're here — Identity and internal motivation",
    overview_ru: "Делаем эту попытку отличной от всех предыдущих. Никаких подсчётов, никакого трекинга — только работа с тем, что сломалось в прошлый раз и кем ты хочешь стать.",
    overview_en: "Make this attempt different from every previous one. No counting, no tracking — just work on what broke before and who you want to become.",
    days: [
      {
        day: 1, type: "lesson", category: "identity",
        title_ru: "Почему 80–90% срываются — и почему ты будешь иначе",
        title_en: "Why 80–90% relapse — and why you'll be different",
        body_ru: "{TODO: 200-word lesson body in Russian}",
        body_en: "{TODO: 200-word lesson body in English}",
        citations: ["Wing & Phelan, 2005, NWCR"],
      },
      {
        day: 2, type: "lesson", category: "identity",
        title_ru: "Внешняя vs внутренняя мотивация (Теория самодетерминации)",
        title_en: "External vs internal motivation (Self-Determination Theory)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        citations: ["Deci & Ryan, 2000"],
      },
      {
        day: 3, type: "action", category: "identity",
        title_ru: "Упражнение «5 почему» — найди настоящую причину",
        title_en: "The '5 Whys' exercise — find your real reason",
        body_ru: "{TODO: Brief intro to 5 Whys}",
        body_en: "{TODO}",
        action_prompt_ru: "Запиши свой первый «почему я хочу снизить вес». Потом спроси себя «а почему это важно?» — и так 5 раз. Последний ответ обычно и есть настоящая причина.",
        action_prompt_en: "Write your first 'why I want to lose weight.' Then ask 'and why does that matter?' — five times. The last answer is usually your real reason.",
      },
      {
        day: 4, type: "lesson", category: "identity",
        title_ru: "Идентичность vs результат: «Я — человек, который…»",
        title_en: "Identity vs outcome: 'I am someone who…'",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        citations: ["James Clear, Atomic Habits"],
      },
      {
        day: 5, type: "lesson", category: "identity",
        title_ru: "Ожирение — не проблема силы воли (биология + среда)",
        title_en: "Obesity isn't a willpower problem (biology + environment)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
      },
      {
        day: 6, type: "action", category: "identity",
        title_ru: "Переосмысли прошлые неудачи как данные",
        title_en: "Reframe past failures as data",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        action_prompt_ru: "Вспомни 3 последние попытки снизить вес. Для каждой ответь: что конкретно сломалось? Не «я слабый», а «у меня не было плана на выходные», «я не выспался», «у меня не было системы поддержки». Это 3 урока для следующих 16 недель.",
        action_prompt_en: "Recall your last 3 weight loss attempts. For each, answer: what specifically broke? Not 'I was weak' — 'I had no plan for weekends,' 'I wasn't sleeping enough,' 'I had no support system.' That's 3 lessons for the next 16 weeks.",
      },
      {
        day: 7, type: "reflection", category: "identity",
        title_ru: "Рефлексия 1-й недели: твоё «зачем» одной фразой",
        title_en: "Week 1 reflection: your one-sentence why",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        action_prompt_ru: "Если ещё не записал «зачем» в одном предложении — сделай это сейчас. Сохраним в карточке на главном экране.",
        action_prompt_en: "If you haven't written your why in one sentence yet — do it now. We'll pin it on your home screen.",
      },
    ],
  },
  {
    week: 2, phase: "foundation",
    theme_ru: "Привычки — как они формируются на самом деле",
    theme_en: "Habits — how they actually form",
    overview_ru: "Устанавливаем операционную систему до установки приложений. Понимание того, как формируются привычки, важнее любых конкретных привычек.",
    overview_en: "Install the operating system before installing the apps. Understanding how habits form matters more than any specific habit.",
    days: [
      {
        day: 8, type: "lesson", category: "habits",
        title_ru: "До 45% ежедневного поведения — привычки (Wood, Quinn, Kashy 2002)",
        title_en: "Up to 45% of daily behavior is habitual (Wood, Quinn & Kashy 2002)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        citations: ["Wood, Quinn & Kashy, 2002, J Pers Soc Psychol"],
      },
      {
        day: 9, type: "lesson", category: "habits",
        title_ru: "Цикл «триггер → действие → награда»",
        title_en: "The cue → routine → reward loop",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        citations: ["Duhigg, The Power of Habit"],
      },
      {
        day: 10, type: "lesson", category: "habits",
        title_ru: "Правда о 66 днях: 18–254 дня на привычку (Lally 2010)",
        title_en: "The 66-day truth: habits form in 18–254 days (Lally 2010)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        citations: ["Lally et al., 2010, Eur J Soc Psychol"],
      },
      {
        day: 11, type: "lesson", category: "habits",
        title_ru: "«Если — то» планы: метод, удваивающий шансы на успех",
        title_en: "Implementation intentions: the if–then plan that doubles success",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        citations: ["Gollwitzer, 1999"],
      },
      {
        day: 12, type: "action", category: "habits",
        title_ru: "Habit stacking — спроектируй свой первый стек",
        title_en: "Habit stacking — design your first stack",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        action_prompt_ru: "Выбери одну новую микро-привычку и привяжи её к уже существующей. Формула: «После того, как я [уже делаю X], я буду [новое Y]». Например: «После того, как поставлю чайник, я выпью стакан воды».",
        action_prompt_en: "Pick one new micro-habit and stack it on an existing one. Formula: 'After I [already do X], I will [new Y].' Example: 'After I put the kettle on, I'll drink a glass of water.'",
      },
      {
        day: 13, type: "lesson", category: "habits",
        title_ru: "Почему сила воли не работает (и что работает)",
        title_en: "Why willpower fails (and what works)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
      },
      {
        day: 14, type: "reflection", category: "habits",
        title_ru: "Рефлексия 2-й недели: твоя ключевая привычка",
        title_en: "Week 2 reflection: your keystone habit",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        action_prompt_ru: "Выбери ОДНУ привычку на оставшиеся 14 недель. Не пять. Одну. Запиши её в профиле.",
        action_prompt_en: "Pick ONE habit for the remaining 14 weeks. Not five. One. Save it to your profile.",
      },
    ],
  },
  // Weeks 3–16 follow the same shape. Use FORM16_112_day_curriculum.md
  // as the source for titles. Bodies are placeholders ({TODO}) for now.
];
```

### 11.2 Add a helper to read from the correct curriculum

Below the existing helpers in `program.js`, add:

```javascript
// Returns the relevant curriculum array based on the user's onboarding_version.
// v1 users get the original PROGRAM; v2 users get NEW_PROGRAM.
export function getCurriculum(profile) {
  return (profile?.onboardingVersion === 2) ? NEW_PROGRAM : PROGRAM;
}

// Refactored to use the correct curriculum.
export function getTodayDataV2(profile) {
  const globalDay = getUserGlobalDay(profile);
  const curriculum = getCurriculum(profile);
  if (globalDay === 0) {
    return { week: curriculum[0], day: curriculum[0].days[0], isDay0: true };
  }
  const weekIdx = Math.min(15, Math.floor((globalDay - 1) / 7));
  const dayIdx = (globalDay - 1) % 7;
  const week = curriculum[weekIdx] || curriculum[0];
  const day = week.days[dayIdx] || week.days[0];
  return { week, day, isDay0: false };
}
```

**Do not replace `getTodayData`.** Add `getTodayDataV2` as a new export. Then in components that need v2 awareness (`DailyTaskCarousel`, `MissionStrip`, `MemberDashboard`), import `getTodayDataV2` and branch:

```javascript
const todayData = profile.onboardingVersion === 2
  ? getTodayDataV2(profile)
  : getTodayData(profile);
```

### 11.3 Editorial backlog (NOT a Claude Code task)

The 112 lesson body texts (`body_ru`, `body_en`) and remaining 14 weeks of day entries need to be written by a human editor. Claude Code's task ends at the structure scaffolding plus Weeks 1–2 example data. Weeks 3–16 should be created with day-level entries but `{TODO}` placeholders for body text. Use the curriculum file's titles directly.

---

## 12. MIGRATION + ROUTING

### 12.1 Profile cache invalidation

Existing v1 users have a `form16_profile_cache` in localStorage that doesn't include the new v2 fields. The first time an existing user loads the app after this deploy, the cached profile will be missing `previousAttempts` and `initialWhy`. This is fine — those fields stay null and the conditional rendering handles null cleanly.

**No forced cache invalidation needed.** The next `loadProfile` round-trip will fill in the new field reads from `loadProfile` mapping in section 5.5.

### 12.2 Existing v9 users on Day 0

If an existing user has not yet completed Day 0 (i.e., `joinedAt === today && !localStorage.form16_day0_${userId}`), show a one-time announcement banner in Day0Screen offering to restart with the new flow.

Add to `Day0Screen.jsx` (only shows for users with `onboardingVersion === 1`):

```javascript
{profile.onboardingVersion === 1 && (
  <div style={{ padding: "0 24px 16px" }}>
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "12px 14px",
      fontSize: 12, color: C.muted, lineHeight: 1.55,
    }}>
      Программа была обновлена с момента твоей регистрации. Хочешь начать с обновлённой версии?
      <button onClick={() => {
        // Sign out, then user can re-sign-up with the new flow
        supabase.auth.signOut();
      }} style={{
        marginLeft: 8, color: C.accent, background: "none",
        border: "none", padding: 0, fontFamily: "inherit", fontSize: 12,
        textDecoration: "underline", cursor: "pointer",
      }}>
        Перезапустить
      </button>
    </div>
  </div>
)}
```

### 12.3 Final test pass

After all phases are done, run through:

- [ ] Sign up a new user → sees new Step 1 with attempts + why
- [ ] Select "never" → welcome screen shows first-timer copy
- [ ] Select "3_5" → welcome shows repeat-dieter copy
- [ ] SCOFF answers with ≥2 yes → flagged screen with checkbox appears, cannot continue until checked
- [ ] Pregnancy selected on Step 3 → cannot proceed
- [ ] Day 0 screen renders entirely in English when language = en
- [ ] Day 0 tomorrow preview shows lesson, NOT food tracking
- [ ] Day 1 home: food/calorie/protein/steps rows all hidden or locked
- [ ] Day 1 home: WhyAnchor shows the user's quote if they entered it
- [ ] Day 1 home: WhyAnchor shows "we'll write together on Day 3" if they skipped it
- [ ] Day 4 home: IdentityCard appears with day-4 prompt
- [ ] Day 14 home: IdentityCard still appears with day-14 prompt
- [ ] Day 15 home: IdentityCard disappears
- [ ] Day 20 home: food diary unlocks, FatSecret connect appears
- [ ] Day 33 home: step counter row appears
- [ ] Existing v1 user logging in → still sees v1 home screen (with retroactive locks applied based on their currentDay)
- [ ] AI trainer asked about calories on Day 5 → defers to Day 18
- [ ] Russian + English both render every screen end-to-end
- [ ] No `t` variable name clashes (search for `=> t,` or `, t,` in callback signatures)
- [ ] All new hooks called unconditionally
- [ ] All Supabase round-trips work — sign up, log save, profile update

---

## 13. FILES NOT TOUCHED

These files are unchanged by this spec:

- `src/supabase.js` — client setup is fine as-is
- `src/screens/AuthScreen.jsx` — auth flow unchanged
- `src/screens/CoachDashboard.jsx` — coach tools unchanged
- `src/screens/Splash.jsx` — landing page unchanged
- `src/screens/MemberDashboard.jsx` — modifications only as described in section 7
- `src/components/icons.jsx` — icon set unchanged
- `src/components/ui.jsx` — primitive UI components unchanged
- `src/components/ProgramView.jsx` — program calendar view unchanged
- `src/components/MissionStrip.jsx` — already adapts metrics by week per existing logic; no change required
- `src/i18n.js` — helper is fine; only `lang.js` (data) is extended
- `src/utils.js` — math helpers unchanged
- `src/theme.js` — colors and fonts unchanged
- `src/main.jsx` — entry point unchanged
- `src/LangContext.jsx` — context unchanged
- `api/*` — only `api/chat.js` is touched per section 10; FatSecret API files unchanged
- `dist/`, `node_modules/`, build artifacts — never touched

### 13.1 Delete from repo

```bash
rm -rf design/
```

The three `today-N-*.html` design variants no longer match the shipped UI (MissionStrip + DailyTaskCarousel don't follow any of them) and should be removed.

---

## 14. WHAT'S NOT IN THIS SPEC (separate work)

The following are out of scope for Claude Code and need to be done separately:

1. **Writing 112 lesson body texts** (150–300 words each, Russian + English) — editorial task
2. **Writing reflection prompts** for Days 7, 14, 21, 28, etc. beyond the templates already shown — editorial
3. **Translating Friday/Sunday WeekendTipsBar tips to English** — currently all-Russian
4. **A/B testing the SCOFF screener** — measure signup conversion impact before vs after
5. **Designing locked-state UI artwork** — current spec uses a 🔒 emoji + dashed border, which is functional but a designer could elevate it
6. **Maintenance phase content** (Weeks 17+) — out of program scope for now

---

End of spec.
