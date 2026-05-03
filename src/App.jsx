import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { createTranslator, LANGUAGES } from "./lang.js";

// ─── PWA HELPERS ──────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// Register service worker once on app load
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// ─── GLOBAL LANG HELPER ───────────────────────────────────────────────────────
// Any component can call t(key) without prop drilling
function getLang() { return localStorage.getItem("form16_lang") || "ru"; }
function t(key, vars = {}) { return createTranslator(getLang())(key, vars); }

// ─── INLINE LANGUAGE PICKER ───────────────────────────────────────────────────
const CL = { bg:"#07090F",card:"#111520",border:"#1C2333",accent:"#C8F135",text:"#EEF2F7",muted:"#6B7A99" };

function LanguagePicker({ onPick }) {
  const [selected, setSelected] = useState("ru");
  return (
    <div style={{position:"fixed",inset:0,background:CL.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"32px 28px",fontFamily:"'DM Sans',sans-serif",zIndex:9999}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap');`}</style>
      <div style={{textAlign:"center",marginBottom:48}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:CL.card,border:`1px solid ${CL.border}`,borderRadius:14,padding:"10px 18px",marginBottom:28}}>
          <div style={{width:28,height:28,borderRadius:8,background:CL.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:CL.text,letterSpacing:1}}>FORM16</span>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:CL.text,marginBottom:10}}>
          {selected==="ru"?"Выберите язык":"Choose your language"}
        </div>
        <div style={{fontSize:14,color:CL.muted}}>
          {selected==="ru"?"Вы можете изменить это в профиле":"You can change this later in your profile"}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:40}}>
        {LANGUAGES.map(l=>(
          <div key={l.code} onClick={()=>setSelected(l.code)} style={{background:selected===l.code?`${CL.accent}18`:CL.card,border:`2px solid ${selected===l.code?CL.accent:CL.border}`,borderRadius:20,padding:"20px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:18,transition:"all 0.18s"}}>
            <span style={{fontSize:36}}>{l.flag}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:18,color:selected===l.code?CL.accent:CL.text}}>{l.label}</div>
              <div style={{fontSize:13,color:CL.muted,marginTop:3}}>{l.code==="en"?"English":"Русский язык"}</div>
            </div>
            {selected===l.code&&<div style={{width:28,height:28,borderRadius:"50%",background:CL.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:CL.bg,fontWeight:800}}>✓</span></div>}
          </div>
        ))}
      </div>
      <button onClick={()=>onPick(selected)} style={{width:"100%",background:CL.accent,color:CL.bg,border:"none",borderRadius:18,padding:"17px",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
        {selected==="ru"?"Продолжить":"Continue"}
      </button>
    </div>
  );
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:"#07090F",surface:"#0D1017",card:"#111520",border:"#1C2333",
  accent:"#C8F135",accentDim:"#C8F13518",
  orange:"#FF6B35",orangeDim:"#FF6B3518",
  blue:"#3B8BEB",blueDim:"#3B8BEB18",
  purple:"#9B6DFF",purpleDim:"#9B6DFF18",
  red:"#FF4757",redDim:"#FF475718",
  green:"#2ECC71",greenDim:"#2ECC7118",
  yellow:"#F59E0B",yellowDim:"#F59E0B18",
  text:"#EEF2F7",muted:"#6B7A99",dim:"#1E2B3C",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate  = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const pct      = (v,mx) => Math.min(100,Math.round(((v||0)/mx)*100));
function calcBMI(w,h){return (w/((h/100)**2)).toFixed(1);}
function calcBFP(w,h,waist,neck,gender,thigh){
  if(!waist||!neck||!h)return"—";
  try{
    if(gender==="male")return Math.max(2,495/(1.0324-0.19077*Math.log10(waist-neck)+0.15456*Math.log10(h))-450).toFixed(1);
    const hip=thigh?thigh*1.6:waist*1.1;
    return Math.max(8,495/(1.29579-0.35004*Math.log10(waist+hip-neck)+0.22100*Math.log10(h))-450).toFixed(1);
  }catch{return"—";}
}
function calcTDEE(w,h,age,gender,activity){
  if(!w||!h||!age)return 0;
  const bmr=gender==="male"?10*w+6.25*h-5*age+5:10*w+6.25*h-5*age-161;
  return Math.round(bmr*({sedentary:1.2,light:1.375,moderate:1.55,active:1.725,veryActive:1.9}[activity]||1.55));
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── 16-WEEK PROGRAM DATA ────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
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

// ─── PROGRAM HELPERS ─────────────────────────────────────────────────────────
// ── Day calculation based on joinedAt — NOT day of week ──────────────────────
function getUserGlobalDay(profile) {
  // Returns 0 on signup day, 1 the next day, etc.
  if (!profile?.joinedAt) return 0;
  const joined = new Date(profile.joinedAt);
  const today = new Date();
  joined.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  return Math.max(0, Math.floor((today - joined) / 86400000));
}

// Get week data (1-indexed) — defensive
function getWeek(weekNum) {
  const idx = Math.max(0, Math.min(15, (parseInt(weekNum) || 1) - 1));
  return PROGRAM[idx] || PROGRAM[0];
}

// Get today's day data based on joinedAt
function getTodayData(profile) {
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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
function makeLogs(bw, bc, days) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate()-(days-1-i));
    return { date:d.toISOString().split("T")[0], weight:+(bw-i*0.07+(Math.random()-0.5)*0.35).toFixed(1), calories:Math.round(bc+(Math.random()-0.5)*380), protein:Math.round(130+Math.random()*55), steps:Math.round(5800+Math.random()*7200), fromFatSecret:Math.random()>0.45 };
  });
}
const MOCK_ATHLETES = [
  { id:"a1",name:"Alex Chen",avatar:"🧑‍💻",age:28,height:178,weight:84.5,waist:89,neck:38,thigh:null,gender:"male",goal:"fat_loss",targetWeight:null,activity:"moderate",stress:3,sleep:3,dietQuality:3,training:"3plus_week",trainingExp:"intermediate",currentWeek:3,streak:5,totalXP:380,fatsecretConnected:true,joinedAt:"2026-01-15",bfp:19.4,bmi:26.7,tdee:2540,dailyTargets:{calories:2100,protein:152,steps:10000},logs:makeLogs(84.5,2050,18),notes:"Struggling with evening snacking.",foodLog:[] },
  { id:"a2",name:"Sarah Kim",avatar:"👩‍🎨",age:32,height:165,weight:58,waist:72,neck:32,thigh:56,gender:"female",goal:"recomp",targetWeight:null,activity:"active",stress:1,sleep:1,dietQuality:1,training:"3plus_week",trainingExp:"advanced",currentWeek:8,streak:12,totalXP:820,fatsecretConnected:false,joinedAt:"2025-12-20",bfp:22.1,bmi:21.3,tdee:2610,dailyTargets:{calories:2450,protein:190,steps:8000},logs:makeLogs(58,2400,28),notes:"Excellent consistency.",foodLog:[] },
  { id:"a3",name:"Marco R.",avatar:"🧔",age:41,height:182,weight:91,waist:97,neck:41,thigh:null,gender:"male",goal:"fat_loss",targetWeight:null,activity:"light",stress:5,sleep:4,dietQuality:3,training:"1_2x_week",trainingExp:"beginner",currentWeek:1,streak:2,totalXP:90,fatsecretConnected:true,joinedAt:"2026-03-28",bfp:26.8,bmi:27.5,tdee:2280,dailyTargets:{calories:2300,protein:164,steps:12000},logs:makeLogs(91,2280,7),notes:"New client.",foodLog:[] },
];

// ─── FatSecret LAYER (same as v7, simplified) ─────────────────────────────────
const FS_CONFIG = { CLIENT_ID:"YOUR_FATSECRET_CLIENT_ID", CLIENT_SECRET:"YOUR_FATSECRET_CLIENT_SECRET" };
const IS_DEMO = FS_CONFIG.CLIENT_ID === "YOUR_FATSECRET_CLIENT_ID";
const FS = {
  searchFoods: async q => {
    await new Promise(r=>setTimeout(r,500));
    const db=[{food_id:"1",name:"Chicken Breast (grilled)",brand:null,calories:165,protein:31,carbs:0,fat:3.6},{food_id:"2",name:"Oatmeal (cooked)",brand:null,calories:68,protein:2.4,carbs:12,fat:1.4},{food_id:"3",name:"Brown Rice",brand:null,calories:112,protein:2.6,carbs:23,fat:0.9},{food_id:"4",name:"Greek Yogurt (0% fat)",brand:"Chobani",calories:59,protein:10,carbs:3.6,fat:0.4},{food_id:"5",name:"Banana",brand:null,calories:89,protein:1.1,carbs:23,fat:0.3},{food_id:"6",name:"Broccoli (steamed)",brand:null,calories:35,protein:2.4,carbs:7,fat:0.4},{food_id:"7",name:"Scrambled Eggs",brand:null,calories:148,protein:10,carbs:1.6,fat:11},{food_id:"8",name:"Salmon (baked)",brand:null,calories:208,protein:28,carbs:0,fat:10},{food_id:"9",name:"Sweet Potato",brand:null,calories:86,protein:1.6,carbs:20,fat:0.1},{food_id:"10",name:"Almonds",brand:null,calories:579,protein:21,carbs:22,fat:50},{food_id:"11",name:"Whey Protein Shake",brand:"ON Gold Standard",calories:120,protein:24,carbs:3,fat:1.5},{food_id:"12",name:"Cottage Cheese (low-fat)",brand:null,calories:72,protein:12,carbs:3,fat:1}];
    const lq=q.toLowerCase();
    return db.filter(f=>f.name.toLowerCase().includes(lq)||(f.brand||"").toLowerCase().includes(lq));
  },
  fetchDiaryTotals: async () => {
    await new Promise(r=>setTimeout(r,1200));
    return { calories:Math.round(1700+Math.random()*700), protein:Math.round(100+Math.random()*90), carbs:Math.round(160+Math.random()*100), fat:Math.round(45+Math.random()*40), source:"FatSecret"+(IS_DEMO?" (demo)":""), foodsLogged:Math.floor(3+Math.random()*5) };
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── SHARED UI ────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
function ProgressDots({total,current}){
  return <div style={{display:"flex",gap:6,justifyContent:"center"}}>{Array.from({length:total},(_,i)=><div key={i} style={{height:4,width:i===current?28:8,borderRadius:2,background:i===current?C.accent:i<current?C.accent+"55":C.dim,transition:"all 0.35s cubic-bezier(.16,1,.3,1)"}}/>)}</div>;
}
function TextInput({label,value,onChange,type="text",placeholder}){
  const [f,sf]=useState(false);
  return <div style={{marginBottom:18}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>{label}</div>}<div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:14,border:`1.5px solid ${f?C.accent:C.border}`,transition:"border-color 0.2s",overflow:"hidden"}}><input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{flex:1,background:"none",border:"none",outline:"none",padding:"14px 16px",color:C.text,fontSize:15,fontFamily:"'DM Sans',sans-serif"}}/></div></div>;
}
function NumberInput({label,value,onChange,unit,placeholder,hint,step="0.1"}){
  const [f,sf]=useState(false);
  return <div style={{marginBottom:18}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>{label}</div>}<div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:14,border:`1.5px solid ${f?C.accent:C.border}`,transition:"border-color 0.2s",overflow:"hidden"}}><input type="number" value={value} placeholder={placeholder} step={step} onChange={e=>onChange(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{flex:1,background:"none",border:"none",outline:"none",padding:"14px 16px",color:C.text,fontSize:16,fontFamily:"'DM Sans',sans-serif"}}/>{unit&&<div style={{padding:"0 14px 0 0",color:C.muted,fontSize:13,fontWeight:600,flexShrink:0}}>{unit}</div>}</div>{hint&&<div style={{fontSize:12,color:C.muted,marginTop:6,paddingLeft:2}}>{hint}</div>}</div>;
}
function PillSelect({label,value,onChange,options}){
  return <div style={{marginBottom:20}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>{label}</div>}<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{options.map(o=><div key={o.value} onClick={()=>onChange(o.value)} style={{padding:"10px 16px",borderRadius:22,cursor:"pointer",background:value===o.value?C.accent:C.card,border:`1.5px solid ${value===o.value?C.accent:C.border}`,color:value===o.value?C.bg:C.muted,fontSize:13,fontWeight:600,transition:"all 0.15s"}}>{o.label}</div>)}</div></div>;
}
function CardSelect({label,value,onChange,options}){
  return <div style={{marginBottom:22}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>{label}</div>}<div style={{display:"flex",flexDirection:"column",gap:10}}>{options.map(o=>{const sel=value===o.value;return <div key={o.value} onClick={()=>onChange(o.value)} style={{background:sel?C.accentDim:C.card,border:`1.5px solid ${sel?C.accent:C.border}`,borderRadius:18,padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:14,transition:"all 0.18s"}}><div style={{width:42,height:42,borderRadius:13,flexShrink:0,background:sel?C.accent+"33":C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{o.icon}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:sel?C.accent:C.text,marginBottom:3}}>{o.label}</div>{o.desc&&<div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>{o.desc}</div>}</div>{sel&&<div style={{width:22,height:22,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><span style={{fontSize:12,color:C.bg,fontWeight:800}}>✓</span></div>}</div>;})}</div></div>;
}
function ScaleSelect({label,value,onChange,icons,low,high}){
  return <div style={{marginBottom:22}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>{label}</div>}<div style={{display:"flex",gap:8}}>{icons.map((ic,i)=>{const v=i+1,sel=value===v;return <div key={v} onClick={()=>onChange(v)} style={{flex:1,background:sel?C.accentDim:C.card,border:`1.5px solid ${sel?C.accent:C.border}`,borderRadius:16,padding:"12px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.15s"}}><span style={{fontSize:22}}>{ic}</span>{sel&&<div style={{width:6,height:6,borderRadius:"50%",background:C.accent}}/>}</div>})}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:11,color:C.muted}}>{low}</span><span style={{fontSize:11,color:C.muted}}>{high}</span></div></div>;
}
function MetricBar({label,value,target,unit,color,icon}){
  const p=pct(value,target);
  return <div style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:C.muted,display:"flex",gap:5,alignItems:"center"}}><span>{icon}</span>{label}</span><span style={{fontSize:13,fontWeight:700,color:p>=100?color:C.text}}>{value??'—'} <span style={{color:C.muted,fontWeight:400}}>/ {target} {unit}</span></span></div><div style={{height:5,borderRadius:3,background:C.dim,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,borderRadius:3,background:`${color}CC`,transition:"width 0.9s cubic-bezier(.16,1,.3,1)"}}/></div></div>;
}
function WeightChart({logs,compact}){
  if(!logs||logs.length<2)return <div style={{textAlign:"center",padding:"18px 0",color:C.muted,fontSize:13}}>Log more days to see your trend</div>;
  const weights=logs.map(l=>l.weight);
  const mn=Math.min(...weights)-0.8,mx=Math.max(...weights)+0.8;
  const H=compact?80:110,W=340;
  const px=i=>(i/(weights.length-1))*(W-24)+12;
  const py=v=>H-14-((v-mn)/(mx-mn))*(H-28);
  const pts=weights.map((w,i)=>`${px(i)},${py(w)}`).join(" ");
  const area=`M${px(0)},${py(weights[0])} `+weights.map((w,i)=>`L${px(i)},${py(w)}`).join(" ")+` L${px(weights.length-1)},${H} L${px(0)},${H} Z`;
  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity="0.2"/><stop offset="100%" stopColor={C.accent} stopOpacity="0"/></linearGradient></defs><path d={area} fill="url(#wg)"/><polyline points={pts} fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/><circle cx={px(weights.length-1)} cy={py(weights.at(-1))} r={5} fill={C.accent}/>{!compact&&<><text x={12} y={H+12} fontSize={10} fill={C.muted}>{fmtDate(logs[0].date)}</text><text x={W-12} y={H+12} fontSize={10} fill={C.muted} textAnchor="end">{fmtDate(logs.at(-1).date)}</text></>}</svg>;
}
function Btn({children,onClick,variant="primary",disabled,small}){
  return <button onClick={onClick} disabled={disabled} style={{width:small?"auto":"100%",border:"none",borderRadius:small?20:16,padding:small?"9px 18px":"16px 24px",fontSize:small?13:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:disabled?"default":"pointer",background:variant==="primary"?(disabled?C.dim:C.accent):variant==="ghost"?"transparent":variant==="danger"?C.red:C.card,color:variant==="primary"?(disabled?C.muted:C.bg):variant==="danger"?"#fff":variant==="ghost"?C.muted:C.text,border:variant==="outline"?`1.5px solid ${C.border}`:"none",opacity:disabled?0.55:1,transition:"all 0.15s"}}>{children}</button>;
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── DAY DETAIL MODAL ────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
function DayDetailModal({ weekData, day, onClose }) {
  const col = {training:C.orange,nutrition:C.accent,mindset:C.purple,rest:C.muted,active_recovery:C.blue}[day.type]||C.accent;

  return (
    <div style={{position:"fixed",inset:0,background:"#000000EE",zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:"26px 26px 0 0",maxHeight:"92vh",display:"flex",flexDirection:"column",animation:"slideUp 0.35s cubic-bezier(.16,1,.3,1) both"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"14px auto 0",flexShrink:0}}/>

        {/* Header */}
        <div style={{padding:"16px 22px 0",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,borderRadius:15,background:`${col}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{day.icon}</div>
            <div>
              <div style={{fontSize:10,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>
                Неделя {weekData.week} · День {day.day}
              </div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800}}>{day.title}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:C.card,border:"none",color:C.muted,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 22px 40px"}}>

          {/* Task */}
          <div style={{background:`${col}14`,border:`1px solid ${col}33`,borderRadius:16,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontSize:11,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>🎯 Задание дня</div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.7}}>{day.task}</div>
          </div>

          {/* Extended info blocks */}
          {day.info?.why&&(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",marginBottom:12}}>
              <div style={{fontSize:11,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>📖 Почему это важно</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.85,whiteSpace:"pre-line"}}>{day.info.why}</div>
            </div>
          )}

          {day.info?.howTo&&(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",marginBottom:12}}>
              <div style={{fontSize:11,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>✅ Как это делать</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.85,whiteSpace:"pre-line"}}>{day.info.howTo}</div>
            </div>
          )}

          {day.info?.weekTarget&&(
            <div style={{background:`${col}10`,border:`1px solid ${col}33`,borderRadius:16,padding:"14px 16px",marginBottom:12}}>
              <div style={{fontSize:11,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>🎯 Цель</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.8,whiteSpace:"pre-line"}}>{day.info.weekTarget}</div>
            </div>
          )}

          {/* Tip */}
          <div style={{background:C.accentDim,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"12px 14px"}}>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.65}}>
              <b style={{color:C.accent}}>{day.tip.cat}:</b> {day.tip.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── LOG DAY MODAL ────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
function LogModal({profile,onSave,onClose}){
  const [vals,setVals]=useState({weight:"",calories:"",protein:"",steps:"",waist:"",neck:"",hips:""});
  const [fsSyncing,setFsSyncing]=useState(false);
  const [fsSynced,setFsSynced]=useState(false);
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));

  // Is today a measurement day? Day 8 (start of week 2) then every 7 days
  const userGlobalDay = getUserGlobalDay(profile);
  const isMeasureDay = userGlobalDay >= 8 && (userGlobalDay - 8) % 7 === 0;
  const isMeasureReminder = userGlobalDay >= 7 && (userGlobalDay - 7) % 7 === 0 && !isMeasureDay;
  useEffect(()=>{
    if(profile.fsSyncData&&profile.fsSyncedAt){
      const sd=new Date(profile.fsSyncedAt).toISOString().split("T")[0];
      if(sd===todayStr()){setVals(p=>({...p,calories:String(profile.fsSyncData.calories),protein:String(profile.fsSyncData.protein)}));setFsSynced(true);}
    }
  },[]);
  async function syncFS(){
    setFsSyncing(true);
    try{const d=await FS.fetchDiaryTotals();if(d)setVals(p=>({...p,calories:String(d.calories),protein:String(d.protein)}));setFsSynced(true);}catch{}
    setFsSyncing(false);
  }
  function handleSave(){
    onSave({date:todayStr(),fromFatSecret:fsSynced,weight:parseFloat(vals.weight)||profile.weight,calories:parseInt(vals.calories)||0,protein:parseInt(vals.protein)||0,steps:parseInt(vals.steps)||0,waist:vals.waist?parseFloat(vals.waist):undefined,neck:vals.neck?parseFloat(vals.neck):undefined,hips:vals.hips?parseFloat(vals.hips):undefined});
    onClose();
  }
  const fields=[{key:"weight",label:t("log.weight"),unit:t("unit.kg"),icon:"⚖️",ph:t("log.weight.ph"),color:C.blue},{key:"calories",label:t("log.calories"),unit:t("unit.kcal"),icon:"🔥",ph:t("log.calories.ph"),color:C.orange},{key:"protein",label:t("log.protein"),unit:t("unit.g"),icon:"🥩",ph:t("log.protein.ph"),color:C.purple},{key:"steps",label:t("log.steps"),unit:t("unit.steps"),icon:"👟",ph:t("log.steps.ph"),color:C.accent}];
  return (
    <div style={{position:"fixed",inset:0,background:"#000000CC",zIndex:500,display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",background:C.surface,borderRadius:"26px 26px 0 0",padding:"22px 22px 48px",maxHeight:"90vh",overflowY:"auto",animation:"slideUp 0.35s cubic-bezier(.16,1,.3,1) both"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800}}>{t("log.title")}</div>
          {profile.fatsecretConnected&&<button onClick={syncFS} disabled={fsSyncing} style={{background:fsSynced?C.accentDim:C.accent,color:fsSynced?C.accent:C.bg,border:fsSynced?`1px solid ${C.accent}44`:"none",borderRadius:20,padding:"8px 16px",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>{fsSyncing?t("log.syncing"):fsSynced?t("log.synced"):t("log.sync")}</button>}
        </div>
        {fsSynced&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:12,padding:"9px 14px",marginBottom:16,fontSize:12,color:C.accent}}>{t("log.synced.note")}</div>}

        {/* Measurement reminder banner */}
        {isMeasureReminder&&<div style={{background:C.yellowDim,border:`1px solid ${C.yellow}44`,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.muted,lineHeight:1.6}}>
          📏 <b style={{color:C.yellow}}>Завтра день замеров!</b> Подготовьте сантиметровую ленту — завтра нужно измерить талию, шею и бёдра.
        </div>}

        {fields.map(field=>(
          <div key={field.key} style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.9,marginBottom:7,display:"flex",gap:6,alignItems:"center"}}><span>{field.icon}</span>{field.label}</div>
            <div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:13,border:`1.5px solid ${C.border}`,overflow:"hidden",transition:"border-color 0.2s"}} onFocusCapture={e=>e.currentTarget.style.borderColor=field.color} onBlurCapture={e=>e.currentTarget.style.borderColor=C.border}>
              <input type="number" value={vals[field.key]} placeholder={field.ph} onChange={e=>set(field.key,e.target.value)} style={{flex:1,background:"none",border:"none",outline:"none",padding:"13px 15px",color:C.text,fontSize:16,fontFamily:"'DM Sans',sans-serif"}}/>
              <span style={{padding:"0 13px 0 0",color:C.muted,fontSize:12,fontWeight:600}}>{field.unit}</span>
            </div>
          </div>
        ))}

        {/* Measurement fields — shown on measurement days */}
        {isMeasureDay&&(
          <div style={{background:C.purpleDim,border:`1px solid ${C.purple}33`,borderRadius:16,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:12,color:C.purple,fontWeight:700,marginBottom:12}}>📏 День замеров — внесите обмеры тела</div>
            {[{key:"waist",label:t("measure.waist"),ph:t("measure.waist.ph")},{key:"neck",label:t("measure.neck"),ph:t("measure.neck.ph")},{key:"hips",label:"Бёдра",ph:"напр. 96"}].map(mf=>(
              <div key={mf.key} style={{marginBottom:10}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.9,marginBottom:6}}>{mf.label}</div>
                <div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:12,border:`1.5px solid ${C.border}`,overflow:"hidden"}} onFocusCapture={e=>e.currentTarget.style.borderColor=C.purple} onBlurCapture={e=>e.currentTarget.style.borderColor=C.border}>
                  <input type="number" value={vals[mf.key]} placeholder={mf.ph} onChange={e=>set(mf.key,e.target.value)} step="0.5" style={{flex:1,background:"none",border:"none",outline:"none",padding:"11px 14px",color:C.text,fontSize:15,fontFamily:"'DM Sans',sans-serif"}}/>
                  <span style={{padding:"0 12px 0 0",color:C.muted,fontSize:12,fontWeight:600}}>см</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSave} style={{width:"100%",background:C.accent,color:C.bg,border:"none",borderRadius:15,padding:"15px",fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",marginTop:10}}>{t("log.save")}</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── MEMBER DASHBOARD ─────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
function MemberDashboard({profile,setProfile,saveLog,onSignOut,onBack}){
  const [tab,setTab]=useState("today");
  const [showLog,setShowLog]=useState(false);
  const [selectedDay,setSelectedDay]=useState(null); // {weekData, day}

  const lastLog=profile.logs.at(-1);
  const todayLog=profile.logs.find(l=>l.date===todayStr());
  const currentWeight=lastLog?.weight||profile.weight;
  const weightDiff=+(currentWeight-profile.weight).toFixed(1);
  const weekLogs=profile.logs.slice(-7);
  const currentBFP=profile.bfp||"—";

  // ── WIRED: get today's task & tip from the program JSON ──
  const userGlobalDay = getUserGlobalDay(profile);
  const currentWeekNum = Math.max(1, Math.min(16, Math.ceil((userGlobalDay) / 7) || 1));
  const { week: currentWeekData, day: todayDayData, isDay0 } = getTodayData(profile) || { week: PROGRAM[0], day: PROGRAM[0].days[0], isDay0: true };
  const fsSyncData=profile.fsSyncData;
  const nutritionSource=fsSyncData&&profile.fsSyncedAt&&new Date(profile.fsSyncedAt).toISOString().split("T")[0]===todayStr()?fsSyncData:todayLog;

  function handleSaveLog(log){
    if(saveLog) saveLog(log);
    else setProfile(p=>({...p,logs:[...(p.logs||[]).filter(l=>l.date!==log.date),log],streak:p.streak+1,totalXP:p.totalXP+20}));
  }

  const TABS=[{id:"today",icon:"📊",label:t("tab.today")},{id:"program",icon:"🗓",label:t("tab.program")},{id:"progress",icon:"📈",label:t("tab.progress")},{id:"profile",icon:"👤",label:t("tab.profile")}];

  const taskTypeColor = {training:C.orange,nutrition:C.accent,mindset:C.purple,rest:C.muted}[todayDayData?.type]||C.orange;

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:88}}>
      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"48px 20px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {onBack&&<button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,padding:0,marginRight:2}}>←</button>}
          <div style={{width:44,height:44,borderRadius:14,background:C.accentDim,border:`1.5px solid ${C.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{profile.avatar}</div>
          <div style={{flex:1}}><div style={{fontSize:12,color:C.muted}}>{t("header.welcome")}</div><div style={{fontWeight:700,fontSize:16}}>{profile.name}</div></div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:C.orange}}>🔥{profile.streak}</div><div style={{fontSize:10,color:C.muted}}>{t("header.streak")}</div></div>
            {onSignOut&&<button onClick={onSignOut} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,padding:"5px 10px",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>{t("header.signout")}</button>}
          </div>
        </div>
        <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,height:5,background:C.dim,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(90deg,${C.accent},#00D2FF)`,width:`${((profile.currentWeek-1)/16)*100}%`,borderRadius:3}}/></div>
          <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>Week {profile.currentWeek}/16 — {currentWeekData.theme}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
        {TABS.map(tb=><button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"12px 4px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===tb.id?C.accent:C.muted,borderBottom:`2px solid ${tab===tb.id?C.accent:"transparent"}`,fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:0.4,transition:"color 0.18s"}}><span style={{fontSize:18}}>{tb.icon}</span>{tb.label}</button>)}
      </div>

      {/* ── TODAY ── */}
      {tab==="today"&&(
        <div style={{padding:"18px",animation:"slideUp 0.28s both"}}>

          {/* Header — always shown */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:21,fontWeight:800}}>{new Date().toLocaleDateString("ru-RU",{weekday:"long"})}</div>
              <div style={{fontSize:12,color:C.muted}}>{new Date().toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}</div>
            </div>
            <button onClick={()=>setShowLog(true)} style={{background:todayLog?C.accentDim:C.accent,color:todayLog?C.accent:C.bg,border:todayLog?`1.5px solid ${C.accent}55`:"none",borderRadius:22,padding:"9px 18px",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>{todayLog?t("today.logged"):t("today.log")}</button>
          </div>

          {/* ── DAY 0 FULL TAKEOVER ── */}
          {isDay0 ? (
            <div style={{animation:"fadeIn 0.3s both"}}>

              {/* Progress bar: 0 of 112 */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"14px 18px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:13,fontWeight:700}}>День 0 из 112</div>
                  <div style={{fontSize:11,color:C.blue,background:C.blueDim,padding:"3px 10px",borderRadius:20,fontWeight:700}}>Старт завтра</div>
                </div>
                <div style={{height:6,background:C.dim,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:"1%",background:C.blue,borderRadius:3}}/>
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:8}}>16 недель · 112 дней · программа начинается завтра в 07:00</div>
              </div>

              {/* Setup checklist — carried from Day 0 screen */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,marginBottom:14,overflow:"hidden"}}>
                <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:700}}>Настройка</div>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700}}>
                    {[
                      true, // profile always done
                      "Notification" in window && Notification.permission==="granted",
                      false, // home screen — can't detect
                    ].filter(Boolean).length} / 3
                  </div>
                </div>
                {[
                  {icon:"📋",label:"Профиль заполнен",done:true},
                  {icon:"🔔",label:"Уведомления",done:"Notification" in window && Notification.permission==="granted"},
                  {icon:"📲",label:"Добавлено на главный экран",done:false},
                ].map((item,i,arr)=>(
                  <div key={item.label} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,background:item.done?C.accent:C.dim,color:item.done?C.bg:C.muted}}>
                      {item.done?"✓":""}
                    </div>
                    <div style={{fontSize:14,flexShrink:0}}>{item.icon}</div>
                    <div style={{fontSize:13,color:item.done?C.muted:C.text,textDecoration:item.done?"line-through":"none"}}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Day 0 single task */}
              <div style={{background:C.blueDim,border:`1.5px solid ${C.blue}44`,borderRadius:18,padding:"16px 18px",marginBottom:14}}>
                <div style={{fontSize:11,color:C.blue,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Задача дня 0</div>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <div style={{width:48,height:48,borderRadius:15,background:`${C.blue}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🍽️</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Запиши первый приём пищи</div>
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Даже один перекус считается. Нажми «+ Записать день» выше и добавь калории.</div>
                  </div>
                  {todayLog&&<div style={{fontSize:20,flexShrink:0}}>✅</div>}
                </div>
              </div>

              {/* Tomorrow preview */}
              <div style={{background:C.card,border:`1.5px solid ${C.accent}44`,borderRadius:18,overflow:"hidden"}}>
                <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Завтра — День 1</div>
                  <div style={{fontSize:12,color:C.muted}}>Вот что тебя ждёт</div>
                </div>
                {[
                  {time:"07:00",icon:"⚖️",col:C.accent,label:"Встань на весы",sub:"После туалета, до завтрака"},
                  {time:"Днём",icon:"🍽️",col:C.blue,label:"Записывай еду",sub:"Каждый приём пищи сразу после еды"},
                  {time:"21:00",icon:"🌙",col:C.purple,label:"Итог дня",sub:"Напомним проверить и дозаписать питание"},
                ].map((item,i,arr)=>(
                  <div key={item.time} style={{display:"flex",gap:14,padding:"12px 18px",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",alignItems:"center"}}>
                    <div style={{width:38,textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:10,color:item.col,fontWeight:700,marginBottom:5}}>{item.time}</div>
                      <div style={{width:34,height:34,borderRadius:10,background:`${item.col}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,margin:"0 auto"}}>{item.icon}</div>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{item.label}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          ) : (
            /* ── NORMAL DAY 1+ CONTENT ── */
            <>
              {/* ── WEEKLY SCROLL BAR ── */}
              {(()=>{
                const globalDay = getUserGlobalDay(profile);
                const dayInWeek = globalDay === 0 ? 0 : ((globalDay - 1) % 7) + 1;
                return (
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>
                      Неделя {currentWeekNum} — {currentWeekData.theme}
                    </div>
                    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
                      {currentWeekData.days.map(day=>{
                        const isDone = day.day < dayInWeek;
                        const isToday = day.day === dayInWeek;
                        const isFuture = day.day > dayInWeek;
                        const col = {training:C.orange,nutrition:C.accent,mindset:C.purple,rest:C.muted}[day.type]||C.muted;
                        return (
                          <div key={day.day} style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>setSelectedDay({weekData:currentWeekData,day})}>
                            <div style={{width:44,height:44,borderRadius:14,background:isToday?col:isDone?`${col}33`:C.card,border:`2px solid ${isToday?col:isDone?`${col}55`:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isToday?20:16,opacity:isFuture?0.4:1,transition:"all 0.15s"}}>
                              {isDone?"✓":day.icon}
                            </div>
                            <div style={{fontSize:10,color:isToday?col:C.muted,fontWeight:isToday?700:400,textAlign:"center",maxWidth:44,lineHeight:1.3,opacity:isFuture?0.4:1}}>
                              {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][day.day-1]}
                            </div>
                            {isToday&&<div style={{width:6,height:6,borderRadius:"50%",background:col}}/>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Today's task card */}
              {todayDayData && (
                <div style={{background:`${taskTypeColor}18`,border:`1px solid ${taskTypeColor}44`,borderRadius:22,padding:"18px 20px",marginBottom:14}}>
                  <div style={{fontSize:11,color:taskTypeColor,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>
                    🎯 День {todayDayData.day} · {todayDayData.type}
                  </div>
                  <div style={{display:"flex",gap:13,alignItems:"flex-start"}}>
                    <div style={{width:52,height:52,borderRadius:16,background:`${taskTypeColor}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{todayDayData.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{todayDayData.title}</div>
                      <div style={{fontSize:13,color:C.muted,lineHeight:1.65}}>{todayDayData.task}</div>
                      <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
                        <button onClick={()=>setSelectedDay({weekData:currentWeekData,day:todayDayData})} style={{fontSize:11,color:taskTypeColor,background:`${taskTypeColor}18`,border:"none",borderRadius:20,padding:"4px 12px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>Детали →</button>
                      </div>
                    </div>
                  </div>

                  {/* Extended info blocks */}
                  {todayDayData.info&&(
                    <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>
                      {todayDayData.info.why&&(
                        <div style={{background:C.surface,borderRadius:14,padding:"14px 16px"}}>
                          <div style={{fontSize:11,color:taskTypeColor,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>📖 Почему это важно</div>
                          <div style={{fontSize:12,color:C.muted,lineHeight:1.8,whiteSpace:"pre-line"}}>{todayDayData.info.why}</div>
                        </div>
                      )}
                      {todayDayData.info.howTo&&(
                        <div style={{background:C.surface,borderRadius:14,padding:"14px 16px"}}>
                          <div style={{fontSize:11,color:taskTypeColor,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>✅ Как это делать</div>
                          <div style={{fontSize:12,color:C.muted,lineHeight:1.8,whiteSpace:"pre-line"}}>{todayDayData.info.howTo}</div>
                        </div>
                      )}
                      {todayDayData.info.weekTarget&&(
                        <div style={{background:`${taskTypeColor}10`,border:`1px solid ${taskTypeColor}33`,borderRadius:14,padding:"12px 14px"}}>
                          <div style={{fontSize:12,color:C.muted,lineHeight:1.7,whiteSpace:"pre-line"}}><b style={{color:taskTypeColor}}>🎯 </b>{todayDayData.info.weekTarget}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Weekly stats — Day 8 */}
                  {todayDayData.isWeeklyStats&&profile.logs.length>0&&(()=>{
                    const weekLogs7 = profile.logs.slice(-7);
                    const avgCal = weekLogs7.length?Math.round(weekLogs7.reduce((s,l)=>s+(l.calories||0),0)/weekLogs7.length):0;
                    const avgProt = weekLogs7.length?Math.round(weekLogs7.reduce((s,l)=>s+(l.protein||0),0)/weekLogs7.length):0;
                    const avgSteps = weekLogs7.length?Math.round(weekLogs7.reduce((s,l)=>s+(l.steps||0),0)/weekLogs7.length):0;
                    const avgWeight = weekLogs7.length?+(weekLogs7.reduce((s,l)=>s+(l.weight||0),0)/weekLogs7.length).toFixed(1):profile.weight;
                    const tdee = profile.tdee||2000;
                    const protTarget = profile.dailyTargets?.protein||150;
                    const calDiff = avgCal - tdee;
                    return (
                      <div style={{marginTop:14,background:C.surface,borderRadius:16,padding:"16px 16px"}}>
                        <div style={{fontSize:12,color:C.accent,fontWeight:700,marginBottom:14,textTransform:"uppercase",letterSpacing:0.8}}>📊 Твоя статистика за неделю 1</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                          {[{label:"Ср. вес",val:`${avgWeight} кг`,color:C.blue},{label:"Ср. калории",val:`${avgCal} ккал`,color:C.orange},{label:"Ср. белок",val:`${avgProt} г`,color:C.purple},{label:"Ср. шаги",val:avgSteps.toLocaleString(),color:C.accent}].map(s=>(
                            <div key={s.label} style={{background:C.card,borderRadius:12,padding:"10px 12px"}}>
                              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{s.label}</div>
                              <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:s.color}}>{s.val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:2}}>💡 Рекомендации</div>
                          {avgCal>0&&<div style={{background:C.card,borderRadius:12,padding:"10px 12px",fontSize:12,color:C.muted,lineHeight:1.6}}>🔥 Калории: ты потреблял в среднем <b style={{color:C.orange}}>{avgCal} ккал/день</b>. {calDiff>300?"Это выше нормы. Попробуй уменьшить порции или убрать высококалорийные перекусы.":calDiff<-500?"Это значительно ниже нормы — не голодай.":"Отлично — ты близко к своей норме!"}</div>}
                          {avgProt>0&&<div style={{background:C.card,borderRadius:12,padding:"10px 12px",fontSize:12,color:C.muted,lineHeight:1.6}}>🥩 Белок: <b style={{color:C.purple}}>{avgProt} г/день</b> из {protTarget} г. {avgProt<protTarget*0.7?"Добавь источник белка к каждому приёму пищи.":avgProt<protTarget*0.9?"Почти у цели — добавь 1 белковый перекус.":"Отлично!"}</div>}
                          {avgSteps>0&&<div style={{background:C.card,borderRadius:12,padding:"10px 12px",fontSize:12,color:C.muted,lineHeight:1.6}}>👟 Шаги: <b style={{color:C.accent}}>{avgSteps.toLocaleString()}/день</b>. {avgSteps<5000?"Добавь 20-минутную прогулку после обеда.":avgSteps<8000?"Цель — 8 000 шагов ежедневно.":"Отличная активность!"}</div>}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{marginTop:12,background:C.accentDim,border:`1px solid ${C.accent}22`,borderRadius:11,padding:"9px 13px"}}>
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.65}}><b style={{color:C.accent}}>{todayDayData.tip.cat}:</b> {todayDayData.tip.text}</div>
                  </div>
                </div>
              )}

              {/* Weight + BFP */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"16px"}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:5}}>{t("today.weight")}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,lineHeight:1}}>{currentWeight}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>кг</div>
                  <div style={{fontSize:12,marginTop:8,color:weightDiff<=0?C.accent:C.orange,fontWeight:600}}>{weightDiff>0?"+":""}{weightDiff} кг с начала</div>
                </div>
                <div style={{background:C.purpleDim,border:`1px solid ${C.purple}33`,borderRadius:20,padding:"16px"}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:5}}>{t("today.bodyfat")}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,lineHeight:1,color:C.purple}}>{currentBFP}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>%</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:8}}>{t("today.navy")}</div>
                </div>
              </div>

              {/* Weight trend */}
              {profile.logs.length>1&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"14px 16px",marginBottom:14}}><div style={{fontSize:12,color:C.muted,marginBottom:10}}>{t("today.trend")}</div><WeightChart logs={profile.logs} compact/></div>}

              {/* Metrics */}
              {(todayLog||nutritionSource)?(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,padding:"18px 20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontWeight:700}}>{t("today.metrics")}</div>{nutritionSource?.fromFatSecret&&<span style={{fontSize:11,color:C.accent,background:C.accentDim,padding:"3px 10px",borderRadius:20,fontWeight:700}}>⚡ FatSecret</span>}</div>
                  <MetricBar label={t("metric.calories")} value={nutritionSource?.calories||0} target={profile.dailyTargets?.calories||2000} unit="ккал" color={C.orange} icon="🔥"/>
                  <MetricBar label={t("metric.protein")} value={nutritionSource?.protein||0} target={profile.dailyTargets?.protein||150} unit="г" color={C.purple} icon="🥩"/>
                  <MetricBar label={t("metric.steps")} value={todayLog?.steps||0} target={profile.dailyTargets?.steps||10000} unit="шагов" color={C.accent} icon="👟"/>
                </div>
              ):(
                <div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:22,padding:"24px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{color:C.muted,fontSize:14}}>{t("today.no_log")}</div></div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── PROGRAM — 112 daily cards ── */}
      {tab==="program"&&(
        <div style={{padding:"18px",animation:"slideUp 0.28s both"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>{t("program.title")}</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:18}}>{t("program.tap")}</div>
          {PROGRAM.map(wk=>{
            const weekUnlocked = wk.week <= profile.currentWeek;
            const weekActive = wk.week === profile.currentWeek;
            // Global day number: week 1 day 1 = day 1, week 2 day 1 = day 8, etc.
            return (
              <div key={wk.week} style={{marginBottom:8}}>
                {/* Week header */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,marginTop:wk.week>1?16:0}}>
                  <div style={{width:28,height:28,borderRadius:8,background:`${wk.color}22`,border:`1.5px solid ${wk.color}${weekUnlocked?"88":"33"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:weekUnlocked?wk.color:C.dim,flexShrink:0}}>
                    {wk.week}
                  </div>
                  <div style={{flex:1}}>
                    <span style={{fontSize:13,fontWeight:700,color:weekUnlocked?C.text:C.dim}}>{t(`week.${wk.week}.theme`)}</span>
                    {weekActive&&<span style={{marginLeft:8,fontSize:10,color:wk.color,background:`${wk.color}22`,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{t("program.active")}</span>}
                  </div>
                  {!weekUnlocked&&<span style={{fontSize:14}}>🔒</span>}
                </div>

                {/* Day cards */}
                {wk.days.map(day=>{
                  const globalDay = (wk.week-1)*7 + day.day;
                  const userGlobalDay = getUserGlobalDay(profile);
                  const dayDone = globalDay < userGlobalDay;
                  const dayActive = globalDay === userGlobalDay && userGlobalDay > 0;
                  const dayUnlocked = globalDay <= Math.max(1, userGlobalDay) && wk.week <= profile.currentWeek;
                  const typeColor = {training:C.orange,nutrition:C.accent,mindset:C.purple,rest:C.muted,active_recovery:C.blue}[day.type]||C.muted;
                  return (
                    <div key={day.day}
                      onClick={()=>dayUnlocked&&setSelectedDay({weekData:wk,day})}
                      style={{background:dayActive?`${typeColor}14`:dayDone?C.surface:C.card,border:`1px solid ${dayActive?typeColor+"66":dayDone?C.dim:C.border}`,borderRadius:16,padding:"12px 14px",marginBottom:6,opacity:dayUnlocked?1:0.3,cursor:dayUnlocked?"pointer":"default",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}
                    >
                      {/* Day number */}
                      <div style={{width:36,height:36,borderRadius:10,background:dayDone?C.accent+"33":dayActive?`${typeColor}22`:C.dim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:dayDone?16:13,fontWeight:800,color:dayDone?C.accent:dayActive?typeColor:C.muted}}>
                        {dayDone?"✓":day.icon}
                      </div>
                      {/* Content */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div style={{fontSize:13,fontWeight:700,color:dayActive?typeColor:dayDone?C.muted:C.text,flex:1}}>{day.title}</div>
                        </div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{day.task}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROGRESS ── */}
      {tab==="progress"&&(
        <div style={{padding:"18px",animation:"slideUp 0.28s both"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:18}}>{t("progress.title")}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[{label:t("progress.start"),val:`${profile.weight} kg`,color:C.muted,icon:"📍"},{label:t("progress.current"),val:`${currentWeight} kg`,color:C.blue,icon:"⚖️"},{label:weightDiff<=0?t("progress.lost"):t("progress.gained"),val:`${Math.abs(weightDiff)} kg`,color:weightDiff<=0?C.accent:C.orange,icon:weightDiff<=0?"📉":"📈"},{label:t("progress.bodyfat"),val:`${currentBFP}%`,color:C.purple,icon:"📊"},{label:t("progress.bmi"),val:String(profile.bmi||calcBMI(currentWeight,profile.height)),color:C.blue,icon:"🩺"}].map(s=>(
              <div key={s.label} style={{background:C.card,borderRadius:18,padding:"14px 16px",border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}><span style={{fontSize:15}}>{s.icon}</span><span style={{fontSize:11,color:C.muted}}>{s.label}</span></div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{background:C.card,borderRadius:22,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:3}}>{t("progress.trend")}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>{t("progress.tracked",{n:profile.logs.length})}</div>
            <WeightChart logs={profile.logs}/>
          </div>
          {weekLogs.length>0&&(
            <div style={{background:C.card,borderRadius:22,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:700,marginBottom:14}}>{t("progress.averages")}</div>
              <MetricBar label={t("metric.calories")} value={Math.round(weekLogs.reduce((s,l)=>s+(l.calories||0),0)/weekLogs.length)} target={profile.dailyTargets?.calories||2000} unit="kcal" color={C.orange} icon="🔥"/>
              <MetricBar label={t("metric.protein")} value={Math.round(weekLogs.reduce((s,l)=>s+(l.protein||0),0)/weekLogs.length)} target={profile.dailyTargets?.protein||150} unit="g" color={C.purple} icon="🥩"/>
              <MetricBar label={t("metric.steps")} value={Math.round(weekLogs.reduce((s,l)=>s+(l.steps||0),0)/weekLogs.length)} target={profile.dailyTargets?.steps||10000} unit={t("unit.steps")} color={C.accent} icon="👟"/>
            </div>
          )}
          {profile.logs.length>0&&(
            <div style={{background:C.card,borderRadius:22,padding:"18px",border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:700,marginBottom:14}}>{t("progress.log")}</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr>{["Date","⚖️","🔥","🥩","👟"].map(h=><th key={h} style={{textAlign:"right",padding:"5px 7px",color:C.muted,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                  <tbody>{[...profile.logs].reverse().slice(0,14).map(l=>(
                    <tr key={l.date} style={{borderTop:`1px solid ${C.dim}`}}>
                      <td style={{padding:"7px 7px",color:C.muted,whiteSpace:"nowrap"}}>{fmtDate(l.date)}</td>
                      <td style={{padding:"7px 7px",textAlign:"right",fontWeight:600,color:C.blue}}>{l.weight}</td>
                      <td style={{padding:"7px 7px",textAlign:"right",color:C.orange}}>{l.calories}</td>
                      <td style={{padding:"7px 7px",textAlign:"right",color:C.purple}}>{l.protein}g</td>
                      <td style={{padding:"7px 7px",textAlign:"right",color:C.accent}}>{((l.steps||0)/1000).toFixed(1)}k</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab==="profile"&&(
        <div style={{padding:"18px",animation:"slideUp 0.28s both"}}>
          <div style={{textAlign:"center",marginBottom:22}}>
            <div style={{width:76,height:76,borderRadius:"50%",fontSize:36,background:C.accentDim,border:`3px solid ${C.accent}55`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>{profile.avatar}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800}}>{profile.name}</div>
            <div style={{color:C.muted,fontSize:13,marginTop:3,textTransform:"capitalize"}}>{(profile.goal||"").replace("_"," ")} · Week {profile.currentWeek} — {currentWeekData.theme}</div>
            <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:10}}>
              <span style={{fontSize:12,color:C.orange,background:C.orangeDim,padding:"4px 12px",borderRadius:20,fontWeight:700}}>🔥 {profile.streak} дней подряд</span>
            </div>
          </div>
          <div style={{background:C.card,borderRadius:20,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:12}}>{t("profile.body_stats")}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[["Age",`${profile.age}y`],["Height",`${profile.height}cm`],["Weight",`${profile.weight}kg`],["BMI",profile.bmi||"—"],["Body Fat",profile.bfp?`${profile.bfp}%`:"—"]].map(([k,v])=>(
                <div key={k} style={{background:C.surface,borderRadius:12,padding:"10px 9px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800}}>{v}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{k}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:C.card,borderRadius:20,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:12}}>{t("profile.measurements")}</div>
            {[["Waist",profile.waist,"cm"],["Neck",profile.neck,"cm"],...(profile.gender==="female"&&profile.thigh?[["Thigh",profile.thigh,"cm"]]:[])].filter(([,v])=>v).map(([k,v,u])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:13}}>{k}</span><span style={{fontWeight:700,fontSize:13}}>{v} {u}</span></div>
            ))}
          </div>
          <div style={{background:C.card,borderRadius:20,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:12}}>{t("profile.lifestyle")}</div>
            {[
              [t("profile.stress"),["😌","🙂","😐","😤","😰"][(profile.stress||3)-1]+" "+[t("stress.1"),t("stress.2"),t("stress.3"),t("stress.4"),t("stress.5")][(profile.stress||3)-1]],
              [t("profile.sleep"),["😴","🛌","😑","😟","😵"][(profile.sleep||3)-1]+" "+[t("sleep.1"),t("sleep.2"),t("sleep.3"),t("sleep.4"),t("sleep.5")][(profile.sleep||3)-1]],
              [t("profile.diet"),["🥗","🍱","🍜","🍔","🍕"][(profile.dietQuality||3)-1]+" "+[t("diet.1"),t("diet.2"),t("diet.3"),t("diet.4"),t("diet.5")][(profile.dietQuality||3)-1]],
              [t("profile.training"),profile.training==="none"?t("training.display.none"):profile.training==="1_2x_week"?t("training.display.1_2x"):t("training.display.3plus")],
              ...(profile.trainingExp?[[t("profile.experience"),profile.trainingExp]]:[]),
              [t("profile.activity"),(profile.activity||"moderate")],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:13}}>{k}</span><span style={{fontWeight:600,fontSize:13,textTransform:"capitalize"}}>{v}</span></div>
            ))}
          </div>
          {/* Current week mindset */}
          <div style={{background:C.purpleDim,border:`1px solid ${C.purple}33`,borderRadius:20,padding:"16px 18px",marginBottom:12}}>
            <div style={{fontWeight:700,marginBottom:8}}>🧠 {t("profile.mindset",{w:profile.currentWeek})}</div>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:6}}>{currentWeekData.mindset.title}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.7,fontStyle:"italic",borderLeft:`3px solid ${C.purple}`,paddingLeft:12}}>"{currentWeekData.mindset.quote}"</div>
          </div>
          <div style={{background:C.card,borderRadius:20,padding:"16px 18px",border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:12}}>{t("profile.targets")}</div>
            {[{l:t("profile.calories"),v:`${profile.dailyTargets?.calories||2000} kcal`,c:C.orange},{l:t("profile.protein"),v:`${profile.dailyTargets?.protein||150} g`,c:C.purple},{l:t("profile.steps"),v:(profile.dailyTargets?.steps||10000).toLocaleString(),c:C.accent}].map(tgt=>(
              <div key={tgt.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:13}}>{tgt.l}</span><span style={{fontWeight:700,color:tgt.c,fontSize:13}}>{tgt.v}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",padding:"10px 16px 22px"}}>
        {TABS.map(tb=><button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===tb.id?C.accent:C.dim,fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:0.3,padding:"5px 0",transition:"color 0.18s"}}><span style={{fontSize:20}}>{tb.icon}</span>{tb.label}</button>)}
      </div>

      {showLog&&<LogModal profile={profile} onSave={log=>{handleSaveLog(log);setShowLog(false);}} onClose={()=>setShowLog(false)}/>}
      {selectedDay&&<DayDetailModal weekData={selectedDay.weekData} day={selectedDay.day} onClose={()=>setSelectedDay(null)}/>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── SIGN UP (6 steps, same as v7) ───────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
const STEP_META=[
  {title:()=>t("step.1.title"),sub:()=>"1 / 4"},
  {title:()=>t("step.3.title"),sub:()=>"2 / 4"},
  {title:()=>t("step.5.title"),sub:()=>"3 / 4"},
  {title:()=>t("step.6.title"),sub:()=>"4 / 4"},
];
const AVATARS=["💪","🧑‍💻","👩‍🎨","🧔","👩‍🔬","🏃‍♂️","🏋️","🧘‍♀️"];

function SignUp({onComplete,onBack}){
  const [step,setStep]=useState(0);
  const [f,setF]=useState({avatar:"💪",name:"",email:"",password:"",gender:"male",age:"",height:"",weight:"",goal:"fat_loss",stress:3,sleep:3,dietQuality:3,training:"none",trainingExp:"",activity:"moderate"});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const wNum=parseFloat(f.weight),hNum=parseFloat(f.height);
  const bmi=wNum&&hNum?calcBMI(wNum,hNum):null;
  const tdee=calcTDEE(wNum,hNum,parseFloat(f.age),f.gender,f.activity);
  const needsExp=f.training==="1_2x_week"||f.training==="3plus_week";
  // canNext per step: 0=profile+body, 1=goal, 2=lifestyle, 3=activity
  const canNext=[
    f.name.trim()&&f.age&&f.height&&f.weight,
    !!f.goal,
    f.stress&&f.sleep&&f.dietQuality&&f.training&&(!needsExp||f.trainingExp),
    f.activity,
  ][step];
  function next(){step<3?setStep(s=>s+1):finish();}
  function back(){step>0?setStep(s=>s-1):onBack();}
  function finish(){
    onComplete({id:"u_"+Date.now(),...f,age:parseFloat(f.age),height:parseFloat(f.height),weight:parseFloat(f.weight),waist:null,neck:null,thigh:null,targetWeight:null,bmi:bmi?parseFloat(bmi):null,bfp:null,tdee,currentWeek:1,streak:0,totalXP:0,fatsecretConnected:false,joinedAt:todayStr(),notes:"",logs:[],foodLog:[],dailyTargets:{calories:f.goal==="fat_loss"?tdee-400:tdee,protein:Math.round(parseFloat(f.weight||80)*1.8),steps:10000}});
  }
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"52px 22px 16px",display:"flex",alignItems:"center",gap:14}}>
        <button onClick={back} style={{width:40,height:40,borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>←</button>
        <div style={{flex:1}}><ProgressDots total={4} current={step}/></div>
      </div>
      <div style={{padding:"0 22px 6px"}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>{STEP_META[step].sub()}</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:C.text,lineHeight:1.2}}>{STEP_META[step].title()}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 22px 0"}}>
        {/* Step 0: Avatar + Name + Gender + Age + Height + Weight */}
        {step===0&&<div style={{animation:"slideUp 0.3s both"}}>
          <div style={{display:"flex",gap:9,flexWrap:"wrap",marginBottom:22}}>{AVATARS.map(a=><div key={a} onClick={()=>set("avatar",a)} style={{width:50,height:50,borderRadius:15,fontSize:25,display:"flex",alignItems:"center",justifyContent:"center",background:f.avatar===a?C.accentDim:C.card,border:`2px solid ${f.avatar===a?C.accent:C.border}`,cursor:"pointer",transition:"all 0.15s"}}>{a}</div>)}</div>
          <TextInput label={t("field.name")} value={f.name} onChange={v=>set("name",v)} placeholder={t("field.name.ph")}/>
          <PillSelect label={t("field.gender")} value={f.gender} onChange={v=>set("gender",v)} options={[{value:"male",label:t("field.gender.male")},{value:"female",label:t("field.gender.female")}]}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <NumberInput label={t("field.age")} value={f.age} onChange={v=>set("age",v)} unit={t("field.age.unit")} placeholder={t("field.age.ph")} step="1"/>
            <NumberInput label={t("field.height")} value={f.height} onChange={v=>set("height",v)} unit="cm" placeholder={t("field.height.ph")} step="1"/>
          </div>
          <NumberInput label={t("field.weight")} value={f.weight} onChange={v=>set("weight",v)} unit="kg" placeholder={t("field.weight.ph")}/>
          {bmi&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"14px 18px",display:"flex",gap:28,marginTop:4}}><div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>BMI</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.accent}}>{bmi}</div><div style={{fontSize:11,color:C.muted}}>{+bmi<18.5?t("bmi.underweight"):+bmi<25?t("bmi.normal"):+bmi<30?t("bmi.overweight"):t("bmi.obese")}</div></div>{tdee>0&&<div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>TDEE</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.blue}}>{tdee}</div><div style={{fontSize:11,color:C.muted}}>{t("stats.tdee")}</div></div>}</div>}
        </div>}
        {/* Step 1: Goal */}
        {step===1&&<div style={{animation:"slideUp 0.3s both"}}>
          <CardSelect label={t("goal.label")} value={f.goal} onChange={v=>set("goal",v)} options={[{value:"fat_loss",icon:"🔥",label:t("goal.fat_loss"),desc:t("goal.fat_loss.desc")},{value:"recomp",icon:"⚖️",label:t("goal.recomp"),desc:t("goal.recomp.desc")},{value:"health",icon:"💚",label:t("goal.health"),desc:t("goal.health.desc")}]}/>
        </div>}
        {/* Step 2: Lifestyle */}
        {step===2&&<div style={{animation:"slideUp 0.3s both"}}>
          <ScaleSelect label={t("lifestyle.stress")} value={f.stress} onChange={v=>set("stress",v)} icons={["😌","🙂","😐","😤","😰"]} low={t("lifestyle.stress.low")} high={t("lifestyle.stress.high")}/>
          <ScaleSelect label={t("lifestyle.sleep")} value={f.sleep} onChange={v=>set("sleep",v)} icons={["😴","🛌","😑","😟","😵"]} low={t("lifestyle.sleep.low")} high={t("lifestyle.sleep.high")}/>
          <ScaleSelect label={t("lifestyle.diet")} value={f.dietQuality} onChange={v=>set("dietQuality",v)} icons={["🥗","🍱","🍜","🍔","🍕"]} low={t("lifestyle.diet.low")} high={t("lifestyle.diet.high")}/>
          <CardSelect label={t("lifestyle.training")} value={f.training} onChange={v=>{set("training",v);set("trainingExp","");}} options={[{value:"none",icon:"🛋️",label:t("training.none"),desc:t("training.none.desc")},{value:"1_2x_week",icon:"🏃",label:t("training.1_2x"),desc:t("training.1_2x.desc")},{value:"3plus_week",icon:"💪",label:t("training.3plus"),desc:t("training.3plus.desc")}]}/>
          {needsExp&&<div style={{animation:"slideUp 0.25s both"}}><CardSelect label={t("experience.label")} value={f.trainingExp} onChange={v=>set("trainingExp",v)} options={[{value:"beginner",icon:"🌱",label:t("experience.beginner"),desc:t("experience.beginner.desc")},{value:"intermediate",icon:"📈",label:t("experience.intermediate"),desc:t("experience.intermediate.desc")},{value:"advanced",icon:"⚡",label:t("experience.advanced"),desc:t("experience.advanced.desc")}]}/></div>}
        </div>}
        {/* Step 3: Activity level */}
        {step===3&&<div style={{animation:"slideUp 0.3s both"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 16px",marginBottom:22,fontSize:13,color:C.muted,lineHeight:1.65}}>ℹ️ {t("activity.note")}</div>
          <CardSelect value={f.activity} onChange={v=>set("activity",v)} options={[{value:"sedentary",icon:"🛋️",label:t("activity.sedentary"),desc:t("activity.sedentary.desc")},{value:"light",icon:"🚶",label:t("activity.light"),desc:t("activity.light.desc")},{value:"moderate",icon:"🚴",label:t("activity.moderate"),desc:t("activity.moderate.desc")},{value:"active",icon:"⚡",label:t("activity.active"),desc:t("activity.active.desc")},{value:"veryActive",icon:"🏔️",label:t("activity.veryActive"),desc:t("activity.veryActive.desc")}]}/>
        </div>}
      </div>
      <div style={{padding:"18px 22px 48px"}}><Btn onClick={next} disabled={!canNext}>{step===3?t("onboarding.finish"):t("onboarding.continue")}</Btn></div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── COACH DASHBOARD ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
function CoachDashboard({athletes,setAthletes,onBack}){
  const [view,setView]=useState("overview");
  const [selected,setSelected]=useState(null);
  const [coachTab,setCoachTab]=useState("athletes");
  function openAthlete(a){setSelected(a);setView("athlete");}
  function updateAthlete(updated){setAthletes(prev=>prev.map(a=>a.id===updated.id?updated:a));setSelected(updated);}
  if(view==="athlete"&&selected)return <MemberDashboard profile={selected} setProfile={updateAthlete} onBack={()=>setView("overview")}/>;
  const activeToday=athletes.filter(a=>a.logs.at(-1)?.date===todayStr()).length;
  const avgStreak=Math.round(athletes.reduce((s,a)=>s+a.streak,0)/athletes.length);
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:20}}>
      <div style={{background:`linear-gradient(135deg,${C.surface},#0A0F1A)`,borderBottom:`1px solid ${C.border}`,padding:"52px 20px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div><div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>{t("coach.portal")}</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800}}>Team <span style={{color:C.accent}}>{t("coach.title")}</span></div></div>
          <button onClick={onBack} style={{background:C.card,border:`1px solid ${C.border}`,color:C.muted,borderRadius:12,padding:"8px 14px",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{t("coach.exit")}</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[{label:t("coach.athletes"),val:athletes.length,color:C.accent,icon:"👥"},{label:t("coach.active"),val:activeToday,color:C.green,icon:"✅"},{label:t("coach.avg_streak"),val:`${avgStreak}d`,color:C.orange,icon:"🔥"},{label:t("coach.on_track"),val:athletes.filter(a=>pct(a.logs.at(-1)?.calories||0,a.dailyTargets?.calories||2000)>=70).length,color:C.blue,icon:"🎯"}].map(k=>(
            <div key={k.label} style={{background:C.card,borderRadius:16,padding:"12px 10px",textAlign:"center",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div><div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:k.color}}>{k.val}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
        {[{id:"athletes",label:t("coach.tab.athletes")},{id:"insights",label:t("coach.tab.insights")},{id:"notes",label:t("coach.tab.notes")}].map(tab=>(
          <button key={tab.id} onClick={()=>setCoachTab(tab.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"13px 4px 11px",color:coachTab===tab.id?C.accent:C.muted,borderBottom:`2px solid ${coachTab===tab.id?C.accent:"transparent"}`,fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:700,transition:"color 0.18s"}}>{tab.label}</button>
        ))}
      </div>
      <div style={{padding:"18px"}}>
        {coachTab==="athletes"&&<div style={{animation:"slideUp 0.28s both"}}>{athletes.map((a,idx)=>{
          const ll=a.logs.at(-1),lt=ll?.date===todayStr(),wd=ll?+(ll.weight-a.weight).toFixed(1):0;
          const wkData=getWeek(a.currentWeek);
          return <div key={a.id} onClick={()=>openAthlete(a)} style={{background:C.card,borderRadius:22,padding:"16px 18px",marginBottom:12,border:`1px solid ${lt?C.accent+"44":C.border}`,cursor:"pointer",transition:"transform 0.15s",animation:`slideUp 0.35s ${idx*0.06}s both`}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            <div style={{display:"flex",alignItems:"flex-start",gap:13,marginBottom:12}}>
              <div style={{width:48,height:48,borderRadius:16,background:C.accentDim,border:`1.5px solid ${C.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{a.avatar}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontWeight:700,fontSize:15}}>{a.name}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Wk {a.currentWeek}: {wkData.theme} · {a.age}y · {(a.goal||"").replace("_"," ")}</div></div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <span style={{fontSize:11,fontWeight:700,color:lt?C.green:C.red,background:lt?C.greenDim:C.redDim,padding:"3px 9px",borderRadius:20}}>{lt?"✓ Logged":"No log"}</span>
                    <span style={{fontSize:11,color:wd<=0?C.accent:C.orange,fontWeight:700}}>{wd>0?"+":""}{wd} kg</span>
                  </div>
                </div>
              </div>
            </div>
            {ll&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:12}}>
              {[{icon:"⚖️",val:`${ll.weight}kg`,label:"weight",color:C.blue},{icon:"🔥",val:`${pct(ll.calories||0,a.dailyTargets?.calories||2000)}%`,label:"cal",color:pct(ll.calories||0,a.dailyTargets?.calories||2000)>=80?C.green:pct(ll.calories||0,a.dailyTargets?.calories||2000)>=50?C.yellow:C.red},{icon:"🥩",val:`${pct(ll.protein||0,a.dailyTargets?.protein||150)}%`,label:"prot",color:pct(ll.protein||0,a.dailyTargets?.protein||150)>=80?C.green:pct(ll.protein||0,a.dailyTargets?.protein||150)>=50?C.yellow:C.red},{icon:"👟",val:`${((ll.steps||0)/1000).toFixed(1)}k`,label:"steps",color:C.accent}].map(m=>(
                <div key={m.label} style={{background:C.surface,borderRadius:12,padding:"8px",textAlign:"center"}}><div style={{fontSize:14}}>{m.icon}</div><div style={{fontWeight:700,fontSize:13,color:m.color,marginTop:2}}>{m.val}</div><div style={{fontSize:10,color:C.muted}}>{m.label}</div></div>
              ))}
            </div>}
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{flex:1,height:4,background:C.dim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(90deg,${C.accent},#00D2FF)`,width:`${((a.currentWeek-1)/16)*100}%`,borderRadius:2}}/></div>
              <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{a.streak}🔥</span>
            </div>
          </div>;
        })}</div>}
        {coachTab==="insights"&&<div style={{animation:"slideUp 0.28s both"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginBottom:16}}>Team <span style={{color:C.accent}}>Insights</span></div>
          <div style={{background:C.card,borderRadius:22,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:14}}>Weekly Compliance</div>
            {athletes.map(a=>{
              const wl=a.logs.slice(-7);
              const ca=wl.length?Math.round(wl.reduce((s,l)=>s+(l.calories||0),0)/wl.length):0;
              const pa=wl.length?Math.round(wl.reduce((s,l)=>s+(l.protein||0),0)/wl.length):0;
              const sa=wl.length?Math.round(wl.reduce((s,l)=>s+(l.steps||0),0)/wl.length):0;
              return <div key={a.id} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:18}}>{a.avatar}</span><span style={{fontWeight:700,fontSize:14}}>{a.name}</span><span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>{wl.length}/7 days</span></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[{label:"Cal",val:ca,target:a.dailyTargets?.calories||2000,color:C.orange},{label:"Protein",val:pa,target:a.dailyTargets?.protein||150,unit:"g",color:C.purple},{label:"Steps",val:sa,target:a.dailyTargets?.steps||10000,color:C.accent}].map(m=>{const p=pct(m.val,m.target);return <div key={m.label} style={{background:C.surface,borderRadius:12,padding:"10px"}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>{m.label}</div><div style={{fontWeight:700,fontSize:14,color:p>=80?C.green:p>=50?C.yellow:C.red}}>{m.val.toLocaleString()}{m.unit||""}</div><div style={{height:3,background:C.dim,borderRadius:2,marginTop:5,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,borderRadius:2,background:p>=80?C.green:p>=50?C.yellow:C.red}}/></div></div>;})}
                </div>
              </div>;
            })}
          </div>
          <div style={{background:C.card,borderRadius:22,padding:"18px",border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:14}}>🏆 Streak Leaderboard</div>
            {[...athletes].sort((a,b)=>b.streak-a.streak).map((a,i)=>(
              <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:[`${C.yellow}33`,`${C.muted}22`,`${C.orange}22`][i]||C.dim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:[C.yellow,C.muted,C.orange][i]||C.dim,flexShrink:0}}>{i+1}</div>
                <span style={{fontSize:18}}>{a.avatar}</span><span style={{flex:1,fontWeight:600}}>{a.name}</span>
                <span style={{fontSize:11,color:C.muted}}>{getWeek(a.currentWeek).theme}</span>
                <span style={{fontWeight:800,color:C.orange}}>🔥 {a.streak}d</span>
              </div>
            ))}
          </div>
        </div>}
        {coachTab==="notes"&&<div style={{animation:"slideUp 0.28s both"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginBottom:16}}>Coach <span style={{color:C.accent}}>Notes</span></div>
          {athletes.map(a=>{
            const wk=getWeek(a.currentWeek);
            return <div key={a.id} style={{background:C.card,borderRadius:20,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:22}}>{a.avatar}</span><div><span style={{fontWeight:700,fontSize:15}}>{a.name}</span><div style={{fontSize:11,color:C.muted}}>Wk {a.currentWeek}: {wk.theme} · {wk.training.title}</div></div><span style={{marginLeft:"auto",fontSize:11,color:C.muted}}>Today: {wk.days[new Date().getDay()===0?6:new Date().getDay()-1]?.title}</span></div>
              <textarea value={a.notes||""} placeholder={`Notes for ${a.name.split(" ")[0]}…`} onChange={e=>setAthletes(prev=>prev.map(at=>at.id===a.id?{...at,notes:e.target.value}:at))} rows={3} style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 13px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"vertical",lineHeight:1.65}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>;
          })}
        </div>}
      </div>
    </div>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────
function Splash({onStart,onCoach}){
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-100,right:-80,width:360,height:360,borderRadius:"50%",background:`radial-gradient(circle,${C.accent}14 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:120,left:-100,width:280,height:280,borderRadius:"50%",background:`radial-gradient(circle,${C.blue}14 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"64px 32px 32px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"8px 16px",marginBottom:44,width:"fit-content"}}>
          <div style={{width:26,height:26,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.text,letterSpacing:1}}>FORM16</span>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:44,fontWeight:800,lineHeight:1.1,color:C.text,marginBottom:18}}>16 weeks.<br/><span style={{color:C.accent}}>Transform</span><br/>for good.</div>
        <div style={{fontSize:15,color:C.muted,lineHeight:1.75,marginBottom:44}}>Science-backed program with daily habits, nutrition tracking, and real results.</div>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {[{icon:"📅",label:"Real daily tasks from a 16-week program"},{icon:"🍎",label:"FatSecret food diary sync"},{icon:"📊",label:"Training, nutrition & mindset per week"},{icon:"🔥",label:"Daily streaks to keep you consistent"},{icon:"👨‍💼",label:"Coach dashboard for trainers"}].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,animation:`slideUp 0.45s ${0.08+i*0.07}s both`}}>
              <div style={{width:36,height:36,borderRadius:11,background:C.card,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{f.icon}</div>
              <span style={{fontSize:13,color:C.muted}}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 32px 52px",display:"flex",flexDirection:"column",gap:10}}>
        <Btn onClick={onStart}>Start my transformation →</Btn>
        <Btn variant="outline" onClick={onCoach}>Coach / Trainer login</Btn>
        <Btn variant="ghost" onClick={onStart}>I already have an account</Btn>
      </div>
    </div>
  );
}

// ─── DAY 0 SCREEN ─────────────────────────────────────────────────────────────
function Day0Screen({ profile, onDone, userId }) {
  const [notifDone, setNotifDone] = useState(() =>
    "Notification" in window && Notification.permission === "granted"
  );
  const [homeDone, setHomeDone] = useState(() =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
  const [installPrompt, setInstallPrompt] = useState(null); // Android deferred prompt
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Capture Android install prompt
  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setHomeDone(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Subscribe to push notifications
  async function subscribeToPush(registration) {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub, userId }),
      });
    } catch (e) {
      console.warn("Push subscribe failed:", e);
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) { setNotifDone(true); return; }
    const result = await Notification.requestPermission();
    setNotifDone(true);
    if (result === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await subscribeToPush(reg);
    }
  }

  async function handleHomeScreen() {
    if (isStandalone) { setHomeDone(true); return; }
    if (installPrompt) {
      // Android — trigger native install dialog
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setHomeDone(true);
    } else if (isIOS) {
      // iOS — show manual instructions
      setShowIOSInstructions(v => !v);
    } else {
      setHomeDone(true);
    }
  }

  const bmiLabel = !profile.bmi ? "" :
    +profile.bmi < 18.5 ? t("bmi.underweight") :
    +profile.bmi < 25   ? t("bmi.normal") :
    +profile.bmi < 30   ? t("bmi.overweight") : t("bmi.obese");
  const bmiColor = !profile.bmi ? C.muted :
    +profile.bmi < 18.5 ? C.blue :
    +profile.bmi < 25   ? C.accent :
    +profile.bmi < 30   ? C.orange : C.red;

  const homeSubtext = isStandalone
    ? "Уже установлено — отлично!"
    : isAndroid && installPrompt
    ? "Нажми, чтобы установить приложение"
    : isIOS
    ? "Safari → Поделиться → На экран «Домой»"
    : "Добавь в закладки или на главный экран";

  const tasks = [
    { id:"profile", icon:"📋", label:"Профиль заполнен",         sub:"Анкета завершена — данные сохранены",     done:true,      action:null,                badge:"готово"  },
    { id:"notif",   icon:"🔔", label:"Включить уведомления",      sub:"7:00 — замер веса · 21:00 — итог дня",   done:notifDone, action:requestNotifications, badge:"сейчас"  },
    { id:"home",    icon:"📲", label:"Добавить на главный экран", sub:homeSubtext,                               done:homeDone,  action:handleHomeScreen,      badge:"сегодня" },
  ];
  const doneCount = tasks.filter(tk => tk.done).length;

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",overflowY:"auto"}}>

      {/* Header */}
      <div style={{padding:"52px 24px 24px",textAlign:"center",animation:"slideUp 0.4s both"}}>
        <div style={{width:64,height:64,borderRadius:20,background:C.accentDim,border:`2px solid ${C.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 20px"}}>🎉</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,marginBottom:8}}>
          Ты в программе,<br/><span style={{color:C.accent}}>{profile.name?.split(" ")[0]}!</span>
        </div>
        <div style={{fontSize:14,color:C.muted,lineHeight:1.7}}>
          16 недель начинаются завтра утром.<br/>Сегодня — подготовка.
        </div>
      </div>

      {/* Weight + BMI */}
      <div style={{padding:"0 24px 20px",animation:"slideUp 0.4s 0.08s both"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"16px"}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Текущий вес</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,color:C.text,lineHeight:1}}>{profile.weight}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>кг · точка отсчёта</div>
          </div>
          <div style={{background:C.card,border:`1px solid ${bmiColor}44`,borderRadius:20,padding:"16px"}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Индекс массы тела</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,color:bmiColor,lineHeight:1}}>{profile.bmi||"—"}</div>
            <div style={{fontSize:12,color:bmiColor,marginTop:4}}>{bmiLabel}</div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{padding:"0 24px 20px",animation:"slideUp 0.4s 0.14s both"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,overflow:"hidden"}}>
          <div style={{padding:"16px 18px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,fontSize:14}}>Сделай сегодня</div>
            <div style={{fontSize:12,color:C.accent,fontWeight:700}}>{doneCount} / {tasks.length}</div>
          </div>
          {tasks.map((task,i)=>(
            <div key={task.id}>
              <div
                onClick={()=>!task.done&&task.action&&task.action()}
                style={{display:"flex",alignItems:"center",gap:12,padding:"13px 18px",borderBottom:(i<tasks.length-1&&!showIOSInstructions)||task.id!=="home"?`1px solid ${C.border}`:"none",cursor:task.done||!task.action?"default":"pointer",transition:"background 0.15s"}}
                onMouseEnter={e=>{if(!task.done&&task.action)e.currentTarget.style.background=C.surface;}}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,background:task.done?C.accent:C.dim,border:task.done?"none":`1.5px solid ${C.border}`,color:task.done?C.bg:C.muted,transition:"all 0.2s"}}>
                  {task.done&&"✓"}
                </div>
                <div style={{width:36,height:36,borderRadius:11,background:task.done?C.accentDim:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>
                  {task.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:task.done?C.muted:C.text,textDecoration:task.done?"line-through":"none",marginBottom:2}}>{task.label}</div>
                  <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{task.sub}</div>
                </div>
                {!task.done&&(
                  <div style={{fontSize:10,color:task.badge==="сейчас"?C.accent:C.muted,background:task.badge==="сейчас"?C.accentDim:C.surface,padding:"3px 8px",borderRadius:20,fontWeight:600,flexShrink:0}}>
                    {task.badge}
                  </div>
                )}
              </div>
              {/* iOS install instructions — shown inline */}
              {task.id==="home"&&showIOSInstructions&&!homeDone&&(
                <div style={{background:C.surface,padding:"12px 18px",borderTop:`1px solid ${C.border}`}}>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>
                    1. Нажми <b style={{color:C.text}}>кнопку «Поделиться»</b> внизу экрана Safari<br/>
                    2. Прокрути вниз и выбери <b style={{color:C.text}}>«На экран "Домой"»</b><br/>
                    3. Нажми <b style={{color:C.text}}>«Добавить»</b>
                  </div>
                  <button
                    onClick={()=>{setHomeDone(true);setShowIOSInstructions(false);}}
                    style={{marginTop:10,background:C.accent,color:C.bg,border:"none",borderRadius:12,padding:"8px 16px",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}
                  >
                    Готово ✓
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow preview */}
      <div style={{padding:"0 24px 20px",animation:"slideUp 0.4s 0.2s both"}}>
        <div style={{background:C.card,border:`1.5px solid ${C.accent}44`,borderRadius:22,overflow:"hidden"}}>
          <div style={{padding:"14px 18px 12px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Завтра — День 1</div>
            <div style={{fontSize:13,color:C.muted}}>Вот что тебя ждёт</div>
          </div>
          {[
            {time:"07:00",icon:"⚖️",col:C.accent,label:"Встань на весы",sub:"После туалета, до завтрака. Введи вес одним нажатием"},
            {time:"Днём",icon:"🍽️",col:C.blue,label:"Записывай еду",sub:"Каждый приём пищи сразу после еды — так точнее всего"},
            {time:"21:00",icon:"🌙",col:C.purple,label:"Итог дня",sub:"Пришлём напоминание проверить и дозаписать питание"},
          ].map((item,i,arr)=>(
            <div key={item.time} style={{display:"flex",gap:14,padding:"13px 18px",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
              <div style={{width:42,textAlign:"center",flexShrink:0}}>
                <div style={{fontSize:10,color:item.col,fontWeight:700,marginBottom:6,lineHeight:1}}>{item.time}</div>
                <div style={{width:36,height:36,borderRadius:11,background:`${item.col}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto"}}>{item.icon}</div>
              </div>
              <div style={{paddingTop:2}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{item.label}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{padding:"0 24px 48px",animation:"slideUp 0.4s 0.26s both"}}>
        <button onClick={onDone} style={{width:"100%",background:C.accent,color:C.bg,border:"none",borderRadius:18,padding:"17px",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
          Открыть приложение →
        </button>
        <div style={{textAlign:"center",marginTop:12,fontSize:12,color:C.muted}}>
          Задачи дня 0 останутся на главном экране
        </div>
      </div>

    </div>
  );
}

// ─── AUTH SCREENS ─────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState("");

  async function handleEmail() {
    if (!email || !password) { setError(t("auth.fill_fields")); return; }
    setLoading(true); setError(""); setMessage("");
    if (mode === "signup") {
      const { error: e } = await supabase.auth.signUp({ email, password });
      if (e) setError(e.message);
      else setMessage(t("auth.check_email"));
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) setError(e.message);
    }
    setLoading(false);
  }

  const inputStyle = (name) => ({
    width:"100%", background:C.card, border:`1.5px solid ${focused===name?C.accent:C.border}`,
    borderRadius:14, padding:"14px 16px", color:C.text, fontSize:15,
    fontFamily:"'DM Sans',sans-serif", outline:"none", marginBottom:12,
  });

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"32px 28px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"8px 16px",marginBottom:24}}>
          <div style={{width:26,height:26,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.text,letterSpacing:1}}>FORM16</span>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.text,marginBottom:8}}>
          {mode==="login"?t("auth.welcome_back"):t("auth.create_account")}
        </div>
        <div style={{fontSize:14,color:C.muted}}>
          {mode==="login"?t("auth.signin_subtitle"):t("auth.signup_subtitle")}
        </div>
      </div>

      <input type="email" placeholder={t("auth.email")} value={email} onChange={e=>setEmail(e.target.value)}
        style={inputStyle("email")} onFocus={()=>setFocused("email")} onBlur={()=>setFocused("")}
      />
      <input type="password" placeholder={t("auth.password")} value={password} onChange={e=>setPassword(e.target.value)}
        style={inputStyle("password")} onFocus={()=>setFocused("password")} onBlur={()=>setFocused("")}
        onKeyDown={e=>e.key==="Enter"&&handleEmail()}
      />

      {error && <div style={{fontSize:13,color:C.red,marginBottom:12,background:C.redDim,borderRadius:10,padding:"8px 12px"}}>{error}</div>}
      {message && <div style={{fontSize:13,color:C.accent,marginBottom:12,background:C.accentDim,borderRadius:10,padding:"8px 12px"}}>{message}</div>}

      <button onClick={handleEmail} disabled={loading} style={{width:"100%",background:loading?C.dim:C.accent,color:loading?C.muted:C.bg,border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:loading?"default":"pointer",marginBottom:16}}>
        {loading?t("auth.loading"):mode==="login"?t("auth.signin_btn"):t("auth.signup_btn")}
      </button>

      <div style={{textAlign:"center",fontSize:14,color:C.muted}}>
        {mode==="login"?t("auth.no_account"):t("auth.has_account")}
        <span onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("");}} style={{color:C.accent,cursor:"pointer",fontWeight:700}}>
          {mode==="login"?t("auth.signup_link"):t("auth.signin_link")}
        </span>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [lang, setLangState] = useState(() => localStorage.getItem("form16_lang") || null);
  const chosen = !!lang;
  const t = createTranslator(lang || "ru");
  function setLang(code) { localStorage.setItem("form16_lang", code); setLangState(code); }
  const [screen, setScreen]   = useState("loading");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [athletes, setAthletes] = useState(MOCK_ATHLETES);

  // ── Listen to auth state ──────────────────────────────────────────────────
  useEffect(() => {
    let initialDone = false;

    // onAuthStateChange fires on initial load AND on login/logout/refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        if (!initialDone) {
          // First fire — restore session on reload
          initialDone = true;
          loadProfile(session.user.id);
        } else if (_event === "SIGNED_IN") {
          // User just logged in fresh
          loadProfile(session.user.id);
        }
      } else {
        initialDone = true;
        setScreen("auth");
        setProfile(null);
      }
    });

    // Safety fallback: if nothing fires in 4s, show auth screen
    const timeout = setTimeout(() => {
      if (!initialDone) {
        initialDone = true;
        setScreen("auth");
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // ── Load profile from Supabase ────────────────────────────────────────────
  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      // No profile yet — send to onboarding
      setScreen("onboarding");
      return;
    }

    // Load daily logs
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    const fullProfile = {
      ...data,
      currentWeek: data.current_week || 1,
      streak: data.streak || 0,
      totalXP: data.total_xp || 0,
      fatsecretConnected: data.fatsecret_connected || false,
      dietQuality: data.diet_quality || 3,
      trainingExp: data.training_exp || "",
      joinedAt: data.joined_at || todayStr(),
      logs: (logs || []).map(l => ({
        date: l.date,
        weight: l.weight,
        calories: l.calories,
        protein: l.protein,
        steps: l.steps,
        fromFatSecret: l.from_fatsecret,
      })),
      dailyTargets: {
        calories: data.daily_calories || 2000,
        protein: data.daily_protein || 150,
        steps: data.daily_steps || 10000,
      },
      foodLog: [],
    };

    setProfile(fullProfile);

    // Route to day0 if: joined today, no logs yet, and haven't seen day0 screen yet
    const isNewUser = fullProfile.joinedAt === todayStr() && (!logs || logs.length === 0);
    const hasSeenDay0 = localStorage.getItem(`form16_day0_${userId}`);
    setScreen(isNewUser && !hasSeenDay0 ? "day0" : "member");
  }

  // ── Save profile to Supabase (called after onboarding) ───────────────────
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
    });

    if (!error) {
      setProfile({ ...p, id: userId, logs: [], foodLog: [] });
      setScreen("day0");
    }
  }

  // ── Update profile in Supabase ────────────────────────────────────────────
  async function updateProfile(p) {
    const userId = session?.user?.id;
    if (!userId) return;
    setProfile(p);
    await supabase.from("profiles").update({
      current_week: p.currentWeek,
      streak: p.streak,
      total_xp: p.totalXP,
      fatsecret_connected: p.fatsecretConnected,
      daily_calories: p.dailyTargets?.calories,
      daily_protein: p.dailyTargets?.protein,
      daily_steps: p.dailyTargets?.steps,
    }).eq("id", userId);
  }

  // ── Save daily log to Supabase ────────────────────────────────────────────
  async function saveLog(log) {
    const userId = session?.user?.id;
    if (!userId) return;

    // Upsert — replaces existing log for same date
    await supabase.from("daily_logs").upsert({
      user_id: userId,
      date: log.date,
      weight: log.weight,
      calories: log.calories,
      protein: log.protein,
      steps: log.steps,
      from_fatsecret: log.fromFatSecret || false,
    }, { onConflict: "user_id,date" });

    // Update local state
    setProfile(p => ({
      ...p,
      logs: [...(p.logs||[]).filter(l=>l.date!==log.date), log],
      streak: p.streak + (p.logs?.at(-1)?.date !== todayStr() ? 1 : 0),
      totalXP: p.totalXP + 20,
    }));
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};}
        ::-webkit-scrollbar{width:0;}
        input,button,textarea,select{font-family:'DM Sans',sans-serif;}
        input::placeholder,textarea::placeholder{color:${C.muted};opacity:1;}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
        input[type=number]{-moz-appearance:textfield;}
        @keyframes slideUp{from{transform:translateY(26px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{0%{transform:scale(0.6);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
      `}</style>
      <div style={{maxWidth:430,margin:"0 auto",color:C.text,minHeight:"100vh",background:C.bg}}>

        {/* Language picker — shown on first launch before everything else */}
        {!chosen && <LanguagePicker onPick={setLang} />}

        {/* All other screens — only shown after language is chosen */}
        {chosen && screen==="loading" && (
          <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
            <div style={{width:26,height:26,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
            <div style={{fontSize:14,color:C.muted}}>Loading…</div>
          </div>
        )}

        {chosen && screen==="auth" && <AuthScreen onAuth={()=>{}} />}

        {chosen && screen==="onboarding" && (
          <SignUp
            onComplete={saveProfile}
            onBack={async()=>{ await supabase.auth.signOut(); setScreen("auth"); }}
          />
        )}

        {chosen && screen==="day0" && profile && (
          <Day0Screen
            profile={profile}
            userId={session?.user?.id}
            onDone={()=>{
              localStorage.setItem(`form16_day0_${session?.user?.id}`,"1");
              setScreen("member");
            }}
          />
        )}

        {chosen && screen==="member" && profile && (
          <MemberDashboard
            profile={profile}
            setProfile={updateProfile}
            saveLog={saveLog}
            onSignOut={signOut}
          />
        )}

        {chosen && screen==="coach" && (
          <CoachDashboard
            athletes={athletes}
            setAthletes={setAthletes}
            onBack={()=>setScreen("auth")}
          />
        )}
      </div>
    </>
  );
}
