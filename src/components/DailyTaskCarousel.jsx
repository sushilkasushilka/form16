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

// Split a long body string into card-sized chunks. Tries to break on
// paragraph boundaries first; falls back to sentence boundaries when a
// single paragraph is itself too long for one card. Card body at our
// current font sizing (~14px, 1.7 line-height, ~336px content width on
// a 380px square card) holds roughly 450 characters comfortably; we use
// a slightly smaller budget so the last line never gets clipped.
function chunkText(text, maxChars = 420) {
  if (text == null) return [];
  const norm = String(text).trim();
  if (!norm) return [];
  if (norm.length <= maxChars) return [norm];

  const paragraphs = norm.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";

  const flush = () => { if (current) { chunks.push(current); current = ""; } };
  const append = (piece) => {
    if (!piece) return;
    if (!current) { current = piece; return; }
    const candidate = current + "\n\n" + piece;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      flush();
      current = piece;
    }
  };

  for (const p of paragraphs) {
    if (p.length <= maxChars) {
      append(p);
    } else {
      // Single oversized paragraph — split on sentence enders so we don't
      // chop in the middle of a phrase.
      const sentences = p.match(/[^.!?…]+[.!?…]+\s*/g) || [p];
      for (const s of sentences) append(s.trim());
    }
  }
  flush();
  return chunks;
}

// One slide in the carousel. Big bold title, single body block, optional CTA.
// Background is a tinted version of `accent` so each slide reads as one
// cohesive panel even when multiple are visible during the swipe.
function Slide({ accent, label, title, children, footer }) {
  return (
    <div style={{
      // Full container width — Instagram-style one-card-at-a-time. The
      // outer flex wrapper carries the width sizing so swipe snapping
      // works; the visual card fills 100% of that wrapper.
      width: "100%",
      // Square card (Instagram feed post proportions). Height tracks
      // width so it autofits any phone — no fixed pixel value to retune.
      aspectRatio: "1 / 1",
      scrollSnapAlign: "center",
      background: `${accent}18`,
      border: `1px solid ${accent}44`,
      borderRadius: 22,
      padding: "20px 22px",
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
      {/* Body — no inner scroll. Long text fields are pre-chunked into
          multiple slides so nothing spills past the card edge. */}
      <div style={{ flex: 1, overflow: "hidden", color: C.muted, fontSize: 14, lineHeight: 1.7 }}>
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

  // Card shape is square (aspect-ratio: 1) — no explicit pixel height
  // any more; the Slide component sizes itself from its own width.

  // Build slide list. Long text sections (why / how / goal / tip) are
  // split into card-sized chunks so nothing overflows; each chunk
  // becomes its own slide, with a "1/2"-style continuation label when
  // the section spans more than one card.
  const slides = [];

  // Task slide — icon + short task line. Task text is usually short, so
  // no chunking here.
  slides.push({
    key: "task",
    accent,
    label: `🎯 День ${todayDayData.day} · ${todayDayData.type}`,
    title: todayDayData.title,
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
  });

  // Helper: append one slide per chunk for a long-text section.
  function pushChunked({ key, text, label, title, slideAccent = accent, maxChars }) {
    const chunks = chunkText(text, maxChars);
    chunks.forEach((chunk, i) => {
      slides.push({
        key: `${key}-${i}`,
        accent: slideAccent,
        label: chunks.length > 1 ? `${label} · ${i + 1}/${chunks.length}` : label,
        title,
        content: <div style={{ whiteSpace: "pre-line" }}>{chunk}</div>,
      });
    });
  }

  if (todayDayData.info?.why)        pushChunked({ key: "why",  text: todayDayData.info.why,        label: "📖 Почему это важно", title: "Контекст" });
  if (todayDayData.info?.howTo)      pushChunked({ key: "how",  text: todayDayData.info.howTo,      label: "✅ Как это делать",   title: "Действия" });
  if (todayDayData.info?.weekTarget) pushChunked({ key: "goal", text: todayDayData.info.weekTarget, label: "🎯 Цель",             title: "На сегодня" });

  // Day-8 weekly stats — structured grid, not chunkable.
  if (todayDayData.isWeeklyStats && profile.logs.length > 0) {
    slides.push({
      key: "stats",
      accent: C.accent,
      label: `📊 Статистика за неделю ${currentWeekData?.week || 1}`,
      title: "Твои средние",
      content: <WeeklyStatsContent profile={profile} />,
    });
  }

  // Tip slide — bigger font (16 vs 14) means it holds less text per
  // card, so we use a tighter chunk budget.
  const tipChunks = chunkText(todayDayData.tip.text, 320);
  tipChunks.forEach((chunk, i) => {
    slides.push({
      key: `tip-${i}`,
      accent: C.accent,
      label: tipChunks.length > 1
        ? `💡 ${todayDayData.tip.cat} · ${i + 1}/${tipChunks.length}`
        : `💡 ${todayDayData.tip.cat}`,
      title: "Знал?",
      content: (
        <div style={{ fontSize: 16, lineHeight: 1.7, color: C.text, fontWeight: 500 }}>
          {chunk}
        </div>
      ),
    });
  });

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

  // Single pulse chevron on the right edge — visible only on slide 0 to
  // teach the swipe gesture. Once the user moves past the first card the
  // affordance has done its job, so it vanishes.
  const showNextHint = activeIdx === 0 && slides.length > 1;

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
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
          @keyframes form16-swipe-hint{
            0%{transform:translate(0,-50%);opacity:0.55}
            50%{transform:translate(5px,-50%);opacity:1}
            100%{transform:translate(0,-50%);opacity:0.55}
          }
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
            >
              {s.content}
            </Slide>
          </div>
        ))}
      </div>

      {/* Swipe-right pulse arrow — only on the first slide. Once the
          user has swiped at least once, the affordance is no longer
          needed and disappears. */}
      {showNextHint && (
        <button
          aria-label="Следующий слайд"
          onClick={() => scrollTo(activeIdx + 1)}
          style={{
            position: "absolute",
            top: "50%",
            right: 0,
            transform: "translate(0,-50%)",
            background: "transparent",
            border: "none",
            width: 22,
            height: 22,
            padding: 0,
            lineHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            cursor: "pointer",
            animation: "form16-swipe-hint 1.4s ease-in-out infinite",
            zIndex: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block" }}>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

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
