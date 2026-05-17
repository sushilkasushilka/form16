// 16-week program data, day-of-program helpers, mock athletes, and the
// FatSecret HTTP layer used by the modal that talks to /api/fs-sync.

/**
 * ─── SLIDE TAXONOMY (v1.0) ─────────────────────────────────────────────────
 *
 * Each day carries `slides_ru` and `slides_en` arrays. Each element is a
 * slide object whose `kind` field tags one of five renderable shapes. The
 * carousel reads `kind` to pick the layout, then reads kind-specific fields
 * for the content. `kind` values are English literals (rule #4) and are
 * never translated.
 *
 *  ╭─────────────────────────────────────────────────────────────────────╮
 *  │ kind: "cover"                                                       │
 *  │   First slide of every day. Sets up the topic.                      │
 *  │   Fields:                                                           │
 *  │     hook: string  — short opening sentence, max ~120 chars          │
 *  ╰─────────────────────────────────────────────────────────────────────╯
 *  ╭─────────────────────────────────────────────────────────────────────╮
 *  │ kind: "lesson"                                                      │
 *  │   Standard content paragraph. Most slides per day are these.        │
 *  │   Fields:                                                           │
 *  │     body: string         — paragraph, target ~60–120 words          │
 *  │     source?: string      — citation footer (optional)               │
 *  ╰─────────────────────────────────────────────────────────────────────╯
 *  ╭─────────────────────────────────────────────────────────────────────╮
 *  │ kind: "callout"                                                     │
 *  │   High-impact emphasis. Big-text moment in the swipe rhythm.        │
 *  │   Fields:                                                           │
 *  │     headline: string     — the bold short statement, max ~80 chars  │
 *  │     subtext?: string     — supporting fragment, max ~120 chars      │
 *  │     source?: string      — citation if the callout is a stat        │
 *  ╰─────────────────────────────────────────────────────────────────────╯
 *  ╭─────────────────────────────────────────────────────────────────────╮
 *  │ kind: "action"                                                      │
 *  │   Final slide of an action day. User input expected.                │
 *  │   Fields:                                                           │
 *  │     prompt: string       — instruction for what to do/write         │
 *  │     placeholder?: string — textarea placeholder hint                │
 *  │     inputType?: "text" | "list"   — default "text"                  │
 *  ╰─────────────────────────────────────────────────────────────────────╯
 *  ╭─────────────────────────────────────────────────────────────────────╮
 *  │ kind: "reflection"                                                  │
 *  │   Final slide of a reflection day.                                  │
 *  │   Fields:                                                           │
 *  │     prompt: string       — reflection question                      │
 *  │     placeholder?: string                                            │
 *  │     inputType?: "text"   — only "text" supported for reflection     │
 *  ╰─────────────────────────────────────────────────────────────────────╯
 *
 * Placeholder convention: any string field equal to "{TODO}" is treated by
 * the UI as not-yet-authored. The carousel renders a generic fallback in
 * that case so days remain navigable while content is being written.
 *
 * Legacy fields (body_ru, body_en, action_prompt_ru, action_prompt_en) stay
 * on day objects through Phase L.5d, to give the carousel a transition
 * path before they're deleted.
 */

// ─── 16-WEEK CURRICULUM ────────────────────────────────────────────────────
// Structure aligned with FORM16_112_day_curriculum.md.
// Each week has: { week, phase, theme_ru, theme_en, overview_ru, overview_en, days: [...] }
// Each day has: { day, type, category, title_ru, title_en, body_ru, body_en,
//                 action_prompt_ru?, action_prompt_en?, citations?: [] }
//
// LESSON BODY COPY IS A SEPARATE EDITORIAL TASK. Days here have title +
// placeholder body. Real body text will be pasted in during content phase.

export const PROGRAM = [
  // ─── PHASE 1 — FOUNDATIONS ──────────────────────────────────────────────
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
        slides_ru: [
          { kind: "cover", hook: "Если ты пробовал раньше — это не провал. Это данные о том, что не работает." },
          { kind: "lesson", body: "Статистика жёсткая: 80–90% людей возвращают весь сброшенный вес в течение 1–5 лет. Это не про слабость и не про лень. Это про то, что большинство программ работают на короткий срок, а не на устойчивое изменение. National Weight Control Registry изучает редкие случаи — людей, которые удержали результат 10+ лет — и находит общие паттерны, которые большинство программ игнорируют.", source: "Wing & Phelan, 2005, NWCR" },
          { kind: "lesson", body: "Что отличает тех, кто удерживает? Не диета. Не сила выбора. Система привычек, которая работает на автопилоте, и идентичность — кем они себя видят. «Я человек, который двигается каждый день» переживает плохой день. «Я на диете» — нет." },
          { kind: "lesson", body: "Следующие 16 недель построены наоборот привычной модели. Сначала — мотивация и идентичность. Потом — поведенческие основы (сон, движение). И только потом — детали питания. Никаких ограничений в первую неделю. Никаких подсчётов в первые две. Сначала строим систему — потом загружаем в неё содержимое." },
          { kind: "lesson", body: "Если ты пробовал раньше — у тебя уже есть данные. Что сломалось в прошлый раз? Не было плана на выходные? Не хватало сна? Не было поддержки? Это не личные провалы — это слабые места системы. На Дне 6 разберём это подробно. Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        citations: ["Wing & Phelan, 2005, NWCR"],
      },
      {
        day: 2, type: "lesson", category: "identity",
        title_ru: "Внешняя vs внутренняя мотивация (Теория самодетерминации)",
        title_en: "External vs internal motivation (Self-Determination Theory)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "«Хочу похудеть, потому что начальник сказал» работает плохо. «Чтобы играть с ребёнком без одышки» — иначе." },
          { kind: "lesson", body: "Теория самодетерминации (Деси и Райан) разделяет мотивацию на внешнюю и внутреннюю. Внешняя — это давление, осуждение, награды. Внутренняя — это собственный смысл, ценности, любопытство. На коротком горизонте они работают похоже. На длинном — расходятся радикально." },
          { kind: "lesson", body: "Внешняя мотивация выгорает примерно за 6–12 недель. Это совпадает с типичным циклом «диеты»: первые два месяца — энтузиазм, потом — срыв, потом — стыд. Не потому что ты слабый. Потому что внешний топливный бак закончился, а внутренний даже не подключали." },
          { kind: "lesson", body: "Внутренняя мотивация строится на трёх вещах: автономия (это моё решение), компетентность (я научусь это делать), связь (это часть того, кем я хочу быть). Если хотя бы одна из трёх отсутствует — мотивация просядет на длинной дистанции.", source: "Deci & Ryan, 2000" },
          { kind: "lesson", body: "Завтра найдём твою настоящую внутреннюю причину упражнением «5 почему». Сегодня — просто отметь: когда ты вспоминаешь, зачем хочешь это сделать, ты опираешься на чужие ожидания или на своё? Без оценки. Это данные. Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
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
        slides_ru: [
          { kind: "cover", hook: "Поверхностная причина редко бывает настоящей. Настоящая обычно прячется на 4–5 уровней глубже." },
          { kind: "lesson", body: "Метод «5 почему» пришёл из инженерной диагностики Toyota — там его использовали для поиска корня проблемы. В мотивации он работает так же. Первый ответ почти всегда социально желаемый: «хочу выглядеть лучше», «хочу быть здоровее». Это не ложь, но это и не топливо для 16 недель." },
          { kind: "lesson", body: "На втором-третьем шаге начинается интересное. «Хочу быть здоровее → почему? → чтобы прожить дольше → почему? → чтобы видеть, как растут дети → почему важно видеть? → потому что мой отец не дожил». Вот это уже работает на длинной дистанции." },
          { kind: "lesson", body: "Правила: не цензурируй ответы, не пытайся их «улучшить». Если последний ответ кажется неудобным — это хороший знак. Настоящая причина часто связана со страхом, утратой или чем-то очень личным. Это и есть твоё топливо. Если есть вопросы — задай их ИИ-тренеру в чате." },
          { kind: "action", prompt: "Запиши свой первый «почему я хочу снизить вес». Потом спроси себя «а почему это важно?» — и так 5 раз. Последний ответ обычно и есть настоящая причина.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ],
      },
      {
        day: 4, type: "lesson", category: "identity",
        title_ru: "Идентичность vs результат: «Я — человек, который…»",
        title_en: "Identity vs outcome: 'I am someone who…'",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "«Я хочу похудеть» и «Я — человек, который заботится о своём теле» — это два разных будущих." },
          { kind: "lesson", body: "Джеймс Клир в Atomic Habits выделяет три уровня изменения: результат («–10 кг»), процесс («ходить 3 раза в неделю»), идентичность («я активный человек»). Большинство программ работают с результатом. Меньшинство — с процессом. Почти никто — с идентичностью. Но именно идентичность определяет, что ты делаешь, когда никто не смотрит.", source: "James Clear, Atomic Habits" },
          { kind: "lesson", body: "Разница простая: «я бросаю курить» — это про действие. «Я не курильщик» — это про то, кем ты являешься. Когда тебе предлагают сигарету, первая фраза подразумевает усилие. Вторая просто констатирует факт: «нет, спасибо, я не курю». Никакой борьбы." },
          { kind: "lesson", body: "Применительно к телу: «я на диете» — временно. «Я человек, который ест с пониманием» — навсегда. Это не магия словесных формулировок. Это про то, какие действия становятся согласованными с тем, кем ты себя считаешь, а какие — конфликтующими." },
          { kind: "lesson", body: "На этой неделе попробуй формулировку «Сегодня я — человек, который…». Не «я должен», не «я постараюсь». Утверждение. Завтра разберём, почему это работает на уровне привычек, а не только лозунгов. Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        citations: ["James Clear, Atomic Habits"],
      },
      {
        day: 5, type: "lesson", category: "identity",
        title_ru: "Ожирение — не проблема силы воли (биология + среда)",
        title_en: "Obesity isn't a willpower problem (biology + environment)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "Если бы ожирение решалось силой характера, оно бы исчезло. Решается оно средой." },
          { kind: "lesson", body: "За последние 50 лет средний вес взрослого человека в развитых странах вырос на 7–10 кг. За 50 лет генетика не изменилась. Сила характера тоже. Изменилось окружение: больше готовой еды, меньше движения, реклама везде, продукты разработаны быть максимально привлекательными. Это не персональная неудача — это системный сдвиг." },
          { kind: "lesson", body: "Биология тоже играет роль. Лептин — гормон, который сигнализирует мозгу о сытости. У людей с лишним весом часто есть лептиновая резистентность: сигнал идёт, но мозг его не слышит. Это не «слабая воля». Это сбитая обратная связь, которую невозможно исправить силой характера." },
          { kind: "lesson", body: "Кевин Холл (NIH) провёл в 2019 эксперимент: одна группа ела цельную еду без ограничений, другая — ультрапереработанную без ограничений. Вторая группа съедала на 508 ккал в день больше — не от слабости, а потому что переработанная еда обходит механизмы насыщения. Та же сила выбора — другой результат.", source: "Hall et al., 2019, Cell Metab" },
          { kind: "lesson", body: "Что из этого следует. Бороться с собой бесполезно — биология сильнее. Имеет смысл менять среду: что лежит в холодильнике, какие маршруты, какие компании, какой режим сна. Об этом будем подробно на 7-й неделе. Сегодня — просто признание: ты не сломан. Система сломана. Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
      },
      {
        day: 6, type: "action", category: "identity",
        title_ru: "Переосмысли прошлые неудачи как данные",
        title_en: "Reframe past failures as data",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        action_prompt_ru: "Вспомни 3 последние попытки снизить вес. Для каждой ответь: что конкретно сломалось? Не «я слабый», а «у меня не было плана на выходные», «я не выспался», «у меня не было системы поддержки». Это 3 урока для следующих 16 недель.",
        action_prompt_en: "Recall your last 3 weight loss attempts. For each, answer: what specifically broke? Not 'I was weak' — 'I had no plan for weekends,' 'I wasn't sleeping enough,' 'I had no support system.' That's 3 lessons for the next 16 weeks.",
        slides_ru: [
          { kind: "cover", hook: "Каждая прошлая попытка оставила тебе урок. Сегодня соберём их в один документ." },
          { kind: "lesson", body: "Когда мы вспоминаем прошлые попытки снизить вес, мозг по умолчанию выдаёт оценку: «не получилось, потому что я слабый». Это самая бесполезная интерпретация — она не даёт никакой опоры на будущее. Если ты слабый, значит, и в этот раз сорвёшься. Тупик." },
          { kind: "lesson", body: "Полезная интерпретация: «не получилось, потому что система имела дыру в конкретном месте». Дыра — это что-то воспроизводимое и решаемое. Не было плана на выходные. Не хватало сна и поэтому росла тяга к сладкому. Не было поддержки и я ел в одиночестве из-за стресса." },
          { kind: "lesson", body: "Это разница между «я слабый» (нерешаемо) и «у меня был слабый протокол на выходные» (решаемо). Те, кто удерживает результат годами, делают именно это переключение — превращают неудачи в фиксированные баги системы. Если есть вопросы — задай их ИИ-тренеру в чате." },
          { kind: "action", prompt: "Вспомни 3 последние попытки снизить вес. Для каждой ответь: что конкретно сломалось? Не «я слабый», а «у меня не было плана на выходные», «я не выспался», «у меня не было системы поддержки». Это 3 урока для следующих 16 недель.", inputType: "list" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "list" },
        ],
      },
      {
        day: 7, type: "reflection", category: "identity",
        title_ru: "Рефлексия 1-й недели: твоё «зачем» одной фразой",
        title_en: "Week 1 reflection: your one-sentence why",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        action_prompt_ru: "Если ещё не записал «зачем» в одном предложении — сделай это сейчас. Сохраним в карточке на главном экране.",
        action_prompt_en: "If you haven't written your why in one sentence yet — do it now. We'll pin it on your home screen.",
        slides_ru: [
          { kind: "cover", hook: "Если твой «зачем» не помещается в одно предложение — он слишком размытый, чтобы держать тебя в трудный день." },
          { kind: "lesson", body: "Первая неделя была про идентичность и мотивацию — не про подсчёты и не про диету. Это было сознательно. Если ты не знаешь, зачем — никакая система не удержит. А если знаешь — система становится гораздо более устойчивой." },
          { kind: "lesson", body: "Одна фраза — это формат, потому что в трудный момент ты не будешь читать абзац. Ты вспомнишь короткую фразу. «Чтобы играть с дочкой без одышки» работает. «Чтобы быть здоровее, нравиться себе, лучше спать и не болеть» — нет. Слишком общее, не цепляет." },
          { kind: "lesson", body: "Хорошая фраза обычно: указывает на конкретного человека или ситуацию, описывает то, что ты будешь делать, а не то, чем не будешь, и звучит как твоя собственная, а не из брошюры. Если она вызывает чуть-чуть смущения — это хороший знак, значит, она настоящая. Если есть вопросы — задай их ИИ-тренеру в чате." },
          { kind: "reflection", prompt: "Если ещё не записал «зачем» в одном предложении — сделай это сейчас. Сохраним в карточке на главном экране.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ],
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
        slides_ru: [
          { kind: "cover", hook: "Сколько твоих действий за день — настоящий выбор? Меньше, чем кажется." },
          { kind: "callout", headline: "До 45%", subtext: "ежедневного поведения людей — привычки, не решения", source: "Wood, Quinn & Kashy, 2002, J Pers Soc Psychol" },
          { kind: "lesson", body: "Это исследование 2002 года перевернуло понимание того, как работает поведение. Большую часть дня мы не «решаем» — мы реагируем на триггеры. Кухня в 22:00 → открыть холодильник. Стресс → бутерброд. Просмотр сериала → перекус. Это не слабость, это автоматизм." },
          { kind: "lesson", body: "Хорошая новость: автоматизм работает в обе стороны. Если ты построишь привычку «после ужина — прогулка 20 минут», то она тоже будет включаться без усилий. Цель ближайших 14 недель — не «заставлять себя», а перенастроить автопилот. Силой выбора это сделать невозможно. Через систему — реально." },
          { kind: "lesson", body: "На этой неделе разберём, как привычки формируются на самом деле (не за 21 день, как принято считать). Завтра — цикл «триггер → действие → награда». Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "callout", headline: "{TODO}", subtext: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        citations: ["Wood, Quinn & Kashy, 2002, J Pers Soc Psychol"],
      },
      {
        day: 9, type: "lesson", category: "habits",
        title_ru: "Цикл «триггер → действие → награда»",
        title_en: "The cue → routine → reward loop",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "Каждая привычка — это автоматическая реакция на триггер. Чтобы её изменить, нужно понять триггер." },
          { kind: "lesson", body: "Чарльз Дахигг в книге «Сила привычки» популяризировал классический трёхтактный цикл: триггер (cue) → действие (routine) → награда (reward). Триггер — это то, что запускает реакцию: время, место, эмоция, человек. Действие — то, что ты делаешь. Награда — то, что мозг получает в результате.", source: "Duhigg, The Power of Habit" },
          { kind: "lesson", body: "Пример: триггер — приходишь домой уставший в 19:00. Действие — открываешь холодильник, ешь что-то сладкое. Награда — короткий всплеск дофамина, ощущение, что день уже не такой плохой. Мозг запоминает, что эта последовательность работает, и в следующий раз запускает её автоматически." },
          { kind: "lesson", body: "Изменить триггер обычно невозможно — ты не уберёшь усталость в 19:00. Изменить награду тоже сложно — мозг хочет своё. Но можно изменить действие. Та же усталость + та же потребность в передышке + другое действие = новая привычка. Душ, прогулка, разговор, чай — то, что даёт тот же эффект «выдохнуть»." },
          { kind: "lesson", body: "Сегодня просто наблюдай. Когда тянет к незапланированной еде — отмечай: что было триггером? Что ты получаешь? Без оценки. Это разведка. Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        citations: ["Duhigg, The Power of Habit"],
      },
      {
        day: 10, type: "lesson", category: "habits",
        title_ru: "Правда о 66 днях: 18–254 дня на привычку (Lally 2010)",
        title_en: "The 66-day truth: habits form in 18–254 days (Lally 2010)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "Привычка формируется не за 21 день. И даже не за 30. Реальный диапазон — гораздо шире." },
          { kind: "callout", headline: "66 дней", subtext: "медиана формирования привычки. Диапазон: от 18 до 254 дней.", source: "Lally et al., 2010, Eur J Soc Psychol" },
          { kind: "lesson", body: "Откуда взялись «21 день»? Из книги пластического хирурга Максвелла Мальца 1960 года, где он наблюдал, что пациентам нужно около 3 недель, чтобы привыкнуть к новому лицу. Это была личная заметка, не исследование. Цифра попала в поп-психологию и осталась там навсегда." },
          { kind: "lesson", body: "Реальное исследование (Лалли и др., 2010) измеряло 82 человек, формирующих новые привычки. Средняя цифра — 66 дней. Но самое важное — разброс: от 18 до 254 дней. То есть некоторым нужно 3 недели, а другим — 8 месяцев. И то, и другое нормально." },
          { kind: "lesson", body: "Практический вывод: не суди по первым двум неделям, работает или нет твоя новая привычка. Двухмесячный горизонт — это минимум, который имеет смысл оценивать. И если на 30-й день привычка ещё не автоматизировалась — это не провал, это нормальное распределение. Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "callout", headline: "{TODO}", subtext: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        citations: ["Lally et al., 2010, Eur J Soc Psychol"],
      },
      {
        day: 11, type: "lesson", category: "habits",
        title_ru: "«Если — то» планы: метод, удваивающий шансы на успех",
        title_en: "Implementation intentions: the if–then plan that doubles success",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "«Я буду больше двигаться» работает почти никогда. «Если выйду с работы в 18:00, то пройду 2 остановки пешком» — работает." },
          { kind: "lesson", body: "Питер Голвитцер в 1990-х годах провёл серию исследований про то, что отличает намерения, которые превращаются в действия, от тех, которые остаются на бумаге. Формула оказалась простой: «если X, то Y». Условие плюс действие.", source: "Gollwitzer, 1999" },
          { kind: "lesson", body: "Мета-анализ 2006 года (Голвитцер и Шиаран) показал: люди, формулирующие свои планы как «если-то», достигают целей с эффектом d=0.65. Это «средний-большой» эффект в психологии — больше, чем у многих лекарств. И стоит это ровно ничего: одна фраза вместо другой." },
          { kind: "lesson", body: "Почему это работает: мозг встраивает условие в фоновое восприятие. Когда наступает X, не нужно «решать» — действие уже привязано. Это снимает нагрузку с самоконтроля и переводит поведение ближе к автоматическому режиму." },
          { kind: "lesson", body: "Завтра сформулируем твою первую «если-то» — простую, конкретную, привязанную к существующему якорю в твоём дне. Сегодня — наблюдай: какие моменты дня могут стать якорями? Утренний кофе? Окончание совещания? Возвращение домой? Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
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
        slides_ru: [
          { kind: "cover", hook: "Привязать новую привычку к существующей в 5 раз эффективнее, чем создавать с нуля." },
          { kind: "lesson", body: "BJ Fogg (Стэнфорд) изучает крошечные привычки уже два десятилетия. Его главный вывод: люди, которые встраивают новую привычку рядом со старой, удерживают её в 3–5 раз чаще, чем те, кто пытается выделить для неё отдельное время. Старая привычка работает как якорь." },
          { kind: "lesson", body: "Формула habit stacking: «После того, как я [уже делаю X], я буду [новое Y]». Ключевые свойства якоря: ты делаешь его каждый день, он уже автоматический, он происходит в момент, когда ты в состоянии добавить что-то ещё (не падаешь от усталости)." },
          { kind: "lesson", body: "Хорошие якоря: чистить зубы, ставить чайник, садиться в машину, открывать ноутбук утром, садиться ужинать. Плохие якоря: те, которые ты сам выполняешь нерегулярно, или те, после которых ты не в состоянии ничего больше делать. Если есть вопросы — задай их ИИ-тренеру в чате." },
          { kind: "action", prompt: "Выбери одну новую микро-привычку и привяжи её к уже существующей. Формула: «После того, как я [уже делаю X], я буду [новое Y]». Например: «После того, как поставлю чайник, я выпью стакан воды».", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ],
      },
      {
        day: 13, type: "lesson", category: "habits",
        title_ru: "Почему сила воли не работает (и что работает)",
        title_en: "Why willpower fails (and what works)",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "Те, у кого «сильная воля», не используют её на повседневные решения. Они проектируют среду так, чтобы воля не понадобилась." },
          { kind: "callout", headline: "Среда побеждает волю", subtext: "Люди с лучшим самоконтролем не «терпят больше». Они избегают ситуаций, требующих самоконтроля." },
          { kind: "lesson", body: "Исследование Wood, Neal, Galla & Duckworth изменило понимание самоконтроля. Раньше считалось, что есть «волевые» люди, у которых больше способности к ограничению себя. Оказалось, что эти же люди описывают свою жизнь как такую, где самоконтроль почти не нужен — потому что они структурировали её так." },
          { kind: "lesson", body: "Простой пример: ты можешь либо каждый вечер «бороться с собой» возле холодильника, либо просто не покупать то, с чем ты «борешься». Воля — ограниченный ресурс. Среда — постоянный фон. Сравнение по эффективности на длинной дистанции очевидно." },
          { kind: "lesson", body: "На 7-й неделе будет вся неделя про дизайн среды — что и как менять дома, в офисе, в социальном круге. Сейчас просто запомни принцип: если что-то требует от тебя силы выбора каждый день, это слабая система. Если решение «вшито» в обстановку — это сильная система. Если есть вопросы — задай их ИИ-тренеру в чате." },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "callout", headline: "{TODO}", subtext: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
      },
      {
        day: 14, type: "reflection", category: "habits",
        title_ru: "Рефлексия 2-й недели: твоя ключевая привычка",
        title_en: "Week 2 reflection: your keystone habit",
        body_ru: "{TODO}",
        body_en: "{TODO}",
        action_prompt_ru: "Выбери ОДНУ привычку на оставшиеся 14 недель. Не пять. Одну. Запиши её в профиле.",
        action_prompt_en: "Pick ONE habit for the remaining 14 weeks. Not five. One. Save it to your profile.",
        slides_ru: [
          { kind: "cover", hook: "Не пять привычек на 14 недель. Одна. Та, которая тянет за собой остальные." },
          { kind: "lesson", body: "Концепция «ключевой привычки» (keystone habit) пришла из исследований Чарльза Дахигга. Ключевая привычка — это та, которая, будучи установленной, естественно подтягивает за собой другие. Не нужно «заставлять» себя ещё больше — система начинает работать сама." },
          { kind: "lesson", body: "Классические примеры: регулярный сон в одно и то же время — за ним подтягивается лучший контроль аппетита, более стабильная энергия в течение дня, меньше тяги к сахару. Утренняя прогулка — за ней подтягиваются завтраки с белком и более активный день. Запись еды в дневнике — за ней подтягивается выбор более насыщенных блюд." },
          { kind: "lesson", body: "Как выбрать свою: посмотри, какая одна привычка, если бы она стала автоматической, открыла бы дверь к остальным. Это не обязательно самая «правильная» — это самая ваша. Та, которую ты с большой вероятностью удержишь и которая для тебя лично потянет за собой остальное." },
          { kind: "lesson", body: "Одна. Не пять. Пять привычек одновременно — это путь к выгоранию за 4 недели. Одна привычка на 14 недель — это путь к новой идентичности. Завтра начинаем третью неделю, и одна из тем — то, без чего ничего из остального не работает: сон. Если есть вопросы — задай их ИИ-тренеру в чате." },
          { kind: "reflection", prompt: "Выбери ОДНУ привычку на оставшиеся 14 недель. Не пять. Одну. Запиши её в профиле.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ],
      },
    ],
  },
  {
    week: 3, phase: "foundation",
    theme_ru: "Энергобаланс (CICO без культа)",
    theme_en: "Energy Balance (CICO without the cult)",
    overview_ru: "Понимаем единственный закон, который реально работает — без становления его рабом.",
    overview_en: "Understand the only law that matters, without becoming a slave to it.",
    days: [
      { day: 15, type: "lesson", category: "energy_balance",
        title_ru: "Калории на входе / калории на выходе — что это и что нет",
        title_en: "Calories in / calories out — what it is and what it isn't",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 16, type: "lesson", category: "energy_balance",
        title_ru: "Компоненты TDEE: BMR, TEF, NEAT, EAT (и почему NEAT — джокер)",
        title_en: "TDEE components: BMR, TEF, NEAT, EAT (and why NEAT is the wild card)",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 17, type: "lesson", category: "energy_balance",
        title_ru: "Адаптивный термогенез: почему метаболизм «замедляется» при снижении жира",
        title_en: "Adaptive thermogenesis: why metabolism 'slows' during fat loss",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 18, type: "lesson", category: "energy_balance",
        title_ru: "Оценка твоей нормы калорий (формула Mifflin-St Jeor)",
        title_en: "Estimating your calorie target (Mifflin-St Jeor explained)",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Mifflin et al., 1990"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 19, type: "lesson", category: "energy_balance",
        title_ru: "Методы трекинга еды: приложения, фото, ладони, в уме",
        title_en: "Food tracking methods compared: apps, photos, hand portions, mental",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 20, type: "action", category: "energy_balance",
        title_ru: "Начни трекинг сегодня — День 1 из 7-дневного журнала",
        title_en: "Start tracking today — Day 1 of a 7-day log",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Запиши всё, что съел сегодня. Не меняй ничего — только наблюдай. Это базовая линия.",
        action_prompt_en: "Log everything you ate today. Don't change anything — just observe. This is your baseline.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Запиши всё, что съел сегодня. Не меняй ничего — только наблюдай. Это базовая линия.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 21, type: "reflection", category: "energy_balance",
        title_ru: "Типичные ошибки трекинга + обзор недели",
        title_en: "Common tracking mistakes + week review",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Просмотри 7 дней журнала. Что ты пропускал? Где недооценивал порции? Это данные, не оценка.",
        action_prompt_en: "Review your 7-day log. What did you skip? Where did you underestimate portions? That's data, not judgment.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Просмотри 7 дней журнала. Что ты пропускал? Где недооценивал порции? Это данные, не оценка.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 4, phase: "foundation",
    theme_ru: "Белок: твой самый важный макрос",
    theme_en: "Protein: your most important macro",
    overview_ru: "Единственное изменение в питании с самой высокой отдачей.",
    overview_en: "The single nutritional change with the highest ROI.",
    days: [
      { day: 22, type: "lesson", category: "protein",
        title_ru: "Почему белок — король в дефиците: TEF, сытость, сохранение мышц",
        title_en: "Why protein is king in a deficit: TEF, satiety, lean mass preservation",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 23, type: "lesson", category: "protein",
        title_ru: "Белок и сытость — почему высокобелковые приёмы пищи насыщают дольше",
        title_en: "Protein and satiety — why higher protein meals keep you fuller longer",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 24, type: "lesson", category: "protein",
        title_ru: "Сколько? Диапазон 1.6–2.2 г/кг (Helms et al.)",
        title_en: "How much? The 1.6–2.2 g/kg range (Helms et al. evidence-based guidelines)",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Helms et al., 2014"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 25, type: "lesson", category: "protein",
        title_ru: "Животные источники белка — рейтинг по качеству и удобству",
        title_en: "Animal protein sources — quality and practicality ranked",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 26, type: "lesson", category: "protein",
        title_ru: "Растительные источники белка — что работает, что нет",
        title_en: "Plant protein sources — what works, what doesn't",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 27, type: "action", category: "protein",
        title_ru: "Собери тарелку с белком-якорем: запиши 3 приёма пищи сегодня",
        title_en: "Build the protein-anchored plate: log 3 meals today",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Для каждого из 3 приёмов пищи сегодня сначала выбери источник белка, потом всё остальное. Запиши граммы белка в журнал.",
        action_prompt_en: "For each of today's 3 meals, pick the protein source first, then everything else. Log the protein grams in your journal.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Для каждого из 3 приёмов пищи сегодня сначала выбери источник белка, потом всё остальное. Запиши граммы белка в журнал.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 28, type: "reflection", category: "protein",
        title_ru: "Рефлексия 4-й недели: средний дневной белок за неделю",
        title_en: "Week 4 reflection: your average daily protein this week",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Посмотри среднее за 7 дней. Дотягиваешь до 1.6 г/кг? Если нет — где провисает?",
        action_prompt_en: "Look at your 7-day average. Hitting 1.6 g/kg? If not — where is it falling short?",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Посмотри среднее за 7 дней. Дотягиваешь до 1.6 г/кг? Если нет — где провисает?", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  // ─── PHASE 2 — BEHAVIORAL ARCHITECTURE ─────────────────────────────────
  {
    week: 5, phase: "architecture",
    theme_ru: "Сон: скрытый рычаг снижения жира",
    theme_en: "Sleep: the hidden fat loss lever",
    overview_ru: "Интервенция, которую большинство игнорирует.",
    overview_en: "The intervention most people ignore.",
    days: [
      { day: 29, type: "lesson", category: "sleep",
        title_ru: "Сон и снижение жира: исследование Nedeltcheva 2010 — на 55% меньше жира при недосыпе",
        title_en: "Sleep and fat loss: the Nedeltcheva 2010 study — 55% less fat loss when sleep-restricted",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Nedeltcheva et al., 2010, Ann Intern Med"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 30, type: "lesson", category: "sleep",
        title_ru: "Сон, грелин и лептин — почему короткий сон = больше голода",
        title_en: "Sleep, ghrelin, and leptin — why short sleep = more hunger",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 31, type: "lesson", category: "sleep",
        title_ru: "Сколько сна нужно именно тебе? Индивидуальные различия и признаки недосыпа",
        title_en: "How much sleep do you need? Individual variation and signs of debt",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 32, type: "lesson", category: "sleep",
        title_ru: "Основы гигиены сна: свет, температура, режим",
        title_en: "Sleep hygiene fundamentals: light, temperature, schedule",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 33, type: "lesson", category: "sleep",
        title_ru: "Кофеин, алкоголь и экраны — что говорят исследования",
        title_en: "Caffeine, alcohol, and screens — what the evidence says",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 34, type: "action", category: "sleep",
        title_ru: "Настрой среду сна сегодня: 5 конкретных изменений",
        title_en: "Set up your sleep environment tonight: 5 concrete changes",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Сегодня вечером: 1) убери экраны из спальни за час до сна, 2) сделай темно, 3) сделай прохладно (~18°C), 4) поставь будильник на постоянное время подъёма, 5) убери кофеин после 14:00.",
        action_prompt_en: "Tonight: 1) banish screens from the bedroom an hour before sleep, 2) make it dark, 3) cool it down (~18°C), 4) set a fixed wake time, 5) cut caffeine after 2pm.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Сегодня вечером: 1) убери экраны из спальни за час до сна, 2) сделай темно, 3) сделай прохладно (~18°C), 4) поставь будильник на постоянное время подъёма, 5) убери кофеин после 14:00.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 35, type: "reflection", category: "sleep",
        title_ru: "Рефлексия 5-й недели: разбор 7-дневного журнала сна",
        title_en: "Week 5 reflection: review your 7-day sleep log",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Сколько часов в среднем ты спал? Что было лучшим, что худшим? Один паттерн, который хочешь сохранить навсегда.",
        action_prompt_en: "How many hours on average did you sleep? Best night, worst night? One pattern you want to keep forever.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Сколько часов в среднем ты спал? Что было лучшим, что худшим? Один паттерн, который хочешь сохранить навсегда.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 6, phase: "architecture",
    theme_ru: "NEAT: невидимый драйвер снижения жира",
    theme_en: "NEAT: the invisible fat loss driver",
    overview_ru: "80% «калорий активности» приходится на то, что не является тренировкой.",
    overview_en: "80% of your 'activity calories' come from things that aren't exercise.",
    days: [
      { day: 36, type: "lesson", category: "neat",
        title_ru: "Исследование NEAT Левина: до 2000 ккал/день разницы между людьми",
        title_en: "Levine's NEAT research: up to 2,000 kcal/day difference between people",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Levine et al., 2005, Science"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 37, type: "lesson", category: "neat",
        title_ru: "Почему при дефиците ты двигаешься меньше (и как с этим работать)",
        title_en: "Why dieting makes you move less (and how to counter it)",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 38, type: "lesson", category: "neat",
        title_ru: "Шаги и смертность — что показывают данные (Saint-Maurice 2020)",
        title_en: "Steps and mortality — what the data actually shows (Saint-Maurice 2020)",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Saint-Maurice et al., 2020, JAMA"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 39, type: "lesson", category: "neat",
        title_ru: "Практические лайфхаки NEAT: ходьба на встречах, стояние, лестницы, фиджетинг",
        title_en: "Practical NEAT hacks: walking meetings, standing, stairs, fidgeting",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 40, type: "action", category: "neat",
        title_ru: "Найди свою базовую линию: посчитай шаги за 24 часа",
        title_en: "Find your baseline: track all steps for 24 hours",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Сегодня просто наблюдай. Никаких целей. Запиши итог в журнал вечером.",
        action_prompt_en: "Today just observe. No targets. Log the total in your journal tonight.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Сегодня просто наблюдай. Никаких целей. Запиши итог в журнал вечером.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 41, type: "action", category: "neat",
        title_ru: "Поставь цель по шагам — базовая линия +20% или якорь 7000–10000",
        title_en: "Set your step target — baseline +20%, or 7,000–10,000 anchor",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Возьми вчерашнее число и добавь 20%. Или начни с 7000 как минимум. Запиши цель в профиль.",
        action_prompt_en: "Take yesterday's number and add 20%. Or start with 7,000 as a floor. Save the target to your profile.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Возьми вчерашнее число и добавь 20%. Или начни с 7000 как минимум. Запиши цель в профиль.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 42, type: "reflection", category: "neat",
        title_ru: "Рефлексия 6-й недели: куда NEAT впишется в твою жизнь навсегда?",
        title_en: "Week 6 reflection: where can NEAT fit your life permanently?",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Назови 3 момента дня, где ты теперь добавляешь движение по умолчанию. Без напоминаний.",
        action_prompt_en: "Name 3 moments in your day where you now add movement by default. Without reminders.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Назови 3 момента дня, где ты теперь добавляешь движение по умолчанию. Без напоминаний.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 7, phase: "architecture",
    theme_ru: "Дизайн среды: меняй кухню, а не характер",
    theme_en: "Environment design: win without willpower",
    overview_ru: "Меняй среду, а не себя — побеждай без напряжения.",
    overview_en: "Change your kitchen, not your character.",
    days: [
      { day: 43, type: "lesson", category: "environment",
        title_ru: "Среда побеждает силу воли: Wansink и архитектура выбора",
        title_en: "Environment beats willpower: Wansink and choice architecture",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 44, type: "action", category: "environment",
        title_ru: "Аудит кладовой + холодильника: что остаётся, что уходит",
        title_en: "Pantry + fridge audit: what stays, what goes",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Открой холодильник и кладовую. Что ты съешь, если будешь уставший в 22:00? Это уходит или прячется глубже.",
        action_prompt_en: "Open the fridge and pantry. What do you grab when tired at 10pm? That goes — or hides deep on a shelf.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Открой холодильник и кладовую. Что ты съешь, если будешь уставший в 22:00? Это уходит или прячется глубже.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 45, type: "lesson", category: "environment",
        title_ru: "Делаем здоровую еду опцией по умолчанию дома",
        title_en: "Making healthy food the default at home",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 46, type: "lesson", category: "environment",
        title_ru: "Вне дома, на работе, в поездках: трюк «меню по умолчанию»",
        title_en: "Out, at work, traveling: the 'default menu' trick",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 47, type: "lesson", category: "environment",
        title_ru: "Социальная среда: Christakis 2007 — ожирение распространяется по сетям",
        title_en: "Social environment: Christakis 2007 — obesity spreads through networks",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Christakis & Fowler, 2007, NEJM"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 48, type: "action", category: "environment",
        title_ru: "Составь карту топ-5 триггеров и контркью",
        title_en: "Map your top 5 triggers and design counter-cues",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Назови 5 триггеров, которые приводят к незапланированной еде. Для каждого придумай контркью — что-то, что обрывает паттерн.",
        action_prompt_en: "Name 5 triggers that lead to unplanned eating. For each, design a counter-cue — something that breaks the pattern.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Назови 5 триггеров, которые приводят к незапланированной еде. Для каждого придумай контркью — что-то, что обрывает паттерн.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 49, type: "reflection", category: "environment",
        title_ru: "Рефлексия 7-й недели: какое изменение среды дало больше всего?",
        title_en: "Week 7 reflection: what environment change made the biggest difference?",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Одно изменение среды, которое реально сработало. Запиши — это часть твоей системы навсегда.",
        action_prompt_en: "One environment change that actually worked. Write it down — it's part of your system forever.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Одно изменение среды, которое реально сработало. Запиши — это часть твоей системы навсегда.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 8, phase: "architecture",
    theme_ru: "Цели и самонаблюдение",
    theme_en: "Goals & self-monitoring",
    overview_ru: "Что измеряется — то меняется. Но измеряй правильные вещи.",
    overview_en: "What gets measured changes — but measure the right things.",
    days: [
      { day: 50, type: "lesson", category: "goals",
        title_ru: "Цели результата vs цели процесса — почему процесс побеждает в долгую",
        title_en: "Outcome goals vs process goals — why process wins long-term",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 51, type: "lesson", category: "goals",
        title_ru: "SMART-цели применительно к снижению жира",
        title_en: "SMART goals applied to fat loss (the right way to be specific)",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 52, type: "action", category: "goals",
        title_ru: "Поставь цель результата на 16 недель",
        title_en: "Set your 16-week outcome goal",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Одна цель. Конкретная. Измеримая. На горизонте 16 недель. Запиши в профиль.",
        action_prompt_en: "One goal. Specific. Measurable. On a 16-week horizon. Save it to your profile.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Одна цель. Конкретная. Измеримая. На горизонте 16 недель. Запиши в профиль.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 53, type: "action", category: "goals",
        title_ru: "Поставь 3 еженедельные цели процесса",
        title_en: "Set your 3 weekly process goals",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Три действия в неделю, под твоим контролем. Не «-2 кг» — а «3 силовых, 5 дней с белком, 7 дней по 8000 шагов».",
        action_prompt_en: "Three actions per week, fully in your control. Not '-2 kg' — but '3 resistance sessions, 5 days with protein target, 7 days at 8,000 steps.'",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Три действия в неделю, под твоим контролем. Не «-2 кг» — а «3 силовых, 5 дней с белком, 7 дней по 8000 шагов».", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 54, type: "lesson", category: "goals",
        title_ru: "Как взвешиваться: частота, условия, почему тренд важнее ежедневной цифры",
        title_en: "How to weigh yourself: frequency, conditions, why trend lines matter more than daily numbers",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 55, type: "lesson", category: "goals",
        title_ru: "Помимо весов: фото, замеры, как сидит одежда, производительность",
        title_en: "Beyond the scale: photos, measurements, how clothes fit, performance",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 56, type: "reflection", category: "goals",
        title_ru: "Рефлексия 8-й недели: чекпоинт середины пути",
        title_en: "Week 8 reflection: midpoint checkpoint, what's working",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Полпути позади. Что работает? Что не работает? Что меняешь на оставшиеся 8 недель?",
        action_prompt_en: "Halfway done. What's working? What isn't? What do you change for the remaining 8 weeks?",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Полпути позади. Что работает? Что не работает? Что меняешь на оставшиеся 8 недель?", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  // ─── PHASE 3 — NUTRITION MASTERY ───────────────────────────────────────
  {
    week: 9, phase: "mastery",
    theme_ru: "Голод и тяга к еде",
    theme_en: "Hunger & cravings",
    overview_ru: "Внутренняя игра — работаем с биологией, а не против неё.",
    overview_en: "The inner game — work with biology, not against it.",
    days: [
      { day: 57, type: "lesson", category: "hunger",
        title_ru: "Голод vs аппетит: гомеостатический (нужно) vs гедонический (хочется)",
        title_en: "Hunger vs appetite: homeostatic (need) vs hedonic (want)",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 58, type: "lesson", category: "hunger",
        title_ru: "Грелин, лептин и что с ними делает дефицит",
        title_en: "Ghrelin, leptin, and what dieting actually does to them",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 59, type: "lesson", category: "hunger",
        title_ru: "Откуда берётся тяга: триггер-индуцированное «хотение», не слабость",
        title_en: "Where cravings come from: cue-induced wanting, not weakness",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 60, type: "lesson", category: "hunger",
        title_ru: "Правило 20 минут: «сёрфинг по волне» и угасание тяги",
        title_en: "The 20-minute rule: urge surfing and craving extinction",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 61, type: "lesson", category: "hunger",
        title_ru: "Проверка HALT: Голоден, Зол, Одинок, Устал — диагностика",
        title_en: "HALT check: Hungry, Angry, Lonely, Tired — the diagnostic",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 62, type: "action", category: "hunger",
        title_ru: "Практикуй сёрфинг по волне на одной тяге сегодня",
        title_en: "Practice urge surfing today on one craving",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Когда сегодня накроет тяга — поставь таймер на 20 минут. Наблюдай. Не борись. Запиши, что произошло после.",
        action_prompt_en: "When a craving hits today — set a 20-minute timer. Observe. Don't fight. Log what happened after.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Когда сегодня накроет тяга — поставь таймер на 20 минут. Наблюдай. Не борись. Запиши, что произошло после.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 63, type: "reflection", category: "hunger",
        title_ru: "Рефлексия 9-й недели: топ-3 триггера тяги",
        title_en: "Week 9 reflection: identify your top 3 craving triggers",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Три ситуации, которые чаще всего запускают тягу. Для каждой — план на следующий раз.",
        action_prompt_en: "Three situations that trigger cravings most often. For each — a plan for next time.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Три ситуации, которые чаще всего запускают тягу. Для каждой — план на следующий раз.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 10, phase: "mastery",
    theme_ru: "Клетчатка и сытость",
    theme_en: "Fiber & satiety",
    overview_ru: "Самый недооценённый инструмент, чтобы оставаться сытым на меньшем количестве калорий.",
    overview_en: "The most underrated tool for staying full on fewer calories.",
    days: [
      { day: 64, type: "lesson", category: "fiber",
        title_ru: "Клетчатка 101: растворимая, нерастворимая, ферментируемая",
        title_en: "Fiber 101: soluble, insoluble, fermentable — what each does",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 65, type: "lesson", category: "fiber",
        title_ru: "Клетчатка и каскад сытости — почему высококлетчаточные блюда насыщают сильнее",
        title_en: "Fiber and the satiety cascade — why high-fiber meals satisfy more",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 66, type: "lesson", category: "fiber",
        title_ru: "Клетчатка и микробиом кишечника",
        title_en: "Fiber and the gut microbiome",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 67, type: "lesson", category: "fiber",
        title_ru: "Сколько? 25г (женщины) — 38г (мужчины) в день. Типичный приём — половина",
        title_en: "How much? 25g (women) to 38g (men) per day — typical intake is half",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 68, type: "lesson", category: "fiber",
        title_ru: "Топ-20 продуктов с высоким содержанием клетчатки",
        title_en: "Top 20 high-fiber foods, ranked by practicality",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 69, type: "action", category: "fiber",
        title_ru: "Добавь 10г клетчатки в сегодняшнее питание",
        title_en: "Add 10g of fiber to today's eating",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Один высококлетчаточный продукт сегодня сверху обычного рациона. Овсянка, бобы, ягоды, овощи — выбирай.",
        action_prompt_en: "One high-fiber food today on top of your normal eating. Oats, beans, berries, vegetables — pick one.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Один высококлетчаточный продукт сегодня сверху обычного рациона. Овсянка, бобы, ягоды, овощи — выбирай.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 70, type: "reflection", category: "fiber",
        title_ru: "Рефлексия 10-й недели: закрепи одну высококлетчаточную рутину",
        title_en: "Week 10 reflection: lock in 1 high-fiber routine (e.g., daily breakfast)",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Одна рутина, которая стабильно добавляет 10г клетчатки. Завтрак, перекус, ужин — одна точка.",
        action_prompt_en: "One routine that reliably adds 10g of fiber. Breakfast, snack, dinner — one anchor.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Одна рутина, которая стабильно добавляет 10г клетчатки. Завтрак, перекус, ужин — одна точка.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 11, phase: "mastery",
    theme_ru: "Жиры: нужны, не враги",
    theme_en: "Fats: necessary, not the enemy",
    overview_ru: "Разворачиваем 40 лет плохого маркетинга.",
    overview_en: "Reverse 40 years of bad messaging.",
    days: [
      { day: 71, type: "lesson", category: "fats",
        title_ru: "Жиры не делают тебя жирным: метаболические основы",
        title_en: "Fats don't make you fat: the metabolic basics",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 72, type: "lesson", category: "fats",
        title_ru: "Насыщенные, мононенасыщенные, полиненасыщенные — что реально важно",
        title_en: "Saturated, monounsaturated, polyunsaturated — what actually matters",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 73, type: "lesson", category: "fats",
        title_ru: "Омега-3: воспаление, настроение и поддержка снижения жира",
        title_en: "Omega-3s: inflammation, mood, and fat loss support",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 74, type: "lesson", category: "fats",
        title_ru: "Трансжиры — единственный реальный злодей в категории жиров",
        title_en: "Trans fats — the only real villain in the fat category",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 75, type: "lesson", category: "fats",
        title_ru: "Минимальный порог жиров для гормонов (особенно важно для женщин)",
        title_en: "Minimum fat threshold for hormones (especially relevant for women)",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 76, type: "action", category: "fats",
        title_ru: "Аудит источников жира — откуда приходит 80% твоего жира",
        title_en: "Audit your fat sources — what 80% of your fat is coming from",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Посмотри журнал за неделю. Назови 3 продукта, дающие большую часть жира. Это твоя реальная картина.",
        action_prompt_en: "Look at your week's log. Name the 3 foods giving you most of your fat. That's your actual picture.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Посмотри журнал за неделю. Назови 3 продукта, дающие большую часть жира. Это твоя реальная картина.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 77, type: "reflection", category: "fats",
        title_ru: "Рефлексия 11-й недели: замени один источник жира на этой неделе",
        title_en: "Week 11 reflection: swap 1 fat source this week",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Одна замена — например, маргарин на оливковое масло, или сосиски на рыбу. Запиши, что меняешь.",
        action_prompt_en: "One swap — e.g., margarine to olive oil, or sausages to fish. Log what you're changing.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Одна замена — например, маргарин на оливковое масло, или сосиски на рыбу. Запиши, что меняешь.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 12, phase: "mastery",
    theme_ru: "Углеводы: самый недопонятый макрос",
    theme_en: "Carbs: the most misunderstood macro",
    overview_ru: "Инсулин не делает тебя жирным — калории делают.",
    overview_en: "Insulin doesn't make you fat — calories do.",
    days: [
      { day: 78, type: "lesson", category: "carbs",
        title_ru: "Инсулин не вызывает набор жира (Hall 2017, обзор углеводно-инсулиновой модели)",
        title_en: "Insulin doesn't drive fat gain (Hall 2017 carbohydrate-insulin model review)",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Hall, 2017, Eur J Clin Nutr"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 79, type: "lesson", category: "carbs",
        title_ru: "Простые vs сложные углеводы — что реально важно",
        title_en: "Simple vs complex carbs — what actually matters",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 80, type: "lesson", category: "carbs",
        title_ru: "Гликемический индекс: полезный инструмент или переоценён?",
        title_en: "Glycemic index: useful tool or overrated?",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 81, type: "lesson", category: "carbs",
        title_ru: "Углеводы вокруг тренировки — единственный случай, когда тайминг важен",
        title_en: "Carbs around training — the one time timing matters",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 82, type: "lesson", category: "carbs",
        title_ru: "Низкоуглеводка vs высокоуглеводка: Gardner 2018 DIETFITS — результаты эквивалентны",
        title_en: "Low-carb vs higher-carb: Gardner 2018 DIETFITS — equivalent results",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Gardner et al., 2018, JAMA"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 83, type: "action", category: "carbs",
        title_ru: "Найди свою «сладкую точку» по углеводам: эксперимент с 3 разными составами блюд",
        title_en: "Find your carb sweet spot: experiment with 3 meal compositions",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Сегодня сделай 3 блюда с разной долей углеводов. Запиши, как себя чувствуешь после каждого — энергия, голод, фокус.",
        action_prompt_en: "Today make 3 meals with different carb ratios. Log how you feel after each — energy, hunger, focus.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Сегодня сделай 3 блюда с разной долей углеводов. Запиши, как себя чувствуешь после каждого — энергия, голод, фокус.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 84, type: "reflection", category: "carbs",
        title_ru: "Рефлексия 12-й недели: какой паттерн углеводов даёт тебе лучшее самочувствие?",
        title_en: "Week 12 reflection: which carb pattern made you feel best?",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Один паттерн (например, низкоуглеводный завтрак + углеводы вечером). Зафиксируй для своей системы.",
        action_prompt_en: "One pattern (e.g., low-carb breakfast + carbs at dinner). Lock it into your system.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Один паттерн (например, низкоуглеводный завтрак + углеводы вечером). Зафиксируй для своей системы.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  // ─── PHASE 4 — LONG-TERM SUCCESS ───────────────────────────────────────
  {
    week: 13, phase: "forever",
    theme_ru: "Качество еды: УПФ, жидкие калории, алкоголь",
    theme_en: "Food quality: UPF, liquid calories, alcohol",
    overview_ru: "Лучшее изменение после белка.",
    overview_en: "The single best change after protein.",
    days: [
      { day: 85, type: "lesson", category: "food_quality",
        title_ru: "Исследование Кевина Холла 2019: +508 ккал/день избытка на ультрапереработанной еде",
        title_en: "The Kevin Hall 2019 study: 508 kcal/day excess on ultra-processed diets",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Hall et al., 2019, Cell Metab"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 86, type: "lesson", category: "food_quality",
        title_ru: "Классификация NOVA — что значит «ультрапереработанные»",
        title_en: "NOVA classification — what 'ultra-processed' actually means",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 87, type: "lesson", category: "food_quality",
        title_ru: "Гиперпалатабельные продукты и система вознаграждения мозга",
        title_en: "Hyperpalatable foods and the brain's reward system",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 88, type: "lesson", category: "food_quality",
        title_ru: "Жидкие калории — тихий загрузчик калорий",
        title_en: "Liquid calories — the silent calorie loader",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 89, type: "lesson", category: "food_quality",
        title_ru: "Алкоголь: калории, нарушение сна, принятие решений",
        title_en: "Alcohol: calories, sleep disruption, decision-making",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 90, type: "action", category: "food_quality",
        title_ru: "Челлендж недели: замени 1 УПФ-приём пищи в день на цельную еду",
        title_en: "One-week UPF reduction challenge: replace 1 UPF meal/day with whole food",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Семь дней, один приём пищи в день — замена УПФ на цельную еду. Не «здоровее» — просто менее переработано.",
        action_prompt_en: "Seven days, one meal a day — swap UPF for whole food. Not 'healthier' — just less processed.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Семь дней, один приём пищи в день — замена УПФ на цельную еду. Не «здоровее» — просто менее переработано.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 91, type: "reflection", category: "food_quality",
        title_ru: "Рефлексия 13-й недели: твой главный УПФ-соблазн и план на него",
        title_en: "Week 13 reflection: your top UPF temptation, and your plan",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Один УПФ-продукт, с которым тяжелее всего. Назови. Придумай контркью — что заменит его в момент тяги.",
        action_prompt_en: "One UPF food that's hardest to skip. Name it. Design a counter-cue — what replaces it at the moment of craving.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Один УПФ-продукт, с которым тяжелее всего. Назови. Придумай контркью — что заменит его в момент тяги.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 14, phase: "forever",
    theme_ru: "Силовые тренировки (образовательно)",
    theme_en: "Resistance training (education)",
    overview_ru: "Самое важное действие для композиции тела.",
    overview_en: "The single most important thing you can do for body composition.",
    days: [
      { day: 92, type: "lesson", category: "resistance_training",
        title_ru: "Почему мышцы важны при снижении жира: форма, метаболизм, функция",
        title_en: "Why muscle matters during fat loss: shape, metabolism, function",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 93, type: "lesson", category: "resistance_training",
        title_ru: "Сохранение мышц в дефиците (Longland 2016: 2.4 г/кг + RT = +1.2 кг LBM, –4.8 кг жира)",
        title_en: "Muscle preservation in a deficit (Longland 2016: 2.4 g/kg protein + RT = +1.2 kg LBM, –4.8 kg fat)",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Longland et al., 2016, Am J Clin Nutr"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 94, type: "lesson", category: "resistance_training",
        title_ru: "Минимальная эффективная доза: 2 сессии/неделя, фул-боди, ~10 подходов на мышцу/неделя",
        title_en: "Minimum effective dose: 2 sessions/week, full body, ~10 sets per muscle/week",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 95, type: "lesson", category: "resistance_training",
        title_ru: "Базовые vs изолирующие: что нужно знать новичку",
        title_en: "Compound vs isolation: what beginners need to know",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 96, type: "lesson", category: "resistance_training",
        title_ru: "Как мышцы меняют композицию тела сильнее, чем когда-либо покажут весы",
        title_en: "How muscle changes body composition more than the scale ever will",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 97, type: "action", category: "resistance_training",
        title_ru: "Спланируй, как добавишь силовые: зал, дом, собственный вес",
        title_en: "Plan how you'll add resistance training: gym, home, bodyweight",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Реши: где, когда, что. Без этих трёх ответов — это не план, а намерение.",
        action_prompt_en: "Decide: where, when, what. Without these three answers — it's not a plan, it's an intention.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Реши: где, когда, что. Без этих трёх ответов — это не план, а намерение.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 98, type: "reflection", category: "resistance_training",
        title_ru: "Рефлексия 14-й недели: запиши первую тренировку — когда, где, что",
        title_en: "Week 14 reflection: book your first session — when, where, what",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Поставь конкретную дату и время в календаре. Без этого — не начнётся.",
        action_prompt_en: "Put a concrete date and time on the calendar. Without that — it won't start.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Поставь конкретную дату и время в календаре. Без этого — не начнётся.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 15, phase: "forever",
    theme_ru: "Кардио, стресс и микронутриенты",
    theme_en: "Cardio, stress & micronutrients",
    overview_ru: "Маленькие рычаги, которые накапливаются.",
    overview_en: "The smaller levers that compound.",
    days: [
      { day: 99, type: "lesson", category: "cardio_stress",
        title_ru: "Кардио для снижения жира — полезно, но не так, как ты думаешь",
        title_en: "Cardio for fat loss — useful, but not what you think",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 100, type: "lesson", category: "cardio_stress",
        title_ru: "HIIT vs LISS: реальный вердикт и когда что использовать",
        title_en: "HIIT vs LISS: the real verdict, and when to use each",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 101, type: "lesson", category: "cardio_stress",
        title_ru: "Рекомендации ACSM: 150 мин/нед умеренного или 75 мин/нед интенсивного",
        title_en: "ACSM recommendations: 150 min/week moderate or 75 min/week vigorous",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 102, type: "lesson", category: "cardio_stress",
        title_ru: "Стресс, кортизол и застрявшее снижение жира",
        title_en: "Stress, cortisol, and stalled fat loss",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 103, type: "lesson", category: "cardio_stress",
        title_ru: "Микронутриенты, часто проседающие в дефиците: D, B12, железо, магний, цинк",
        title_en: "Micronutrients commonly low when dieting: D, B12, iron, magnesium, zinc",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 104, type: "action", category: "cardio_stress",
        title_ru: "Самоаудит: где у тебя пробелы по микронутриентам?",
        title_en: "Self-audit: where are your micronutrient gaps coming from?",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Посмотри журнал. Где минимум овощей, рыбы, цельных зёрен? Это твои пробелы. Один простой свап на этой неделе.",
        action_prompt_en: "Review your log. Where's the minimum of vegetables, fish, whole grains? That's your gap. One simple swap this week.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Посмотри журнал. Где минимум овощей, рыбы, цельных зёрен? Это твои пробелы. Один простой свап на этой неделе.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 105, type: "reflection", category: "cardio_stress",
        title_ru: "Рефлексия 15-й недели: одна практика снижения стресса на всю жизнь",
        title_en: "Week 15 reflection: one stress-reduction practice for the rest of life",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Прогулка, дыхание, журнал, тренировка — что угодно. Одна практика, которая остаётся с тобой.",
        action_prompt_en: "Walk, breathing, journaling, training — anything. One practice that stays with you.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Прогулка, дыхание, журнал, тренировка — что угодно. Одна практика, которая остаётся с тобой.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
  {
    week: 16, phase: "forever",
    theme_ru: "Поддержание и план навсегда",
    theme_en: "Maintenance & the forever plan",
    overview_ru: "Здесь срываются 80% людей. Не будь одним из них.",
    overview_en: "This is where 80% of people fail. Don't be one of them.",
    days: [
      { day: 106, type: "lesson", category: "maintenance",
        title_ru: "Плато объяснено — это нормально, ожидаемо и преодолимо",
        title_en: "Plateaus explained — they're normal, expected, and survivable",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 107, type: "lesson", category: "maintenance",
        title_ru: "Диет-брейки и рефиды (MATADOR, Byrne 2018) — когда и как",
        title_en: "Diet breaks and refeeds (MATADOR study, Byrne 2018) — when and how",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Byrne et al., 2018, Int J Obes"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 108, type: "lesson", category: "maintenance",
        title_ru: "Фаза поддержания — почему она сложнее снижения и что ждать",
        title_en: "The maintenance phase — why it's harder than fat loss, and what to expect",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 109, type: "lesson", category: "maintenance",
        title_ru: "National Weight Control Registry: что реально делают те, кто удерживает результат 10 лет",
        title_en: "National Weight Control Registry: what 10-year maintainers actually do",
        body_ru: "{TODO}", body_en: "{TODO}",
        citations: ["Wing & Phelan, 2005, NWCR"],
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 110, type: "lesson", category: "maintenance",
        title_ru: "Сбой vs срыв — правило «одного кусочка», предотвращающее 90% возврата веса",
        title_en: "Lapse vs relapse — the 'one-bite' rule that prevents 90% of regain",
        body_ru: "{TODO}", body_en: "{TODO}",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
        ] },
      { day: 111, type: "action", category: "maintenance",
        title_ru: "Напиши свой «инструментарий навсегда» — личный манифест на 1 страницу",
        title_en: "Write your forever-toolkit: a 1-page personal manifesto",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Одна страница: что я знаю про себя, что у меня работает, что — нет, что делаю при стрессе/плато. Положи туда, где увидишь через год.",
        action_prompt_en: "One page: what I know about myself, what works, what doesn't, what I do under stress/plateau. Put it where you'll see it a year from now.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "Одна страница: что я знаю про себя, что у меня работает, что — нет, что делаю при стрессе/плато. Положи туда, где увидишь через год.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "action", prompt: "{TODO}", inputType: "text" },
        ] },
      { day: 112, type: "reflection", category: "maintenance",
        title_ru: "Выпуск — следующие 16 недель ТВОЕЙ жизни",
        title_en: "Graduation — the next 16 weeks of YOUR life",
        body_ru: "{TODO}", body_en: "{TODO}",
        action_prompt_ru: "Программа закончилась. Система — нет. Что переносишь дальше? Одно решение на ближайшие 16 недель.",
        action_prompt_en: "The program is over. The system isn't. What carries forward? One decision for the next 16 weeks.",
        slides_ru: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "Программа закончилась. Система — нет. Что переносишь дальше? Одно решение на ближайшие 16 недель.", inputType: "text" },
        ],
        slides_en: [
          { kind: "cover", hook: "{TODO}" },
          { kind: "lesson", body: "{TODO}" },
          { kind: "reflection", prompt: "{TODO}", inputType: "text" },
        ] },
    ],
  },
];

// ─── PROGRAM HELPERS ─────────────────────────────────────────────────────────
// ── Day calculation based on joinedAt — NOT day of week ──────────────────────
export function getUserGlobalDay(profile) {
  // Returns 0 on signup day, 1 the next day, etc.
  if (!profile?.joinedAt) return 0;
  const joined = new Date(profile.joinedAt);
  const today = new Date();
  joined.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  return Math.max(0, Math.floor((today - joined) / 86400000));
}

// Get week data (1-indexed) — defensive. Returns the raw bilingual week object.
export function getWeek(weekNum) {
  const idx = Math.max(0, Math.min(15, (parseInt(weekNum) || 1) - 1));
  return PROGRAM[idx] || PROGRAM[0];
}

// Resolve language-specific fields on a day object. Pulls the right *_ru or
// *_en field into singular `title`, `slides`, `body`, `action_prompt` keys.
function resolveDay(day, lang) {
  if (!day) return day;
  return {
    ...day,
    title: lang === "ru" ? day.title_ru : day.title_en,
    slides: lang === "ru" ? day.slides_ru : day.slides_en,
    body: lang === "ru" ? day.body_ru : day.body_en, // legacy
    action_prompt: lang === "ru" ? day.action_prompt_ru : day.action_prompt_en, // legacy
  };
}

// Resolve language-specific fields on a week object.
function resolveWeek(week, lang) {
  if (!week) return week;
  return {
    ...week,
    theme: lang === "ru" ? week.theme_ru : week.theme_en,
    overview: lang === "ru" ? week.overview_ru : week.overview_en,
  };
}

// Language-aware week getter for components (MissionStrip, ProgramView).
// Returns null when weekNum is out of range so callers can render a fallback.
export function getWeekData(weekNum, lang = "ru") {
  const idx = (parseInt(weekNum) || 1) - 1;
  const week = PROGRAM[idx];
  if (!week) return null;
  return resolveWeek(week, lang);
}

// Get today's day data based on joinedAt. Day 0 returns Day 1 of the
// curriculum as a preview, then days 1..112 read into PROGRAM[weekIdx].days[dayIdx].
// `lang` defaults to "ru" so existing single-arg callers keep working.
export function getTodayData(profile, lang = "ru") {
  const globalDay = getUserGlobalDay(profile);
  if (globalDay === 0) {
    return {
      week: resolveWeek(PROGRAM[0], lang),
      day: resolveDay(PROGRAM[0].days[0], lang),
      isDay0: true,
    };
  }
  const weekIdx = Math.min(15, Math.floor((globalDay - 1) / 7));
  const dayIdx = (globalDay - 1) % 7;
  const rawWeek = PROGRAM[weekIdx] || PROGRAM[0];
  const rawDay = rawWeek.days[dayIdx] || rawWeek.days[0];
  return {
    week: resolveWeek(rawWeek, lang),
    day: resolveDay(rawDay, lang),
    isDay0: false,
  };
}

// Tells the UI when body measurements are due but haven't been logged yet.
// Returns null when there's nothing to nag the user about, or
// `{ weekNum, daysSince }` describing the most recent missed measurement
// window. Measurement days are every 7th day of the program (day 7, 14, 21…).
export function getMissedMeasurement(profile) {
  const globalDay = getUserGlobalDay(profile);
  if (globalDay < 7 || !profile?.joinedAt) return null;

  const lastMeasureDay = Math.floor(globalDay / 7) * 7; // 7, 14, 21…
  const joined = new Date(profile.joinedAt);
  joined.setHours(0,0,0,0);
  const measureDate = new Date(joined);
  measureDate.setDate(measureDate.getDate() + lastMeasureDay);
  const measureDateStr = measureDate.toISOString().split("T")[0];

  // Was a measurement logged on the measurement day or any day after?
  const hasMeasurement = (profile.logs || []).some(l =>
    l.date >= measureDateStr && l.waist != null && l.neck != null
  );
  if (hasMeasurement) return null;

  return {
    weekNum:   lastMeasureDay / 7,
    daysSince: globalDay - lastMeasureDay,
  };
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
export function makeLogs(bw, bc, days) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate()-(days-1-i));
    return { date:d.toISOString().split("T")[0], weight:+(bw-i*0.07+(Math.random()-0.5)*0.35).toFixed(1), calories:Math.round(bc+(Math.random()-0.5)*380), protein:Math.round(130+Math.random()*55), steps:Math.round(5800+Math.random()*7200), fromFatSecret:Math.random()>0.45 };
  });
}
export const MOCK_ATHLETES = [
  { id:"a1",name:"Alex Chen",avatar:"🧑‍💻",age:28,height:178,weight:84.5,waist:89,neck:38,thigh:null,gender:"male",goal:"fat_loss",targetWeight:null,activity:"moderate",stress:3,sleep:3,dietQuality:3,training:"3plus_week",trainingExp:"intermediate",currentWeek:3,streak:5,totalXP:380,fatsecretConnected:true,joinedAt:"2026-01-15",bfp:19.4,bmi:26.7,tdee:2540,dailyTargets:{calories:2100,protein:152,steps:10000},logs:makeLogs(84.5,2050,18),notes:"Struggling with evening snacking.",foodLog:[] },
  { id:"a2",name:"Sarah Kim",avatar:"👩‍🎨",age:32,height:165,weight:58,waist:72,neck:32,thigh:56,gender:"female",goal:"recomp",targetWeight:null,activity:"active",stress:1,sleep:1,dietQuality:1,training:"3plus_week",trainingExp:"advanced",currentWeek:8,streak:12,totalXP:820,fatsecretConnected:false,joinedAt:"2025-12-20",bfp:22.1,bmi:21.3,tdee:2610,dailyTargets:{calories:2450,protein:190,steps:8000},logs:makeLogs(58,2400,28),notes:"Excellent consistency.",foodLog:[] },
  { id:"a3",name:"Marco R.",avatar:"🧔",age:41,height:182,weight:91,waist:97,neck:41,thigh:null,gender:"male",goal:"fat_loss",targetWeight:null,activity:"light",stress:5,sleep:4,dietQuality:3,training:"1_2x_week",trainingExp:"beginner",currentWeek:1,streak:2,totalXP:90,fatsecretConnected:true,joinedAt:"2026-03-28",bfp:26.8,bmi:27.5,tdee:2280,dailyTargets:{calories:2300,protein:164,steps:12000},logs:makeLogs(91,2280,7),notes:"New client.",foodLog:[] },
];

// ─── FatSecret LAYER ──────────────────────────────────────────────────────────
export const FS = {
  // Start OAuth flow — opens FatSecret login in same tab
  connect: (userId) => {
    window.location.href = `/api/fs-request-token?userId=${userId}`;
  },
  // Pull today's diary totals via our server proxy
  fetchDiaryTotals: async (userId) => {
    const res = await fetch("/api/fs-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error("Sync failed");
    return res.json();
  },
};
