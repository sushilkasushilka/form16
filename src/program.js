// 16-week program data, day-of-program helpers, mock athletes, and the
// FatSecret HTTP layer used by the modal that talks to /api/fs-sync.

const PROGRAM = [
  { week:1,theme:"Foundation",color:"#C8F135",
    overview:"Неделя 1 — это формирование привычек. Никаких подвигов — просто регулярное выполнение, изучение своих показателей и установление ежедневных ритуалов: записи, движения и осознанного питания.",
    training:{ title:"Активация всего тела",duration:30,intensity:"Низкая",
      exercises:[
        {name:"Приседания с весом тела",sets:"3",reps:"10",rest:"60s",note:"Отталкивайтесь пятками, грудь прямая, колени над носками."},
        {name:"Отжимания от стены",sets:"3",reps:"10",rest:"60s",note:"Встаньте на расстоянии вытянутой руки от стены, тело прямое."},
        {name:"Ягодичный мостик",sets:"3",reps:"12",rest:"60s",note:"Давите пятками, сжимайте ягодицы в верхней точке."},
        {name:"Мёртвый жук",sets:"3",reps:"8/сторону",rest:"60s",note:"Прижмите поясницу к полу. Медленно и контролируемо."},
        {name:"Вращение бёдрами стоя",sets:"2",reps:"10/направл.",rest:"30s",note:"Полный диапазон, медленные круги — заминка на подвижность."},
      ]},
    nutrition:{ title:"Начни считать — просто наблюдай",tip:"На этой неделе твоя единственная задача — записывать всё, что ты ешь, как можно точнее. Не ограничивай себя, просто фиксируй. Это фундамент осознанного питания.",proteinPerKg:1.6,
      meal:{name:"Яичница со шпинатом и овсянка",desc:"3 целых яйца, обжаренных со шпинатом, и тарелка овсянки с ягодами.",macros:"480 ккал · 32г белок · 48г углеводы · 16г жиры"}},
    mindset:{ title:"Идентичность, а не цели",quote:"Каждое твоё действие — это голос за того человека, которым ты хочешь стать. — Джеймс Клир",practice:"Каждое утро говори себе: «Я человек, который двигается каждый день и питается осознанно». Говори это, даже если пока не веришь."},
    days:[
      {
        day:1,type:"nutrition",icon:"⚖️",
        title:"Утренний замер веса",
        task:"Сегодня утром, после туалета и до еды, встань на весы. Запиши вес в приложении. Это твоя отправная точка.",
        info:{
          why:"Зачем взвешиваться утром?\n\nУтренний вес — самый стабильный показатель. За ночь организм обезвоживается, желудок пуст. Это исключает влияние еды и воды, которые могут добавлять 1–3 кг в течение дня.\n\nВес — это не просто число. Это инструмент обратной связи. Он помогает тебе понять, как твоё тело реагирует на еду, сон и активность.",
          howTo:"Как правильно отслеживать вес:\n\n• Взвешивайся каждое утро в одно и то же время\n• После туалета, до завтрака\n• В нижнем белье или без одежды\n• Записывай каждый раз — даже если кажется, что число «плохое»\n\nВажно: вес колеблется на 1–3 кг в течение дня и между днями. Нормально видеть рост после солёной еды или перед критическими днями. Смотри на тренд за 7–14 дней, не на каждое утреннее число.",
          weekTarget:"Цель недели 1:\nПросто наблюдай. Не пытайся есть меньше или больше. Записывай всё, что ешь, как можно точнее — порции, продукты, время. Это создаёт осознанность, которая сама по себе меняет поведение."
        },
        tip:{cat:"Питание",text:"Люди, которые регулярно взвешиваются, теряют в среднем на 2× больше веса, чем те, кто взвешивается редко — даже без диеты."},
        xp:25
      },
      {
        day:2,type:"nutrition",icon:"🔥",
        title:"Калории и метаболизм",
        task:"Сегодня взвесься утром (напоминание в приложении). Потом прочитай информацию ниже — это основа, которую важно понять.",
        info:{
          why:"Что такое метаболизм?\n\nМетаболизм — это все химические процессы в твоём организме, которые поддерживают жизнь. Проще говоря: это то, как твоё тело использует энергию.\n\nОсновной обмен веществ (BMR) — это количество калорий, которые твоё тело сжигает в состоянии полного покоя: на дыхание, работу сердца, температуру тела. У среднего человека это 60–70% всех затрат энергии.",
          howTo:"Из чего складывается суточный расход калорий (TDEE):\n\n• BMR (базовый обмен) — ~60–70%\n• Термический эффект пищи (переваривание еды) — ~10%\n• Физическая активность (тренировки + движение) — ~20–30%\n\nТвой TDEE рассчитан в профиле — это целевой ориентир. Но пока не старайся попасть в него точно. Просто записывай.",
          weekTarget:"Задача сегодня:\nПродолжай записывать питание. Обрати внимание: сколько калорий ты реально съедаешь? Без оценки — просто наблюдение."
        },
        tip:{cat:"Питание",text:"Большинство людей недооценивают потребление калорий на 20–40%. Именно поэтому отслеживание — первый шаг к любым изменениям."},
        xp:20
      },
      {
        day:3,type:"mindset",icon:"🏆",
        title:"Ты уже молодец",
        task:"Третий день подряд. Это уже больше, чем делает большинство людей. Сегодня — про три главных макронутриента.",
        info:{
          why:"Три кита питания: белки, жиры, углеводы\n\nВся еда состоит из трёх макронутриентов. Понимание каждого из них — ключ к управлению телом.\n\n🥩 Белок (протеин)\nСтроительный материал для мышц, кожи, гормонов. 1 г белка = 4 ккал. Белок насыщает лучше всего и требует больше энергии на переваривание.\n\n🍚 Углеводы\nОсновное топливо для мозга и мышц. 1 г углеводов = 4 ккал. Простые углеводы (сахар) — быстрая энергия. Сложные (крупы, овощи) — медленная и стабильная.\n\n🥑 Жиры\nНеобходимы для гормонов, усвоения витаминов и работы мозга. 1 г жиров = 9 ккал. Жиры не делают тебя жирным — избыток калорий делает.",
          howTo:"Как выглядит сбалансированная тарелка:\n\n• 25–35% калорий — из белка\n• 40–50% калорий — из углеводов\n• 25–35% калорий — из жиров\n\nНа этой неделе просто смотри на соотношение в своих записях. Не пытайся попасть в цифры — просто изучай.",
          weekTarget:"Задача дня: посмотри в своих записях — какого макронутриента у тебя больше всего? Это и есть твоя точка отсчёта."
        },
        tip:{cat:"Психология",text:"Исследования показывают: люди, которые ведут пищевой дневник хотя бы 3 дня подряд, едят в среднем на 15% меньше — даже без попытки ограничить себя."},
        xp:20
      },
      {
        day:4,type:"nutrition",icon:"📈",
        title:"Почему мы набираем вес",
        task:"Взвесься утром. Сегодня узнаешь, почему вес растёт — и это не всегда то, о чём ты думаешь.",
        info:{
          why:"Почему мы набираем вес?\n\nОтвет простой: когда мы едим больше калорий, чем тратим — излишек откладывается в виде жира. Это называется положительный энергетический баланс.\n\nНо почему так происходит в реальной жизни?\n\n• Калорийная пища стала доступной и вкусной\n• Порции выросли — мы привыкли к большим тарелкам\n• Малоподвижный образ жизни снижает расход\n• Стресс и недосып повышают аппетит (через гормоны кортизол и грелин)\n• Ультра-обработанная еда блокирует сигналы насыщения",
          howTo:"Важно понять:\n\nНабор веса — это не слабость воли. Это результат системы: среды, привычек и биологии. Понимая механизм, ты можешь его изменить.\n\n1 кг жира ≈ 7 700 ккал. Это значит, что для потери 1 кг жира нужен дефицит в 7 700 ккал — примерно 500 ккал/день в течение 15 дней.",
          weekTarget:"Задача: посмотри на свои записи за последние 3 дня. Видишь закономерности? В какое время дня ты ешь больше всего?"
        },
        tip:{cat:"Питание",text:"Жировая ткань не появляется за один день — и не уходит за один день. Тренд важнее любого отдельного числа."},
        xp:20
      },
      {
        day:5,type:"nutrition",icon:"⚡",
        title:"Калорийный баланс",
        task:"Взвесься утром. Сегодня — самая важная концепция в управлении весом.",
        info:{
          why:"Калорийный баланс — основа всего\n\nЭто закон термодинамики, применённый к телу:\n\n📉 Дефицит (ешь меньше, чем тратишь) → вес снижается\n⚖️ Баланс (ешь столько же, сколько тратишь) → вес стабилен\n📈 Профицит (ешь больше, чем тратишь) → вес растёт\n\nВсе диеты — кето, интервальное голодание, веганство — работают только потому, что в итоге создают дефицит калорий. Нет магии, есть математика.",
          howTo:"Как использовать это знание:\n\nТвой целевой показатель калорий указан в профиле. Это не строгий лимит — это ориентир.\n\n• Если твоя цель — снижение жира: стремись к дефициту 300–500 ккал/день\n• Если цель — рекомпозиция: держись около своего TDEE\n• Если цель — здоровье: просто наблюдай и не уходи далеко от TDEE\n\nПочему отслеживание помогает: видя цифры, ты делаешь осознанные выборы. Не запрещаешь себе еду — просто понимаешь последствия.",
          weekTarget:"Задача: сравни свои средние калории за 5 дней с твоим TDEE из профиля. Больше или меньше? Это объясняет динамику твоего веса."
        },
        tip:{cat:"Питание",text:"Исследования показывают: люди, отслеживающие калории регулярно, теряют в 3× больше веса, чем те, кто «просто старается есть меньше»."},
        xp:25
      },
      {
        day:6,type:"mindset",icon:"📊",
        title:"Почему вес меняется каждый день",
        task:"Взвесься утром. Если ты заметил колебания веса за эту неделю — это нормально. Сейчас объясним почему.",
        info:{
          why:"Вес — это не только жир\n\nТвой вес состоит из:\n\n• Мышцы и кости (~60–70%)\n• Жировая ткань (~15–40% в зависимости от человека)\n• Вода (~60% тела)\n• Содержимое желудка и кишечника\n\nИз всего этого жировая ткань меняется МЕДЛЕННЕЕ всего. А что меняется быстро? Вода и содержимое ЖКТ.",
          howTo:"Что влияет на вес в течение дня и недели:\n\n💧 Вода: солёная еда задерживает воду, +1–2 кг\n🍽️ Содержимое кишечника: после обеда ты тяжелее, чем утром\n🏋️ Тренировки: мышцы удерживают воду для восстановления, +0.5–1 кг после нагрузки\n😴 Сон: за ночь теряем 0.5–1 кг с дыханием и потом\n🩸 Гормональный цикл (у женщин): +1–3 кг в определённые фазы\n\nВот почему нельзя судить о прогрессе по одному замеру. Смотри на среднее за 7–14 дней.",
          weekTarget:"Совет: посмотри на минимальный и максимальный вес за эту неделю. Разница — это колебание воды и еды, а не жира."
        },
        tip:{cat:"Психология",text:"Знание причин колебаний веса снижает тревогу и помогает не бросить программу в первые 2 недели — именно тогда большинство сдаются."},
        xp:20
      },
      {
        day:7,type:"mindset",icon:"🧠",
        title:"Внутренняя и внешняя мотивация",
        task:"День 7. Неделя почти позади. Сегодня — о том, что будет двигать тебя дальше, когда первый энтузиазм пройдёт.",
        info:{
          why:"Два типа мотивации\n\n🏆 Внешняя мотивация\nДействие ради награды или избегания наказания.\nПримеры: «хочу влезть в старые джинсы», «хочу произвести впечатление», «мне стыдно за своё тело».\n\nОна работает — но недолго. Когда цель достигнута (или кажется далёкой), мотивация исчезает.\n\n❤️ Внутренняя мотивация\nДействие ради самого процесса и ценностей.\nПримеры: «хочу чувствовать себя сильным», «хочу быть энергичным для детей», «мне важно заботиться о себе».\n\nОна устойчива, потому что не зависит от внешних результатов.",
          howTo:"Как найти свою внутреннюю мотивацию:\n\nСпроси себя: «Зачем мне это на самом деле?» — и задай этот вопрос 5 раз подряд к каждому ответу.\n\nПример:\n— Хочу похудеть → зачем?\n— Хочу лучше выглядеть → зачем?\n— Хочу чувствовать себя уверенно → зачем?\n— Чтобы не бояться встречаться с людьми → зачем?\n— Потому что одиночество мучает меня.\n\nВот настоящая мотивация. Именно она не даст тебе остановиться.",
          weekTarget:"Задание: запиши свою внутреннюю мотивацию. Не «хочу похудеть» — а почему это важно для твоей жизни. Перечитывай это в трудные дни."
        },
        tip:{cat:"Психология",text:"Исследования показывают: люди с внутренней мотивацией поддерживают здоровые привычки в среднем в 3× дольше, чем те, кто ориентируется только на внешние цели."},
        xp:25
      },
    ]},

  { week:2,theme:"Momentum",color:"#00D2FF",
    overview:"Продолжай строить на фундаменте недели 1. Накапливай маленькие победы каждый день. Немного увеличь интенсивность, наладь привычки сна и добавь цель по шагам.",
    training:{ title:"Сила нижней части тела",duration:35,intensity:"Умеренная",
      exercises:[
        {name:"Гоблет-приседание",sets:"4",reps:"12",rest:"75s",note:"Давите пол от себя. Контролируемый спуск, взрывной подъём."},
        {name:"Румынская тяга",sets:"3",reps:"10",rest:"75s",note:"Шарнир в бёдрах, слегка согнутые колени. Почувствуй растяжение бицепса бедра."},
        {name:"Обратные выпады",sets:"3",reps:"10/ногу",rest:"60s",note:"Шаг назад, не вперёд. Переднее колено над голеностопом."},
        {name:"Подъём на носки",sets:"3",reps:"15",rest:"45s",note:"Пауза 1 сек в верхней точке для максимальной активации."},
        {name:"Растяжка сгибателей бедра",sets:"2",reps:"30с/сторону",rest:"30s",note:"На колено, наклони таз, сдвинься вперёд. Почувствуй переднюю поверхность задней ноги."},
      ]},
    nutrition:{ title:"Больше цвета в тарелке",tip:"Добавляй не менее 2 разных цветных овощей к каждому основному блюду. Цвет = микронутриенты, клетчатка и антиоксиданты.",proteinPerKg:1.7,
      meal:{name:"Курица с запечёнными овощами",desc:"Жареная куриная грудка с запечёнными перцем, цукини и помидорами черри на киноа.",macros:"520 ккал · 45г белок · 38г углеводы · 14г жиры"}},
    mindset:{ title:"Отслеживай без осуждения",quote:"Нельзя управлять тем, что не измеряешь. Но измерение — это не осуждение, это знание.",practice:"Записывай еду и тренировки на этой неделе как данные. Без вины, без гордости. Относись к себе как учёный к объекту исследования."},
    days:[
      {
        day:1,type:"nutrition",icon:"📊",
        title:"Итоги первой недели — твоя статистика",
        task:"Отличная работа! Ты прошёл первую неделю. Сегодня смотрим на твои данные и делаем первые выводы.",
        isWeeklyStats:true,
        info:{
          why:"Что показывают твои данные за неделю?\n\nПосмотри на средние значения за 7 дней — они объективнее любого отдельного дня.",
          howTo:"Как читать свою статистику:\n\n⚖️ Средний вес: сравни с начальным. Колебания ±1 кг — норма.\n🔥 Средние калории: больше или меньше твоего TDEE?\n🥩 Средний белок: достигаешь ли целевого уровня?\n👟 Средние шаги: насколько ты активен вне тренировок?\n\nЕсли калории выше TDEE — это объясняет любой рост веса.\nЕсли белок ниже нормы — мышцы восстанавливаются хуже.\nЕсли шагов мало — NEAT (бытовая активность) тянет вниз.",
          weekTarget:"Рекомендации на основе твоих данных будут сформированы автоматически из твоих реальных показателей."
        },
        tip:{cat:"Питание",text:"Первая неделя отслеживания — самая важная. Ты создал базу данных о себе, которую большинство людей никогда не имеют."},
        xp:40
      },
      {day:2,type:"nutrition",icon:"🌈",title:"Цветная тарелка",task:"За ужином убедись, что в тарелке есть не менее 3 разных цветных продуктов. Сфотографируй.",tip:{cat:"Питание",text:"Фитонутриенты, дающие овощам цвет, обладают противовоспалительным действием и поддерживают гормональное здоровье."},xp:15},
      {day:3,type:"mindset",icon:"😴",title:"Аудит сна",task:"Ляг спать на 30 минут раньше обычного. Телефон — в другую комнату. Отметь, как себя чувствуешь утром.",tip:{cat:"Восстановление",text:"Даже одна ночь с 6 часами сна снижает тестостерон до 15% и повышает кортизол."},xp:15},
      {day:4,type:"training",icon:"👟",title:"Цель по шагам",task:"Набери 8 000 шагов сегодня. Иди пешком вместо поездки на короткие расстояния, поднимайся по лестнице.",tip:{cat:"Тренировка",text:"NEAT — бытовая активность вне тренировок — составляет до 30% суточного расхода калорий."},xp:20},
      {day:5,type:"nutrition",icon:"🥣",title:"Приготовь одно блюдо заранее",task:"Сегодня приготовь обед на завтра. Заготовка еды — главный предиктор постоянства в питании.",tip:{cat:"Питание",text:"Те, кто заготавливает еду заранее, едят в 2× меньше калорий из ультра-обработанных продуктов."},xp:20},
      {day:6,type:"training",icon:"🧘",title:"Работа над подвижностью",task:"15 минут на подвижность бёдер и грудного отдела. Последовательность: сгибатели бедра + кошка-корова.",tip:{cat:"Тренировка",text:"Плохая подвижность бёдер — причина болей в пояснице №1 у людей с малоподвижным образом жизни."},xp:15},
      {day:7,type:"rest",icon:"📊",title:"Еженедельная проверка",task:"Взвесься, оцени энергию и настроение от 1 до 10, запиши всё, что было сложно на этой неделе.",tip:{cat:"Психология",text:"Вес колеблется до 2 кг в сутки. Недельные средние важнее ежедневных чисел."},xp:10},
    ]},

  { week:3,theme:"Strength",color:"#3B8BEB",
    overview:"Add resistance. Challenge your muscles with progressive overload — a little more tension than last week. Strength training is the single most effective tool for body recomposition.",
    training:{ title:"Upper Body Push & Pull",duration:40,intensity:"Moderate",
      exercises:[
        {name:"Push-Up (any variation)",sets:"4",reps:"8-12",rest:"75s",note:"Find a variation where the last 2 reps are genuinely hard."},
        {name:"Dumbbell or Band Row",sets:"4",reps:"10/side",rest:"75s",note:"Elbow drives back. Squeeze shoulder blade at the top."},
        {name:"Overhead Press",sets:"3",reps:"10",rest:"75s",note:"Press straight up, core braced, don't flare elbows."},
        {name:"Face Pull or Band Pull-Apart",sets:"3",reps:"15",rest:"45s",note:"Think about pulling the band apart. Great for posture."},
        {name:"Dumbbell Curl",sets:"3",reps:"12",rest:"45s",note:"Slow on the way down — the eccentric builds more muscle."},
      ]},
    nutrition:{ title:"Post-Workout Nutrition",tip:"Eat a protein-rich meal within 45 minutes of training. 30-40g protein + some carbs maximises muscle protein synthesis.",proteinPerKg:1.8,
      meal:{name:"Post-Workout Shake & Banana",desc:"Whey protein (25g) blended with 250ml milk, one banana, and a tablespoon of oats.",macros:"360 kcal · 36g protein · 44g carbs · 6g fat"}},
    mindset:{ title:"Embrace Discomfort",quote:"The cave you fear to enter holds the treasure you seek. — Joseph Campbell",practice:"Each day, do one thing slightly outside your comfort zone. Notice that the discomfort always passes."},
    days:[
      {day:1,type:"training",icon:"💪",title:"Upper Body Session",task:"Complete Upper Body Push & Pull. Find a weight that challenges you in the last 2 reps.",tip:{cat:"Training",text:"The 'two reps left' principle — stopping with 2 in reserve — is optimal for long-term strength gains."},xp:30},
      {day:2,type:"nutrition",icon:"🥛",title:"Post-Workout Window",task:"Plan your post-workout meal before you train. Have it ready. Protein + carbs within 45 min.",tip:{cat:"Nutrition",text:"Muscle protein synthesis remains elevated for 48h post-training, but the first 45 minutes offer the highest uptake rate."},xp:20},
      {day:3,type:"training",icon:"🏃",title:"Cardio Intervals",task:"20 min cardio: 1 min fast, 1 min easy, repeat 10 times. Walk, jog, bike — your choice.",tip:{cat:"Training",text:"Interval training burns 25-30% more calories than steady-state cardio in the same time."},xp:25},
      {day:4,type:"mindset",icon:"🧠",title:"Habit Stack",task:"Attach your daily walk to something you already do — after coffee, after work, after dinner.",tip:{cat:"Mindset",text:"Habit stacking doubles the likelihood of a new habit surviving past 3 weeks."},xp:15},
      {day:5,type:"nutrition",icon:"🫙",title:"Prep Protein Snacks",task:"Prepare 3 grab-and-go protein snacks for the next 3 days: eggs, yogurt, or cottage cheese.",tip:{cat:"Nutrition",text:"Having protein-rich snacks within reach reduces impulsive eating by up to 40%."},xp:20},
      {day:6,type:"training",icon:"🤸",title:"Active Recovery",task:"15-20 minutes of light yoga, stretching, or a slow walk. Focus on tight areas.",tip:{cat:"Recovery",text:"Active recovery increases blood flow to sore muscles, removing waste 30% faster than complete rest."},xp:15},
      {day:7,type:"rest",icon:"📝",title:"Reflect & Adjust",task:"Review your Week 3 logs. What's working? Write 3 honest observations.",tip:{cat:"Mindset",text:"Self-compassion, not self-criticism, is the strongest predictor of long-term behaviour change."},xp:10},
    ]},

  { week:4,theme:"Endurance",color:"#9B6DFF",
    overview:"Shift focus to cardiovascular endurance and recovery capacity. Longer, slower movement alongside strength work. This builds your heart, lungs, and ability to sustain effort.",
    training:{ title:"Steady State Cardio",duration:40,intensity:"Moderate",
      exercises:[
        {name:"Warm-Up Walk",sets:"-",reps:"5 min",rest:"-",note:"Gradually increase pace over 5 minutes."},
        {name:"Sustained Cardio (jog/bike/row/walk)",sets:"-",reps:"30 min",rest:"-",note:"Conversational pace. ~60-70% max heart rate. Zone 2."},
        {name:"Cool-Down Walk",sets:"-",reps:"5 min",rest:"-",note:"Gradually reduce pace. Appreciate what your body just did."},
      ]},
    nutrition:{ title:"Carbs Are Not the Enemy",tip:"Carbohydrates are your primary training fuel. Time them strategically: most carbs around workouts (before and after). Cut them at sedentary times.",proteinPerKg:1.8,
      meal:{name:"Pre-Training Oat & Banana Bowl",desc:"60g rolled oats, one banana, a tablespoon of peanut butter, and a scoop of protein powder.",macros:"490 kcal · 30g protein · 65g carbs · 11g fat"}},
    mindset:{ title:"The 1% Rule",quote:"1% better every day = 37× better by the end of the year. — James Clear",practice:"Find one thing you can improve by just 1% today. One more rep, one more glass of water, 10 minutes earlier to bed."},
    days:[
      {day:1,type:"training",icon:"🫁",title:"Zone 2 Cardio",task:"40 minutes steady state cardio. Choose something you enjoy — walk, jog, bike, swim.",tip:{cat:"Training",text:"Zone 2 is the primary driver of mitochondrial development — upgrading your cells' ability to burn fat."},xp:30},
      {day:2,type:"nutrition",icon:"🍌",title:"Pre-Training Carbs",task:"Eat a carb + protein meal 60-90 min before today's session. Note how your energy feels different.",tip:{cat:"Nutrition",text:"Trained athletes perform 8-12% better when fed versus fasted."},xp:20},
      {day:3,type:"training",icon:"💪",title:"Strength Maintenance",task:"Repeat last week's upper body session. Add 1 rep or a little more weight to at least 2 exercises.",tip:{cat:"Training",text:"Progressive overload — even by 1 rep — is the fundamental signal for muscle adaptation."},xp:30},
      {day:4,type:"mindset",icon:"📵",title:"Screen-Free Morning",task:"Don't touch your phone for the first 30 min after waking. Use that time to move or breathe.",tip:{cat:"Mindset",text:"Morning phone use spikes cortisol. A screen-free morning reduces anxiety by 20%."},xp:20},
      {day:5,type:"nutrition",icon:"🐟",title:"Omega-3 Meal",task:"Have a meal rich in omega-3s today: oily fish, walnuts, or flaxseed. Fights training inflammation.",tip:{cat:"Nutrition",text:"Omega-3s reduce exercise-induced inflammation and DOMS by up to 35%."},xp:20},
      {day:6,type:"training",icon:"🚶",title:"Long Walk",task:"45-minute walk outdoors. No pace target. Just move and observe your surroundings.",tip:{cat:"Recovery",text:"Long slow walking activates the parasympathetic nervous system — reducing cortisol levels."},xp:20},
      {day:7,type:"rest",icon:"🛁",title:"Recovery Ritual",task:"No training. Do something restorative: Epsom salt bath, sauna, or 20 min deep breathing.",tip:{cat:"Recovery",text:"Magnesium in Epsom salts can reduce muscle cramps, improve sleep, and lower cortisol."},xp:10},
    ]},

  { week:5,theme:"Power",color:"#FF6B35",
    overview:"You've built the foundation. Now apply it. Week 5 introduces power — producing force quickly. Translates to everything: sports performance, injury resilience, and metabolic rate.",
    training:{ title:"Full Body Compound Lifts",duration:45,intensity:"High",
      exercises:[
        {name:"Squat (barbell, goblet, or bodyweight)",sets:"4",reps:"8",rest:"90s",note:"Most important lower body movement. Break parallel if mobility allows."},
        {name:"Hinge (deadlift, RDL, or hip thrust)",sets:"4",reps:"8",rest:"90s",note:"Push the floor away, don't pull the weight up."},
        {name:"Horizontal Push (bench or push-up)",sets:"3",reps:"10",rest:"75s",note:"Maintain shoulder blade retraction throughout."},
        {name:"Horizontal Pull (row variation)",sets:"3",reps:"10",rest:"75s",note:"Pull toward lower chest, not chin. Think elbows, not hands."},
        {name:"Farmer's Carry",sets:"3",reps:"20 metres",rest:"60s",note:"Chest tall, short controlled steps. Harder than it looks."},
      ]},
    nutrition:{ title:"Calorie Awareness",tip:"Log every meal for 5 of 7 days this week. Not to restrict — to understand. Most people underestimate intake by 20-40%.",proteinPerKg:1.9,
      meal:{name:"Steak & Sweet Potato",desc:"180g lean rump steak, one medium baked sweet potato, and a large side salad with olive oil.",macros:"580 kcal · 48g protein · 42g carbs · 18g fat"}},
    mindset:{ title:"Competition With Yourself",quote:"Be so good they can't ignore you — but only compete with who you were yesterday.",practice:"Look at last week's log. Pick one number to beat this week — one more rep, one more kg, one minute more."},
    days:[
      {day:1,type:"training",icon:"🏋️",title:"Compound Lifts Day A",task:"Complete Full Body Compound Lifts. Focus on squat and hinge. Note every weight used.",tip:{cat:"Training",text:"Compound movements create more hormonal response (testosterone, growth hormone) than isolation exercises."},xp:35},
      {day:2,type:"nutrition",icon:"📱",title:"Log Everything",task:"Log every single thing you eat today. Every meal, snack, drink. Just observe without judgment.",tip:{cat:"Nutrition",text:"Food logging for 3 consecutive days is linked to a 15% reduction in calorie intake, even without dieting."},xp:25},
      {day:3,type:"training",icon:"💥",title:"HIIT Session",task:"20-min HIIT: 30s max effort (burpees/jump squats/sprints), 90s rest. Repeat 8 times.",tip:{cat:"Training",text:"HIIT elevates metabolism for up to 24 hours post-session — the 'afterburn effect'."},xp:35},
      {day:4,type:"mindset",icon:"🎯",title:"Set a Mini Goal",task:"Set one specific, measurable mini goal for this week. Write it down.",tip:{cat:"Mindset",text:"Specific goals are 3× more likely to be achieved than vague ones like 'be healthier'."},xp:15},
      {day:5,type:"training",icon:"🦵",title:"Compound Lifts Day B",task:"Second strength session. Match or beat your numbers from Day 1. Improve at least 1 exercise.",tip:{cat:"Training",text:"Twice-weekly strength training is the minimum effective dose for measurable gains."},xp:35},
      {day:6,type:"nutrition",icon:"🫙",title:"Meal Prep",task:"Spend 45-60 minutes preparing meals for Monday and Tuesday. Protein + carbs + veg.",tip:{cat:"Nutrition",text:"Having a pre-made meal reduces takeout likelihood by 75% when tired or stressed."},xp:25},
      {day:7,type:"rest",icon:"😌",title:"Parasympathetic Day",task:"Spend 20 minutes fully relaxed: meditation, breathing, nature, reading. No screens or urgency.",tip:{cat:"Recovery",text:"Chronic stress impairs fat loss, muscle repair, sleep quality, and hormonal balance simultaneously."},xp:10},
    ]},

  { week:6,theme:"Flexibility",color:"#F59E0B",
    overview:"A deliberate deload — planned reduction in intensity to let your body consolidate 5 weeks of work. The best athletes schedule recovery as intentionally as training. You'll come back stronger.",
    training:{ title:"Flexibility & Mobility Circuit",duration:30,intensity:"Low",
      exercises:[
        {name:"World's Greatest Stretch",sets:"3",reps:"5/side",rest:"30s",note:"Lunge forward, same-side hand down, rotate toward front knee."},
        {name:"90/90 Hip Stretch",sets:"3",reps:"60s/side",rest:"30s",note:"Both legs at 90°. Don't let the back hip lift. Breathe through tension."},
        {name:"Thoracic Rotation",sets:"3",reps:"10/side",rest:"30s",note:"Side lying, knees stacked. Open top arm back. Feel rotation in mid-back."},
        {name:"Pigeon Pose or Figure-4",sets:"2",reps:"90s/side",rest:"30s",note:"Deep hip work. Normal to feel intense — stay with it, breathe."},
        {name:"Child's Pose with Lat Stretch",sets:"2",reps:"60s/side",rest:"20s",note:"Walk hands to one side to stretch the opposite lat."},
      ]},
    nutrition:{ title:"Anti-Inflammatory Eating",tip:"Focus on foods that reduce inflammation: oily fish, berries, turmeric, ginger, leafy greens, and nuts. Your body is repairing — give it the right materials.",proteinPerKg:1.8,
      meal:{name:"Turmeric Salmon & Greens",desc:"Salmon baked with turmeric, served on spinach, cucumber, and avocado with lemon dressing.",macros:"510 kcal · 42g protein · 12g carbs · 32g fat"}},
    mindset:{ title:"Rest Is Productive",quote:"In the middle of effort lies the need for rest.",practice:"Schedule rest like you schedule workouts. Put it in your calendar. When it arrives, do nothing — and feel no guilt."},
    days:[
      {day:1,type:"training",icon:"🧘",title:"Flexibility Session",task:"Complete the Flexibility & Mobility Circuit. Hold each stretch 20% longer than feels necessary.",tip:{cat:"Training",text:"Static stretching held 60+ seconds produces lasting structural changes. Under 30s has little effect."},xp:20},
      {day:2,type:"nutrition",icon:"🫐",title:"Berry & Antioxidant Day",task:"Add a large handful of berries to at least 2 meals today.",tip:{cat:"Nutrition",text:"Polyphenols in berries reduce exercise-induced oxidative stress and accelerate muscle recovery."},xp:15},
      {day:3,type:"mindset",icon:"🙏",title:"Gratitude Practice",task:"Before bed, write 3 things your body allowed you to do today. Be specific.",tip:{cat:"Mindset",text:"Gratitude practices reduce cortisol by 23% and improve sleep quality when done at night."},xp:15},
      {day:4,type:"training",icon:"🚶",title:"Easy Walk",task:"45-minute easy walk. No target pace. Walk somewhere beautiful if you can.",tip:{cat:"Recovery",text:"Walking in nature measurably lowers rumination and activity in the brain's stress centres."},xp:15},
      {day:5,type:"nutrition",icon:"🫚",title:"Healthy Fats Focus",task:"Include a source of healthy fat in every meal: avocado, olive oil, nuts, oily fish, or seeds.",tip:{cat:"Nutrition",text:"Dietary fat is essential for testosterone and oestrogen production. Very low-fat diets suppress these hormones."},xp:15},
      {day:6,type:"training",icon:"🌊",title:"Swim or Stretch",task:"Swim easy for 20 min if possible. Otherwise, 25 min full-body stretching.",tip:{cat:"Recovery",text:"Swimming provides zero-impact full-body movement — perfect for active recovery weeks."},xp:20},
      {day:7,type:"rest",icon:"💆",title:"Full Rest Day",task:"Complete rest. Sleep an extra hour if you can. Do something joyful with no performance metrics.",tip:{cat:"Recovery",text:"Full rest days after a deload prime the nervous system for higher intensities in weeks ahead."},xp:10},
    ]},

  { week:7,theme:"Recovery",color:"#2ECC71",
    overview:"Build on the deload. Explore the systems that keep you resilient: sleep optimisation, stress management, gut health. These 'soft' factors account for ~40% of training outcomes.",
    training:{ title:"Back to Strength — Reset",duration:40,intensity:"Moderate",
      exercises:[
        {name:"Squat",sets:"3",reps:"10",rest:"75s",note:"Back to your Week 5 squat. Notice how much easier it feels after the deload."},
        {name:"Romanian Deadlift",sets:"3",reps:"10",rest:"75s",note:"Hinge, don't squat. Feel tension in hamstrings before standing."},
        {name:"Dumbbell Bench or Push-Up",sets:"3",reps:"10",rest:"75s",note:"Control the descent over 2-3 seconds. Explosive on the way up."},
        {name:"Row",sets:"3",reps:"12",rest:"60s",note:"Lead with elbow. Squeeze 1s at full contraction."},
        {name:"Plank",sets:"3",reps:"30-45s",rest:"45s",note:"Squeeze glutes, quads, core simultaneously. Don't hold your breath."},
      ]},
    nutrition:{ title:"Gut Health Basics",tip:"Add one fermented food daily: plain Greek yogurt, kefir, sauerkraut, or kimchi. A healthy gut microbiome impacts inflammation, energy, and even mood.",proteinPerKg:1.9,
      meal:{name:"Greek Yogurt Protein Bowl",desc:"300g plain Greek yogurt, walnuts, honey, cinnamon, and sliced banana.",macros:"420 kcal · 28g protein · 40g carbs · 14g fat"}},
    mindset:{ title:"The Process Is the Goal",quote:"Fall in love with the process and the results will come.",practice:"This week, pay attention to how you feel during your healthy habits, not after. The enjoyment is in the doing."},
    days:[
      {day:1,type:"training",icon:"🔄",title:"Return to Strength",task:"Complete the reset strength session at 80% of Week 5 effort. Enjoy the freshness.",tip:{cat:"Training",text:"Supercompensation peaks 7-10 days after a deload. You are stronger than you were in Week 5."},xp:30},
      {day:2,type:"nutrition",icon:"🫙",title:"Fermented Foods",task:"Add a fermented food to each meal today: yogurt at breakfast, kimchi or sauerkraut at lunch.",tip:{cat:"Nutrition",text:"The gut-brain axis means your microbiome directly influences mood and motivation to exercise."},xp:20},
      {day:3,type:"mindset",icon:"😮‍💨",title:"Box Breathing",task:"Practice box breathing 5 min: inhale 4s, hold 4s, exhale 4s, hold 4s. Before your most stressful moment.",tip:{cat:"Mindset",text:"Box breathing activates the vagus nerve and reduces cortisol within 90 seconds."},xp:15},
      {day:4,type:"training",icon:"🏊",title:"Low Impact Cardio",task:"30 min low-impact cardio: swim, cycle, or walk. Light sweat, relaxed breathing.",tip:{cat:"Training",text:"Low-impact cardio increases blood flow to healing tissues without adding stress to joints."},xp:20},
      {day:5,type:"nutrition",icon:"🌿",title:"Greens & Fibre",task:"Eat a fist-sized portion of leafy greens at both lunch and dinner today.",tip:{cat:"Nutrition",text:"Fibre from leafy greens feeds gut bacteria that produce compounds reducing inflammation."},xp:15},
      {day:6,type:"training",icon:"🏋️",title:"Strength Session 2",task:"Second session of the week. Push to 90% effort — you should feel properly challenged.",tip:{cat:"Training",text:"Two strength sessions per week is enough for measurable gains in months 1-3."},xp:35},
      {day:7,type:"rest",icon:"🌙",title:"Sleep Optimisation Night",task:"Room at 18°C, blackout curtains, phone off 60 min before bed. See how you feel tomorrow.",tip:{cat:"Recovery",text:"A 1°C drop in core body temperature triggers deep sleep. A cool room makes this happen faster."},xp:10},
    ]},

  { week:8,theme:"Intensity",color:"#FF4757",
    overview:"The halfway point. Turn up the intensity — higher volume, less rest, push to genuine failure on key sets. You're ready for this.",
    training:{ title:"High Volume Upper/Lower Circuit",duration:50,intensity:"High",
      exercises:[
        {name:"Squat (superset with press)",sets:"4",reps:"10",rest:"60s",note:"Perform squat then press before resting."},
        {name:"Overhead Press (superset with squat)",sets:"4",reps:"10",rest:"60s",note:"Complete both exercises then rest 60s."},
        {name:"Romanian Deadlift (superset with row)",sets:"4",reps:"10",rest:"60s",note:"Back flat throughout. Superset with row."},
        {name:"Dumbbell Row (superset with RDL)",sets:"4",reps:"10/side",rest:"60s",note:"Full contraction at top. Superset with RDL."},
        {name:"Push-Up to Failure",sets:"3",reps:"MAX",rest:"90s",note:"True failure. Last rep should be barely possible."},
        {name:"Plank",sets:"3",reps:"45-60s",rest:"45s",note:"Finish strong. Core braced, glutes squeezed."},
      ]},
    nutrition:{ title:"Calorie Periodisation",tip:"Eat more on training days (add 150-200 kcal from carbs), less on rest days. Keeps weekly average the same while optimising fuel and recovery.",proteinPerKg:2.0,
      meal:{name:"Training Day Power Bowl",desc:"200g ground turkey, 150g cooked rice, roasted veg, Greek yogurt and sriracha sauce.",macros:"650 kcal · 52g protein · 68g carbs · 16g fat"}},
    mindset:{ title:"Halfway Reflection",quote:"The first half was about becoming — the second half is about being.",practice:"Write a letter from your Week 16 self to your current self. What does that version of you want you to know?"},
    days:[
      {day:1,type:"training",icon:"🔥",title:"High Volume Session A",task:"Complete the High Volume circuit. Push to genuine failure on the push-up finisher.",tip:{cat:"Training",text:"Training to failure once per session signals maximum muscle recruitment and drives hypertrophy."},xp:40},
      {day:2,type:"nutrition",icon:"📈",title:"High Calorie Training Day",task:"Add 150-200 kcal of carbs (oats, rice, banana) on this training day. Notice your energy.",tip:{cat:"Nutrition",text:"Depleted glycogen reduces power output by up to 20%."},xp:20},
      {day:3,type:"training",icon:"💨",title:"HIIT Round 2",task:"20-min circuit: burpees, jump squats, mountain climbers. 40s on, 20s off, no stopping.",tip:{cat:"Training",text:"HIIT 2-3× per week alongside strength produces greater fat loss than either alone."},xp:40},
      {day:4,type:"mindset",icon:"📊",title:"Halfway Audit",task:"Compare your Weeks 1-4 logs to Weeks 5-8. Calculate averages for weight, steps, calories. What improved?",tip:{cat:"Mindset",text:"Reviewing your own data — seeing numbers change — is one of the most powerful motivators in behavioural science."},xp:20},
      {day:5,type:"training",icon:"🏋️",title:"High Volume Session B",task:"Second session this week. Beat at least one number from Session A.",tip:{cat:"Training",text:"At Week 8, your nervous system is measurably more efficient than Week 1."},xp:40},
      {day:6,type:"nutrition",icon:"🥗",title:"Low Calorie Rest Day",task:"Rest day — reduce carbs by 150-200 kcal. Keep protein high. Focus on veg and lean proteins.",tip:{cat:"Nutrition",text:"Carb cycling preserves muscle while accelerating fat loss vs. a static calorie approach."},xp:20},
      {day:7,type:"rest",icon:"🛁",title:"Recovery Investment",task:"Foam roll 10 min (glutes, quads, upper back), then 10 min hot bath or shower.",tip:{cat:"Recovery",text:"Heat + foam rolling speeds recovery from high-volume training weeks."},xp:10},
    ]},

  { week:9,theme:"Consistency",color:"#C8F135",
    overview:"The hardest psychological phase — novelty has passed, results aren't fully visible yet. Trust the process. The compound effect is happening under the surface.",
    training:{ title:"Progressive Overload Test",duration:45,intensity:"High",
      exercises:[
        {name:"Squat — Work Up to 5 Rep Max",sets:"4",reps:"5",rest:"120s",note:"Add weight each set. The 4th set should be a 5RM or near it."},
        {name:"Push-Up — Max Reps Test",sets:"3",reps:"MAX",rest:"120s",note:"Rest 2 min between sets. Record number. Compare to Week 1."},
        {name:"Row — Weight PR Attempt",sets:"3",reps:"8",rest:"90s",note:"Heavier than last week. Form first, weight second."},
        {name:"Plank — Time PR",sets:"2",reps:"MAX TIME",rest:"90s",note:"Beat your previous record. Record the time."},
      ]},
    nutrition:{ title:"Protein Timing Mastery",tip:"Distribute protein evenly across 4-5 meals rather than loading at dinner. 30-40g per meal maximises synthesis better than one large dose.",proteinPerKg:2.0,
      meal:{name:"Cottage Cheese & Fruit Snack",desc:"250g low-fat cottage cheese with pineapple and a small handful of almonds.",macros:"320 kcal · 26g protein · 24g carbs · 12g fat"}},
    mindset:{ title:"When Motivation Fails, Use Discipline",quote:"You don't have to feel like doing it. You just have to do it.",practice:"When you don't feel like training, agree to just put on your shoes and do 5 minutes. After 5 minutes, decide."},
    days:[
      {day:1,type:"training",icon:"📏",title:"Benchmark Session",task:"Hit personal bests in squat, push-up, and plank. Record every number — these are your Week 9 benchmarks.",tip:{cat:"Training",text:"Tracking personal records creates a feedback loop that sustains motivation."},xp:40},
      {day:2,type:"nutrition",icon:"⏰",title:"Even Protein Distribution",task:"Plan meals so each has 25-35g protein. Spread across breakfast, lunch, snack, and dinner.",tip:{cat:"Nutrition",text:"The body can synthesise muscle from ~40g protein per meal. Spread your intake for maximum effect."},xp:20},
      {day:3,type:"training",icon:"🏃",title:"Run Benchmark",task:"Run or brisk walk for 20 min. Record the distance. Your Week 9 cardio baseline.",tip:{cat:"Training",text:"VO2 max is one of the strongest predictors of longevity. Training it beats most medications."},xp:25},
      {day:4,type:"mindset",icon:"🔁",title:"Review Your Habits",task:"Which habits from the first 8 weeks have truly stuck? List them. They are now part of who you are.",tip:{cat:"Mindset",text:"Recognising habits as part of your identity dramatically increases their permanence."},xp:15},
      {day:5,type:"training",icon:"💪",title:"Strength — Upper Focus",task:"Upper body focused session. Beat your push-up benchmark with a progression.",tip:{cat:"Training",text:"Once bodyweight push-ups feel easy, adding 10kg via a vest equals a 10kg dumbbell press."},xp:35},
      {day:6,type:"nutrition",icon:"🛒",title:"Shop With a Plan",task:"Write your grocery list before shopping. Only buy what's on the list.",tip:{cat:"Nutrition",text:"Shopping without a list results in 23% more impulsive food purchases."},xp:20},
      {day:7,type:"rest",icon:"🎨",title:"Rest & Create",task:"No training. Cook a new healthy recipe, write, draw, or garden.",tip:{cat:"Recovery",text:"Creative activities reduce cortisol and increase dopamine — the neurotransmitter most responsible for motivation."},xp:10},
    ]},

  { week:10,theme:"Challenge",color:"#00D2FF",
    overview:"Introduce a third training day and reduce rest periods. Build mental and physical resilience. Discover how much more capable you are than you thought.",
    training:{ title:"Three-Day Split",duration:45,intensity:"High",
      exercises:[
        {name:"Squat",sets:"4",reps:"8",rest:"60s",note:"Heavy and fast. Drive hard out of the bottom."},
        {name:"Leg Press or Bulgarian Split Squat",sets:"3",reps:"10/side",rest:"60s",note:"90% of weight on front leg for Bulgarian."},
        {name:"Leg Curl or Nordic Curl",sets:"3",reps:"10",rest:"60s",note:"Slow down. Control the eccentric — that's where growth happens."},
        {name:"Standing Calf Raise",sets:"3",reps:"15",rest:"45s",note:"Pause 1s at top. Calves respond to volume."},
        {name:"Ab Wheel or Hollow Hold",sets:"3",reps:"8 / 30s",rest:"45s",note:"Maintain lower back pressure throughout."},
      ]},
    nutrition:{ title:"Pre-Sleep Protein",tip:"Add slow-digesting protein 30-60 min before bed: casein, cottage cheese, or Greek yogurt. Overnight muscle repair requires a steady amino acid supply.",proteinPerKg:2.0,
      meal:{name:"Pre-Sleep Casein Bowl",desc:"250g low-fat cottage cheese with almond butter and cinnamon.",macros:"290 kcal · 30g protein · 10g carbs · 13g fat"}},
    mindset:{ title:"The Challenge Mindset",quote:"Hard things are hard. That's the point.",practice:"When something is hard in training, say: 'This is exactly the kind of challenge that makes me stronger.' Reframe difficulty as stimulus."},
    days:[
      {day:1,type:"training",icon:"🦵",title:"Lower Body Day 1",task:"Complete lower body session with 60-second rest periods. Embrace the burn.",tip:{cat:"Training",text:"Shorter rest periods increase metabolic stress — one of the three primary mechanisms of hypertrophy."},xp:40},
      {day:2,type:"training",icon:"💪",title:"Upper Body Day 2",task:"Design your own upper body session: push, pull, carry. 4 exercises, 3-4 sets each.",tip:{cat:"Training",text:"Autonomy in training — choosing your exercises — is associated with higher adherence and enjoyment."},xp:35},
      {day:3,type:"nutrition",icon:"🌙",title:"Pre-Sleep Protein",task:"Have slow-digesting protein 45 min before sleep tonight. Note your sleep quality tomorrow.",tip:{cat:"Nutrition",text:"40g casein before sleep increases overnight muscle protein synthesis by 22%."},xp:20},
      {day:4,type:"training",icon:"🌀",title:"Full Body Day 3",task:"Third session: one compound per pattern — squat, hinge, push, pull. 3 sets each, moderate weight.",tip:{cat:"Training",text:"Three training days/week is optimal for most people balancing recovery, results, and real life."},xp:35},
      {day:5,type:"mindset",icon:"📲",title:"Digital Detox Evening",task:"No screens after 8pm. Use the time to stretch, journal, or just be still.",tip:{cat:"Mindset",text:"Blue light suppresses melatonin for up to 2 hours. No screens improves sleep onset by 45 min."},xp:20},
      {day:6,type:"nutrition",icon:"🧪",title:"Macro Check-In",task:"Review your FatSecret data from the last 7 days. Hitting protein target? Adjust one habit if not.",tip:{cat:"Nutrition",text:"People who review nutrition data weekly are 3× more likely to stay on track."},xp:20},
      {day:7,type:"rest",icon:"🛌",title:"Full Rest",task:"Three hard sessions deserve a full rest day. Eat well, sleep long, reflect on your growth.",tip:{cat:"Recovery",text:"The third weekly session requires the next day to be total rest. Don't be tempted to add anything."},xp:10},
    ]},

  { week:11,theme:"Balance",color:"#3B8BEB",
    overview:"Balance — not physical, but integration. Training hard, eating well, sleeping deeply, managing stress, and feeling good are not competing priorities. They reinforce each other.",
    training:{ title:"Strength & Skill",duration:45,intensity:"Moderate",
      exercises:[
        {name:"Single-Leg Squat or Pistol Progression",sets:"3",reps:"6-8/side",rest:"75s",note:"Use a box for support. Work toward full depth over time."},
        {name:"Single-Arm Dumbbell Press",sets:"3",reps:"10/side",rest:"60s",note:"Core resists rotation. Identify if one side is weaker."},
        {name:"Single-Arm Row",sets:"3",reps:"10/side",rest:"60s",note:"Full range of motion. Note any imbalance."},
        {name:"Hip Thrust",sets:"4",reps:"12",rest:"60s",note:"Upper back on bench, weight across hips. Full hip extension, hold 1s."},
        {name:"Copenhagen Plank",sets:"3",reps:"20s/side",rest:"45s",note:"Side plank, top foot on bench. Targets adductors — critical for knee health."},
      ]},
    nutrition:{ title:"The 80/20 Rule",tip:"Eat nutritiously 80% of the time. Don't worry about the other 20%. Rigidity leads to bingeing. Flexibility leads to consistency.",proteinPerKg:2.0,
      meal:{name:"The 80% Plate",desc:"Half plate: greens & veg. Quarter: lean protein. Quarter: complex carbs. Simple and repeatable.",macros:"490 kcal · 40g protein · 44g carbs · 14g fat"}},
    mindset:{ title:"Zoom Out",quote:"You are not behind. You are on your own timeline and right on schedule.",practice:"Look at your Week 1 logs and your current logs. See the person you've become in 11 weeks."},
    days:[
      {day:1,type:"training",icon:"⚖️",title:"Strength & Balance",task:"Complete the Strength & Skill session. Identify any left/right imbalance. Note it.",tip:{cat:"Training",text:"Most people have a 10-15% strength difference between sides. Single-limb training corrects this naturally."},xp:35},
      {day:2,type:"nutrition",icon:"🍕",title:"Enjoy the 20%",task:"Eat something you love that you'd normally consider 'bad'. Eat slowly, enjoy it, log it. No guilt.",tip:{cat:"Nutrition",text:"Eliminating all 'forbidden foods' increases bingeing risk by 4× vs. a flexible approach."},xp:15},
      {day:3,type:"training",icon:"🏃",title:"Cardio Choice",task:"30-45 min of any cardio you enjoy. Whatever keeps your heart rate up and feels good.",tip:{cat:"Training",text:"Enjoyment is a major predictor of adherence. The best cardio is the one you'll keep doing."},xp:25},
      {day:4,type:"mindset",icon:"🤝",title:"Social Movement",task:"Walk, run, or train with another person today. Make exercise social.",tip:{cat:"Mindset",text:"Social accountability increases exercise adherence by up to 65%."},xp:20},
      {day:5,type:"training",icon:"💪",title:"Strength Session 2",task:"Second session of the week. At least one movement should improve from Session 1.",tip:{cat:"Training",text:"Minimum effective dose for strength: 2 sessions/week with progressive overload."},xp:35},
      {day:6,type:"nutrition",icon:"🧑‍🍳",title:"Cook Something New",task:"Cook a recipe you've never made using high-protein ingredients. Diversity supports gut health.",tip:{cat:"Nutrition",text:"Eating 30+ different plant foods per week is the strongest predictor of gut microbiome richness."},xp:20},
      {day:7,type:"rest",icon:"🌅",title:"Sunrise or Sunset Walk",task:"20-min walk at sunrise or sunset — no headphones. Just observe. Balance includes silence.",tip:{cat:"Recovery",text:"Morning light sets your circadian rhythm, improves sleep 14-16 hours later, and boosts daytime energy."},xp:15},
    ]},

  { week:12,theme:"Speed",color:"#9B6DFF",
    overview:"Three-quarters done. Add explosive speed work — faster contractions, plyometric movements. Body composition shifts become most visible. Speed training is one of the most underrated fat-loss tools.",
    training:{ title:"Power & Plyometric Circuit",duration:40,intensity:"High",
      exercises:[
        {name:"Jump Squat",sets:"4",reps:"8",rest:"90s",note:"Sink fast, explode hard. Land softly with bent knees."},
        {name:"Clap Push-Up or Explosive Push-Up",sets:"3",reps:"6",rest:"90s",note:"Push so hard your hands leave the floor. Scale to elevated if needed."},
        {name:"Box Jump or Step-Up Jump",sets:"3",reps:"6",rest:"90s",note:"Land both feet, absorb, step down (don't jump down)."},
        {name:"Med Ball Slam or Burpee",sets:"4",reps:"8",rest:"75s",note:"Maximum force. Slam with your whole body behind it."},
        {name:"Sprint Intervals",sets:"6",reps:"15s sprint / 45s walk",rest:"-",note:"Absolute max speed for 15 seconds. Walk the rest. 6 rounds."},
      ]},
    nutrition:{ title:"Creatine & Performance",tip:"Consider adding 3-5g of creatine monohydrate daily. Most researched supplement for strength, power, and recovery. No loading phase needed.",proteinPerKg:2.0,
      meal:{name:"Power Bowl",desc:"2 whole eggs + 4 egg whites scrambled, smoked salmon, avocado. Creatine in a glass of juice.",macros:"540 kcal · 48g protein · 18g carbs · 28g fat"}},
    mindset:{ title:"Speed of Trust",quote:"The body achieves what the mind believes.",practice:"In explosive training, commit to maximum effort before you know whether you can do it. Hesitation is the enemy of power."},
    days:[
      {day:1,type:"training",icon:"💥",title:"Power & Plyometrics",task:"Complete the full Power & Plyometric Circuit. Maximum effort on each explosive rep.",tip:{cat:"Training",text:"Fast-twitch fibres have the highest metabolic activity and contribute most to resting metabolic rate."},xp:45},
      {day:2,type:"nutrition",icon:"🧪",title:"Start Creatine",task:"Begin 5g creatine monohydrate today. Mix into any drink. Log it.",tip:{cat:"Nutrition",text:"Creatine has 1,000+ clinical trials. Increases strength by 5-15% and is safe for healthy adults."},xp:15},
      {day:3,type:"training",icon:"🏃",title:"Speed Run",task:"20-min run. Every 5 min, sprint for 30 seconds at maximum effort. 4 sprints total.",tip:{cat:"Training",text:"Sprint training recruits muscle fibres jogging never reaches. Even 4-6 sprints/week improves body composition."},xp:35},
      {day:4,type:"mindset",icon:"📷",title:"Progress Photos",task:"Take progress photos in consistent lighting and clothing. Compare to Week 1 and Week 8.",tip:{cat:"Mindset",text:"Photo evidence of progress is highly motivating — the scale doesn't capture the full picture."},xp:15},
      {day:5,type:"training",icon:"🏋️",title:"Strength With Power",task:"Strength session but add one set of explosive reps at the start of each exercise: 3 fast, then 8 controlled.",tip:{cat:"Training",text:"Post-activation potentiation — explosive reps before heavy ones — increases strength output by up to 10%."},xp:40},
      {day:6,type:"nutrition",icon:"🫙",title:"Shake Upgrade",task:"Add Greek yogurt or a whole egg to your protein shake this week. More nutrients, same convenience.",tip:{cat:"Nutrition",text:"Whole-food protein alongside whey provides leucine and caseins that improve overnight recovery."},xp:15},
      {day:7,type:"rest",icon:"🌿",title:"Nature Therapy",task:"Spend 60+ min in nature. Park, forest, beach, or garden. No agenda.",tip:{cat:"Recovery",text:"Forest bathing reduces cortisol by 15%, lowers blood pressure, and boosts immune function."},xp:10},
    ]},

  { week:13,theme:"Control",color:"#FF6B35",
    overview:"Control — physical and mental. In training, slow the eccentric phase to maximise muscle damage and growth. In life, work on responding rather than reacting.",
    training:{ title:"Tempo Training (3-1-2)",duration:50,intensity:"Moderate",
      exercises:[
        {name:"Tempo Squat (3-1-2)",sets:"4",reps:"8",rest:"90s",note:"3s down, 1s pause, 2s up. Use 30-40% less weight — it's much harder."},
        {name:"Tempo Push-Up (3-1-2)",sets:"4",reps:"8",rest:"75s",note:"3s descent, 1s at bottom, 2s push. Full tension throughout."},
        {name:"Tempo Row (3-1-2)",sets:"4",reps:"8/side",rest:"75s",note:"2s to top, 1s hold, 3s return. Feel the lat stretch on the way down."},
        {name:"Tempo Romanian Deadlift (3-1-2)",sets:"3",reps:"10",rest:"90s",note:"3s descent, 1s pause, 2s hinge up. Maximum hamstring tension."},
        {name:"Slow Plank Shoulder Taps",sets:"3",reps:"10/side",rest:"60s",note:"2 seconds per tap. Hips stay perfectly still."},
      ]},
    nutrition:{ title:"Mindful Eating",tip:"Eat without screens for at least 2 meals per day. Sit down, eat slowly, stop at 80% full. Mindful eating reduces intake by 10-20% without dieting.",proteinPerKg:2.0,
      meal:{name:"The Slow Meal",desc:"Whatever you'd normally eat — but at a table, no screen, chewing each bite 15-20 times. This week's practice is awareness, not a recipe.",macros:"Your awareness matters more than the macros."}},
    mindset:{ title:"Respond, Don't React",quote:"Between stimulus and response there is a space. In that space is our power. — Viktor Frankl",practice:"Identify one trigger that causes poor food choices or skipped training. Design a deliberate response in advance."},
    days:[
      {day:1,type:"training",icon:"🐢",title:"Tempo Session A",task:"Complete Tempo Training. Reduce weights by 30%, use 3-1-2 tempo strictly. Your muscles will disagree.",tip:{cat:"Training",text:"Time under tension is a primary driver of hypertrophy. 5-6 seconds per rep doubles the growth stimulus."},xp:40},
      {day:2,type:"nutrition",icon:"🧘",title:"Eat Without Screens",task:"No screens for two meals today. Sit at a table, eat slowly, taste your food.",tip:{cat:"Nutrition",text:"It takes 20 min for satiety signals to reach your brain. Eating fast means eating past fullness every time."},xp:20},
      {day:3,type:"training",icon:"🏊",title:"Active Recovery",task:"30 min easy movement: swim, cycle, or yoga. No intensity.",tip:{cat:"Recovery",text:"After tempo training (high time under tension), a lighter day 48 hours later is optimal."},xp:20},
      {day:4,type:"mindset",icon:"📓",title:"Trigger Mapping",task:"Write the 3 situations that most reliably derail you. For each, write a specific planned response.",tip:{cat:"Mindset",text:"Implementation intentions — 'When X happens, I will do Y' — increase follow-through by up to 300%."},xp:20},
      {day:5,type:"training",icon:"🐢",title:"Tempo Session B",task:"Second tempo session. Can you go 5% slower on each negative phase?",tip:{cat:"Training",text:"The eccentric phase produces 20-40% more force than the concentric and drives most hypertrophy."},xp:40},
      {day:6,type:"nutrition",icon:"🍫",title:"Dark Chocolate Moment",task:"Have 1-2 squares of 85%+ dark chocolate. Eat slowly, without distraction.",tip:{cat:"Nutrition",text:"Dark chocolate (85%+) contains flavanols that improve blood flow and reduce cortisol."},xp:10},
      {day:7,type:"rest",icon:"🧴",title:"Recovery & Self-Care",task:"No training. Invest in recovery: massage, foam rolling, stretching, or a long bath.",tip:{cat:"Recovery",text:"Massage after a high-volume week reduces DOMS by 30% and accelerates recovery of full strength."},xp:10},
    ]},

  { week:14,theme:"Peak",color:"#F59E0B",
    overview:"Your peak training week — highest volume and intensity of the entire program. Your strength, endurance, movement quality, and mindset are at their highest. Leave nothing on the table.",
    training:{ title:"Maximum Effort Week",duration:55,intensity:"High",
      exercises:[
        {name:"Squat — 5 Rep Max",sets:"5",reps:"5",rest:"120s",note:"Work up to the heaviest 5 reps you've ever done. Record and celebrate."},
        {name:"Push-Up Progression — Rep Max",sets:"4",reps:"MAX",rest:"120s",note:"Hardest push variation you can do. MAX reps per set."},
        {name:"Deadlift or Hip Thrust — 5 Rep Max",sets:"4",reps:"5",rest:"120s",note:"Heaviest posterior chain movement you can safely perform. Technique first."},
        {name:"Pull-Up or Chin-Up — Max Reps",sets:"4",reps:"MAX",rest:"120s",note:"Band assisted if needed. Track reps — should have grown since Week 1."},
        {name:"Farmer's Carry — Distance PR",sets:"3",reps:"40 metres",rest:"90s",note:"Heaviest weight you've carried for this distance. Grip and composure are the test."},
      ]},
    nutrition:{ title:"Peak Week Fuelling",tip:"Highest-intensity training week — fuel accordingly. Increase carbs by 25-30% on training days (not rest days). Your body needs the glycogen.",proteinPerKg:2.1,
      meal:{name:"Performance Day Plate",desc:"200g chicken breast, 200g cooked white rice, sweet potato, and a large serving of broccoli.",macros:"720 kcal · 56g protein · 82g carbs · 16g fat"}},
    mindset:{ title:"The Final Push",quote:"You've already done the hardest thing. You kept going when it got boring, when it got hard, when no one was watching.",practice:"Before every session this week, take 60 seconds to remember Week 1. Recognise how far you've come. Use it as fuel."},
    days:[
      {day:1,type:"training",icon:"🏆",title:"Maximum Effort Day 1",task:"Hit your 5-rep max on squats. Record the weight. Your official peak strength benchmark.",tip:{cat:"Training",text:"A 5RM is highly diagnostic — multiply by 1.15 to estimate your 1RM."},xp:50},
      {day:2,type:"nutrition",icon:"🍚",title:"Carb-Up Training Day",task:"Add 80-100g extra carbs (rice, oats, sweet potato). Distribute around the training session.",tip:{cat:"Nutrition",text:"A single high-carb meal before peak training increases total volume achieved by 10-12%."},xp:20},
      {day:3,type:"training",icon:"💥",title:"Maximum Effort Day 2",task:"Hit push and pull maxima — max reps push-up, max weight row, max reps pull-up.",tip:{cat:"Training",text:"Week 14 is typically when body composition changes become most visible."},xp:50},
      {day:4,type:"mindset",icon:"🪞",title:"Peak Metrics",task:"Take progress photos, measure waist and neck, note your push-up max. These are your peak-week stats.",tip:{cat:"Mindset",text:"Objective measurement at peak week creates a permanent anchor — a documented high point to surpass."},xp:20},
      {day:5,type:"training",icon:"🏋️",title:"Maximum Effort Day 3",task:"Deadlift or hip thrust heavy, farmer's carry PR. Complete the full maximum effort session.",tip:{cat:"Training",text:"Three high-intensity sessions in one week is the maximum effective dose for most people."},xp:50},
      {day:6,type:"nutrition",icon:"🍌",title:"Glycogen Restoration",task:"After a hard week, eat a high-carb, moderate-protein meal to restore muscle glycogen.",tip:{cat:"Nutrition",text:"Muscle glycogen takes 24-48 hours to fully restore. Eat carbs soon after training."},xp:15},
      {day:7,type:"rest",icon:"😴",title:"Full Recovery Day",task:"Complete rest. Prioritise 9 hours of sleep tonight. Most important recovery night of the program.",tip:{cat:"Recovery",text:"Growth hormone peaks during sleep — responsible for rebuilding everything from this toughest week."},xp:10},
    ]},

  { week:15,theme:"Taper",color:"#2ECC71",
    overview:"Tapering — reduce volume while maintaining intensity. You've done the work. Let your body fully absorb 14 weeks of adaptation. You'll feel strongest of the entire program by the end of this week.",
    training:{ title:"Taper — Maintain Intensity, Cut Volume",duration:35,intensity:"Moderate",
      exercises:[
        {name:"Squat",sets:"2",reps:"5 (heavy)",rest:"120s",note:"Use your Week 14 weight. Just 2 sets. Quality not quantity."},
        {name:"Push-Up or Bench Press",sets:"2",reps:"8 (heavy)",rest:"90s",note:"Maintain peak-week load. Only 2 sets — feel how much easier."},
        {name:"Row",sets:"2",reps:"8",rest:"90s",note:"Same weight as peak week, half the volume."},
        {name:"Hinge (Deadlift or Hip Thrust)",sets:"2",reps:"5 (heavy)",rest:"120s",note:"Heavy but controlled. The body remembers what you've built."},
      ]},
    nutrition:{ title:"Maintenance and Preparation",tip:"Keep nutrition consistent with your best weeks. Don't under-eat or over-eat. This is not the week to experiment — execute your best habits.",proteinPerKg:2.0,
      meal:{name:"Your Best Consistent Meal",desc:"Your most reliable meal from the past 14 weeks — whatever gives you energy, hits your macros, and you genuinely enjoy.",macros:"Your best consistent choice."}},
    mindset:{ title:"Gratitude and Anticipation",quote:"The best is not behind you. It's just beginning.",practice:"Write a list of 10 specific things that are better in your body, energy, or habits since Week 1. Read it before training."},
    days:[
      {day:1,type:"training",icon:"🎯",title:"Taper Session A",task:"Complete the taper session — heavy weights, half the volume. Notice how fresh you feel.",tip:{cat:"Training",text:"Tapering for 7-10 days improves performance by 3-8% vs. continuing high volume."},xp:30},
      {day:2,type:"mindset",icon:"📝",title:"The List of 10",task:"Write 10 things that have genuinely improved since Week 1. Anything counts.",tip:{cat:"Mindset",text:"Gratitude for personal progress increases self-efficacy — belief in your ability to continue."},xp:20},
      {day:3,type:"training",icon:"🚴",title:"Light Cardio",task:"20-30 min easy cardio only. Cycling, swimming, or walk. Conversational pace.",tip:{cat:"Training",text:"Light aerobic work during taper maintains cardiovascular priming without adding fatigue."},xp:20},
      {day:4,type:"nutrition",icon:"🍽️",title:"Best Nutrition Day",task:"Execute your ideal nutrition day — the way you'd want to eat for the rest of your life. Save it as a template.",tip:{cat:"Nutrition",text:"A documented 'ideal day' template is the most useful tool for maintaining progress after the program."},xp:20},
      {day:5,type:"training",icon:"💪",title:"Taper Session B",task:"Final structured session before Week 16. Half volume, peak intensity. Feel the freshness.",tip:{cat:"Training",text:"By now, fibres from Week 14 have fully remodelled — you are technically at your strongest of all 16 weeks."},xp:30},
      {day:6,type:"mindset",icon:"🔭",title:"After 16 — Your Plan",task:"Write down how you'll maintain and continue after Week 16. Training target, nutrition anchor, next milestone.",tip:{cat:"Mindset",text:"People who plan post-program are 4× more likely to maintain results at 6 months."},xp:25},
      {day:7,type:"rest",icon:"🌙",title:"Pre-Final Rest",task:"Complete rest. 8-9 hours sleep. Eat cleanly. Tomorrow begins the last week — and you are ready.",tip:{cat:"Recovery",text:"15 weeks of work cannot be undone by a good week of rest. Trust the process."},xp:10},
    ]},

  { week:16,theme:"Triumph",color:"#FF4757",
    overview:"Week 16. The final week. A celebration and a beginning. Your final benchmarks will show exactly how far you've come. Then we set you up for what comes next: a stronger, more disciplined version of yourself.",
    training:{ title:"The Final Benchmark",duration:60,intensity:"High",
      exercises:[
        {name:"Squat — 5 Rep Max",sets:"5",reps:"5",rest:"120s",note:"Beat Week 14. You can."},
        {name:"Push-Up — Max Reps",sets:"3",reps:"MAX",rest:"120s",note:"Compare to Week 1. This number will shock you."},
        {name:"Row — Max Weight for 8",sets:"3",reps:"8",rest:"90s",note:"Heaviest 8-rep row of the program."},
        {name:"Plank — Max Time",sets:"2",reps:"MAX TIME",rest:"120s",note:"Beat Week 9 and Week 14 records."},
        {name:"20-Min Run — Max Distance",sets:"-",reps:"20 min",rest:"-",note:"Beat your Week 9 cardio baseline. Record the distance."},
      ]},
    nutrition:{ title:"Building for Life",tip:"Your nutrition approach shouldn't end here. Write your three non-negotiable habits — the ones you'll carry forward no matter what. These are your anchors.",proteinPerKg:2.0,
      meal:{name:"Celebration Meal (Your Choice)",desc:"Whatever meal made you feel best, strongest, and most satisfied over the past 16 weeks. Cook it. Enjoy it fully.",macros:"Whatever fuels your triumph."}},
    mindset:{ title:"This Is Just the Beginning",quote:"It always seems impossible until it's done. — Nelson Mandela",practice:"On the final day, write a letter to yourself for 6 months from now. What do you want that version of you to have kept?"},
    days:[
      {day:1,type:"training",icon:"🏆",title:"Final Benchmark — Session 1",task:"Squat 5RM and Push-Up max. Beat your Week 14 numbers. Every rep counts.",tip:{cat:"Training",text:"Peak strength after a taper is typically 3-8% above training max. The hard work is already done."},xp:60},
      {day:2,type:"mindset",icon:"🎉",title:"Acknowledge Progress",task:"Pull up Week 1 data. Write the side-by-side comparison: weight, push-ups, steps, energy. Feel it.",tip:{cat:"Mindset",text:"Conscious acknowledgement of progress significantly increases the motivational value of achievement."},xp:20},
      {day:3,type:"training",icon:"🏋️",title:"Final Benchmark — Session 2",task:"Row max weight, plank max time. Beat every previous record.",tip:{cat:"Training",text:"16 weeks of consistent training produces on average 15-25% strength increase."},xp:60},
      {day:4,type:"nutrition",icon:"📋",title:"Write Your 3 Anchors",task:"Write 3 permanent nutrition habits you will keep no matter what changes. Simple and non-negotiable.",tip:{cat:"Nutrition",text:"Three anchor habits — protein at every meal, vegetables daily, hydration — maintain 80% of results indefinitely."},xp:25},
      {day:5,type:"training",icon:"🏃",title:"Final Cardio Benchmark",task:"20-min run or brisk walk. Cover as much distance as possible. Beat Week 9. Record it.",tip:{cat:"Training",text:"16 weeks training improves VO2 max by 7-15% — a meaningful longevity marker."},xp:40},
      {day:6,type:"mindset",icon:"✉️",title:"Letter to Future Self",task:"Write a letter to yourself 6 months from now. What do you want that version of you to have kept?",tip:{cat:"Mindset",text:"Letters to future self increase healthy behaviour maintenance by 34% when read 6 months later."},xp:25},
      {day:7,type:"rest",icon:"🌟",title:"16 Weeks — Done",task:"Today: nothing. No training, no metrics, no goals. Just live in your body and appreciate what it is now capable of. You did it.",tip:{cat:"Mindset",text:"You are no longer someone trying to be healthy. You are someone who is."},xp:80},
    ]},
];

export { PROGRAM };

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

// Get week data (1-indexed) — defensive
export function getWeek(weekNum) {
  const idx = Math.max(0, Math.min(15, (parseInt(weekNum) || 1) - 1));
  return PROGRAM[idx] || PROGRAM[0];
}

// Get today's day data based on joinedAt
export function getTodayData(profile) {
  const globalDay = getUserGlobalDay(profile);
  if (globalDay === 0) {
    // Day 0: show Day 1 as a preview
    return { week: PROGRAM[0], day: PROGRAM[0].days[0], isDay0: true };
  }
  const weekIdx = Math.min(15, Math.floor((globalDay - 1) / 7));
  const dayIdx = (globalDay - 1) % 7;
  const week = PROGRAM[weekIdx] || PROGRAM[0];
  const day = week.days[dayIdx] || week.days[0];
  return { week, day, isDay0: false };
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
