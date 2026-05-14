// Today's program-derived content rendered as a swipeable carousel of cards
// (one idea per slide), instead of a single long block. Only the slides that
// actually have content for the current day are rendered, so simple days stay
// short and rich days expand without scrolling forever.
//
// Slide order (each conditional on its data being present):
//   1. Task        — icon + title + task text                     [always]
//   2. Why         — info.why                                     [optional]
//   3. How         — info.howTo                                   [optional]
//   4. Goal        — info.weekTarget                              [optional]
//   5. Stats       — weekly averages from logs                    [day 8 only, isWeeklyStats]
//   6. Tip         — tip.text + tip.cat (psychology, etc.)        [always]
//
// Swipe is implemented with native CSS scroll-snap. The dot indicator below
// tracks the centred card via IntersectionObserver.
//
// Per design: no Details / Подробнее CTA on any slide — the slides themselves
// carry the content, so an extra modal would just be redundant.
import { useEffect, useRef, useState } from "react";
import { C } from "../theme.js";

const TYPE_COLOR = {
  training: C.orange,
  nutrition: C.accent,
  mindset: C.purple,
  rest: C.muted,
  active_recovery: C.blue,
};

// One slide in the carousel. Big bold title, single body block, optional CTA.
// Background is a tinted version of `accent` so each slide reads as one
// cohesive panel even when multiple are visible during the swipe.
function Slide({ accent, label, title, children, footer, height }) {
  return (
    <div style={{
      // Full container width — Instagram-style one-card-at-a-time. The
      // outer flex wrapper carries the width sizing so swipe snapping
      // works; the visual card fills 100% of that wrapper.
      width: "100%",
      scrollSnapAlign: "center",
      background: `${accent}18`,
      border: `1px solid ${accent}44`,
      borderRadius: 22,
      padding: "22px 24px",
      height,
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      <div style={{
        fontSize: 11, color: accent, fontWeight: 700,
        letterSpacing: 1, textTransform: "uppercase", marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800,
        lineHeight: 1.2, color: C.text, marginBottom: 12,
      }}>{title}</div>
      <div style={{ flex: 1, overflowY: "auto", color: C.muted, fontSize: 14, lineHeight: 1.7 }}>
        {children}
      </div>
      {footer && <div style={{ marginTop: 12, flexShrink: 0 }}>{footer}</div>}
    </div>
  );
}

// Renders the weekly-stats slide content (used only on Day 8 / isWeeklyStats).
// Computes 7-day averages from profile.logs and pairs them with light
// recommendations against the user's targets.
function WeeklyStatsContent({ profile }) {
  const w7 = profile.logs.slice(-7);
  const avgCal    = w7.length ? Math.round(w7.reduce((s,l)=>s+(l.calories||0),0) / w7.length) : 0;
  const avgProt   = w7.length ? Math.round(w7.reduce((s,l)=>s+(l.protein||0), 0) / w7.length) : 0;
  const avgSteps  = w7.length ? Math.round(w7.reduce((s,l)=>s+(l.steps||0),   0) / w7.length) : 0;
  const avgWeight = w7.length ? +(w7.reduce((s,l)=>s+(l.weight||0), 0) / w7.length).toFixed(1) : profile.weight;
  const tdee = profile.tdee || 2000;
  const protTarget = profile.dailyTargets?.protein || 150;
  const calDiff = avgCal - tdee;

  const stats = [
    { label: "Ср. вес",     val: `${avgWeight} кг`,           color: C.blue   },
    { label: "Ср. калории", val: `${avgCal} ккал`,            color: C.orange },
    { label: "Ср. белок",   val: `${avgProt} г`,              color: C.purple },
    { label: "Ср. шаги",    val: avgSteps.toLocaleString(),   color: C.accent },
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: C.card, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {avgCal > 0 && (
          <div style={{ background: C.card, borderRadius: 12, padding: "10px 12px", fontSize: 12, lineHeight: 1.6 }}>
            🔥 <b style={{ color: C.orange }}>{avgCal} ккал/день</b>. {calDiff > 300 ? "Выше нормы — попробуй уменьшить порции." : calDiff < -500 ? "Ниже нормы — не голодай." : "Отлично — близко к норме!"}
          </div>
        )}
        {avgProt > 0 && (
          <div style={{ background: C.card, borderRadius: 12, padding: "10px 12px", fontSize: 12, lineHeight: 1.6 }}>
            🥩 <b style={{ color: C.purple }}>{avgProt} г/день</b> из {protTarget} г. {avgProt < protTarget * 0.7 ? "Добавь белок к каждому приёму пищи." : avgProt < protTarget * 0.9 ? "Почти у цели!" : "Отлично!"}
          </div>
        )}
        {avgSteps > 0 && (
          <div style={{ background: C.card, borderRadius: 12, padding: "10px 12px", fontSize: 12, lineHeight: 1.6 }}>
            👟 <b style={{ color: C.accent }}>{avgSteps.toLocaleString()}/день</b>. {avgSteps < 5000 ? "Добавь прогулку после обеда." : avgSteps < 8000 ? "Цель — 8 000 шагов." : "Отличная активность!"}
          </div>
        )}
      </div>
    </>
  );
}

export function DailyTaskCarousel({ todayDayData, currentWeekData, profile }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const accent = TYPE_COLOR[todayDayData?.type] || C.accent;

  // Height scales with the phone — `clamp` keeps a 400px floor on small
  // screens, lets the card breathe to ~62% of viewport height on average
  // phones, and caps at 600px on tall iPads so a single card doesn't fill
  // the whole page. Long body content scrolls inside the card.
  const SLIDE_HEIGHT = "clamp(400px, 62vh, 600px)";

  // Build slide list, skipping any that don't have data for today.
  const slides = [
    {
      key: "task",
      accent,
      label: `🎯 День ${todayDayData.day} · ${todayDayData.type}`,
      title: todayDayData.title,
      // No Details CTA — the rest of the carousel slides ARE the details.
      content: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 4 }}>
          <div style={{
            width: 88, height: 88, borderRadius: 24, marginBottom: 16,
            background: `${accent}22`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 48,
          }}>{todayDayData.icon}</div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
            {todayDayData.task}
          </div>
        </div>
      ),
    },
    todayDayData.info?.why && {
      key: "why",
      accent,
      label: "📖 Почему это важно",
      title: "Контекст",
      content: <div style={{ whiteSpace: "pre-line" }}>{todayDayData.info.why}</div>,
    },
    todayDayData.info?.howTo && {
      key: "howto",
      accent,
      label: "✅ Как это делать",
      title: "Действия",
      content: <div style={{ whiteSpace: "pre-line" }}>{todayDayData.info.howTo}</div>,
    },
    todayDayData.info?.weekTarget && {
      key: "goal",
      accent,
      label: "🎯 Цель",
      title: "На сегодня",
      content: <div style={{ whiteSpace: "pre-line" }}>{todayDayData.info.weekTarget}</div>,
    },
    (todayDayData.isWeeklyStats && profile.logs.length > 0) && {
      key: "stats",
      accent: C.accent,
      label: `📊 Статистика за неделю ${currentWeekData?.week || 1}`,
      title: "Твои средние",
      content: <WeeklyStatsContent profile={profile} />,
    },
    {
      key: "tip",
      accent: C.accent,
      label: `💡 ${todayDayData.tip.cat}`,
      title: "Знал?",
      content: (
        <div style={{ fontSize: 16, lineHeight: 1.7, color: C.text, fontWeight: 500 }}>
          {todayDayData.tip.text}
        </div>
      ),
    },
  ].filter(Boolean);

  // Track which slide is centred → drives the dot indicator.
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          const idx = Number(e.target.dataset.idx);
          if (!Number.isNaN(idx)) setActiveIdx(idx);
        }
      });
    }, { root: scrollRef.current, threshold: [0.6] });
    cardRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, [slides.length]);

  // Snap scroll to a specific slide when its dot is tapped.
  const scrollTo = idx => {
    const el = cardRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "2px 0 6px",
          // Bleed past the dashboard's 22px gutter so the cards land
          // edge-to-edge like an Instagram feed.
          margin: "0 -22px",
          paddingLeft: 22,
          paddingRight: 22,
        }}
      >
        <style>{`
          .form16-carousel-track::-webkit-scrollbar{display:none;}
        `}</style>
        {slides.map((s, i) => (
          <div
            key={s.key}
            ref={el => (cardRefs.current[i] = el)}
            data-idx={i}
            // Each slide carrier takes the full visible width of the track
            // so only one card is on screen at a time (Instagram feed feel).
            // The track itself is the dashboard width minus the bleed, so
            // this auto-fits whatever phone the user is on.
            style={{ flex: "0 0 100%", scrollSnapAlign: "center" }}
          >
            <Slide
              accent={s.accent}
              label={s.label}
              title={s.title}
              footer={s.footer}
              height={SLIDE_HEIGHT}
            >
              {s.content}
            </Slide>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Слайд ${i + 1}`}
            style={{
              width: i === activeIdx ? 22 : 6,
              height: 6,
              borderRadius: 3,
              background: i === activeIdx ? accent : C.dim,
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
