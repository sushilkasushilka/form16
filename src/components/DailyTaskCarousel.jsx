// Daily lesson carousel — renders the day's `slides` array from PROGRAM (v2).
// Each slide carries a `kind` field that picks one of five layouts:
// cover / lesson / callout / action / reflection. The day-level data is
// resolved to the user's current language by getTodayData(profile, lang)
// before it reaches this component, so we read `slide.body` (etc.) directly.
//
// Action/reflection slides save the user's input into the existing
// daily_reflections table (Phase A schema). One row per (user, day);
// repeated saves on the same day overwrite the previous response.
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase.js";
import { C, F } from "../theme.js";
import { t } from "../i18n.js";

// English literal — the placeholder sentinel that data authors leave in
// slide fields before content lands. Compared as a plain string (rule #4).
const TODO = "{TODO}";

// Day-type → header chip icon. Keys are English literals matching PROGRAM
// day.type values; not translated.
const TYPE_ICON = {
  lesson:     "📖",
  action:     "✅",
  reflection: "🔄",
};

// Day-type → accent color used for the progress bar, frame border, and
// button background. Falls back to "lesson" for any unrecognized type.
const TYPE_ACCENT = {
  lesson:     C.blue,
  action:     C.orange,
  reflection: C.accent,
};

const KNOWN_TYPES = ["lesson", "action", "reflection"];
const LIST_MAX_ITEMS = 5;

function typeIcon(type)   { return TYPE_ICON[type]   || TYPE_ICON.lesson; }
function typeAccent(type) { return TYPE_ACCENT[type] || TYPE_ACCENT.lesson; }
function typeLabel(type)  {
  const safe = KNOWN_TYPES.includes(type) ? type : "lesson";
  return t(`v2.day_type.${safe}`);
}

// ─── SLIDE FRAME ─────────────────────────────────────────────────────────
// Outer card shape shared by every kind. `tinted` is used by callouts to
// stand out from neighbouring lesson cards in the swipe rhythm.
function SlideFrame({ accent, tinted, children }) {
  return (
    <div style={{
      width: "100%",
      aspectRatio: "1 / 1",
      scrollSnapAlign: "center",
      background: tinted ? `${accent}26` : `${accent}10`,
      border: `1px solid ${accent}${tinted ? "66" : "33"}`,
      borderRadius: 22,
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      overflow: "hidden",
      fontFamily: F.sans,
    }}>
      {children}
    </div>
  );
}

function SourceFooter({ source }) {
  if (!source || source === TODO) return null;
  return (
    <div style={{ marginTop: 14, fontSize: 10, color: C.muted, fontStyle: "italic", flexShrink: 0, lineHeight: 1.4 }}>
      {source}
    </div>
  );
}

// ─── COVER ───────────────────────────────────────────────────────────────
function CoverSlide({ slide, accent, type }) {
  const hookIsTodo = slide.hook === TODO;
  const hook = hookIsTodo ? t("v2.slide_fallback.cover_todo") : slide.hook;
  return (
    <SlideFrame accent={accent}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "16px 0" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: `${accent}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, marginBottom: 22,
        }}>
          {typeIcon(type)}
        </div>
        <div style={{
          fontFamily: F.serif,
          fontSize: 22,
          fontWeight: 500,
          color: C.text,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          maxWidth: 340,
        }}>
          {hook}
        </div>
      </div>
    </SlideFrame>
  );
}

// ─── LESSON ──────────────────────────────────────────────────────────────
function LessonSlide({ slide, accent }) {
  const bodyIsTodo = slide.body === TODO;
  const body = bodyIsTodo ? t("v2.slide_fallback.lesson_todo") : slide.body;
  return (
    <SlideFrame accent={accent}>
      <div style={{
        flex: 1,
        overflow: "auto",
        color: C.text,
        fontSize: 14.5,
        lineHeight: 1.65,
        fontFamily: F.sans,
      }}>
        {body}
      </div>
      <SourceFooter source={bodyIsTodo ? null : slide.source} />
    </SlideFrame>
  );
}

// ─── CALLOUT ─────────────────────────────────────────────────────────────
function CalloutSlide({ slide, accent }) {
  const headlineIsTodo = slide.headline === TODO;
  const headline = headlineIsTodo ? t("v2.slide_fallback.lesson_todo") : slide.headline;
  const subtext = headlineIsTodo
    ? null
    : (slide.subtext === TODO ? null : slide.subtext);
  return (
    <SlideFrame accent={accent} tinted>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          fontFamily: F.serif,
          fontSize: 34,
          fontWeight: 600,
          color: accent,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          marginBottom: 16,
        }}>
          {headline}
        </div>
        {subtext && (
          <div style={{
            fontSize: 15,
            color: C.text,
            lineHeight: 1.55,
            fontFamily: F.sans,
          }}>
            {subtext}
          </div>
        )}
      </div>
      <SourceFooter source={headlineIsTodo ? null : slide.source} />
    </SlideFrame>
  );
}

// ─── ACTION / REFLECTION (shared input renderer) ─────────────────────────
// Both kinds carry a `prompt` + optional `inputType: "text" | "list"`.
// Saves to daily_reflections keyed by (user_id, day_number). Note: one row
// per day — repeat saves overwrite, and IdentityCard saves to the same
// table on Days 4–14 with prompt_key `v2.identity.day{N}`, so whichever
// surface a user types into last wins on overlapping days. This is a
// known constraint of the existing schema and out of scope for Phase L.5b.1.
function InputSlide({ slide, accent, dayNumber, profile, kind }) {
  const isList = slide.inputType === "list";
  const promptIsTodo = slide.prompt === TODO;
  const fallbackKey = kind === "reflection"
    ? "v2.slide_fallback.reflection_todo"
    : "v2.slide_fallback.action_todo";
  const prompt = promptIsTodo ? t(fallbackKey) : slide.prompt;
  const promptKey = `v2.slide.${kind}.day${dayNumber}`;

  // Hooks first, no conditional return above them (rule #2).
  // loading starts true only when we'll actually fetch; otherwise it starts
  // false so we never need to call setLoading inside the effect on the
  // no-fetch path (avoids react-hooks/set-state-in-effect lint rule).
  const shouldFetch = Boolean(profile?.id && dayNumber);
  const [text, setText] = useState("");
  const [items, setItems] = useState([""]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(shouldFetch);

  useEffect(() => {
    if (!shouldFetch) return;
    let cancelled = false;
    supabase
      .from("daily_reflections")
      .select("response, prompt_key")
      .eq("user_id", profile.id)
      .eq("day_number", dayNumber)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.response && data.prompt_key === promptKey) {
          if (isList) {
            try {
              const parsed = JSON.parse(data.response);
              if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
            } catch {
              setItems([data.response]);
            }
          } else {
            setText(data.response);
          }
          setSaved(true);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [shouldFetch, profile?.id, dayNumber, promptKey, isList]);

  const hasContent = isList
    ? items.some(it => it.trim())
    : !!text.trim();

  async function handleSave() {
    if (!hasContent) return;
    const payload = isList
      ? JSON.stringify(items.map(it => it.trim()).filter(Boolean))
      : text.trim();
    const { error } = await supabase.from("daily_reflections").upsert({
      user_id: profile.id,
      day_number: dayNumber,
      prompt_key: promptKey,
      response: payload,
    }, { onConflict: "user_id,day_number" });
    if (!error) setSaved(true);
  }

  function updateItem(idx, val) {
    const next = [...items];
    next[idx] = val;
    setItems(next);
    setSaved(false);
  }

  function addItem() {
    if (items.length >= LIST_MAX_ITEMS) return;
    setItems([...items, ""]);
  }

  return (
    <SlideFrame accent={accent}>
      <div style={{
        fontSize: 15,
        color: C.text,
        lineHeight: 1.5,
        marginBottom: 14,
        fontWeight: 500,
        fontFamily: F.sans,
      }}>
        {prompt}
      </div>
      <div style={{ flex: 1, overflow: "auto", marginBottom: 14, minHeight: 0 }}>
        {isList ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((it, idx) => (
              <input
                key={idx}
                type="text"
                value={it}
                onChange={e => updateItem(idx, e.target.value)}
                placeholder="…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  color: C.text,
                  fontSize: 13,
                  fontFamily: F.sans,
                  outline: "none",
                }}
              />
            ))}
            {items.length < LIST_MAX_ITEMS && (
              <button
                type="button"
                onClick={addItem}
                style={{
                  background: "none",
                  border: `1px dashed ${C.border}`,
                  color: C.muted,
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontFamily: F.sans,
                  alignSelf: "flex-start",
                }}
              >
                + {t("v2.slide_save.add_item")}
              </button>
            )}
          </div>
        ) : (
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setSaved(false); }}
            placeholder="…"
            style={{
              width: "100%",
              height: "100%",
              minHeight: 120,
              boxSizing: "border-box",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "12px 14px",
              color: C.text,
              fontSize: 13.5,
              fontFamily: F.sans,
              outline: "none",
              resize: "none",
              lineHeight: 1.55,
            }}
          />
        )}
      </div>
      <button
        onClick={handleSave}
        disabled={!hasContent || saved || loading}
        style={{
          padding: "10px 16px",
          borderRadius: 12,
          background: saved ? `${accent}22` : (hasContent ? accent : C.dim),
          color: saved ? accent : (hasContent ? C.bg : C.muted),
          border: "none",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: F.sans,
          cursor: hasContent && !saved ? "pointer" : "default",
          flexShrink: 0,
          alignSelf: "flex-start",
        }}
      >
        {saved ? t("v2.slide_save.saved") : t("v2.slide_save.save_button")}
      </button>
    </SlideFrame>
  );
}

// ─── DISPATCHER ──────────────────────────────────────────────────────────
function SlideRenderer({ slide, accent, type, dayNumber, profile }) {
  switch (slide?.kind) {
    case "cover":
      return <CoverSlide slide={slide} accent={accent} type={type} />;
    case "lesson":
      return <LessonSlide slide={slide} accent={accent} />;
    case "callout":
      return <CalloutSlide slide={slide} accent={accent} />;
    case "action":
      return <InputSlide slide={slide} accent={accent} dayNumber={dayNumber} profile={profile} kind="action" />;
    case "reflection":
      return <InputSlide slide={slide} accent={accent} dayNumber={dayNumber} profile={profile} kind="reflection" />;
    default:
      // Unknown / missing kind — render a lesson-style TODO so the carousel
      // still has something to show instead of an empty card.
      return <LessonSlide slide={{ kind: "lesson", body: TODO }} accent={accent} />;
  }
}

// ─── CAROUSEL ────────────────────────────────────────────────────────────
export function DailyTaskCarousel({ todayDayData, profile }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [chevronArmed, setChevronArmed] = useState(true);
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);

  // Derived (not hooks): safe to compute before any conditional return.
  const slides = Array.isArray(todayDayData?.slides) && todayDayData.slides.length > 0
    ? todayDayData.slides
    : [{ kind: "lesson", body: TODO }];
  const type = todayDayData?.type || "lesson";
  const accent = typeAccent(type);
  const dayNumber = todayDayData?.day || 0;

  // Track which slide is centred → drives progress bar fill.
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

  // Disarm the swipe-hint chevron on first interaction.
  useEffect(() => {
    if (!chevronArmed) return;
    const track = scrollRef.current;
    if (!track) return;
    const onScroll = () => {
      if (track.scrollLeft > 8) setChevronArmed(false);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [chevronArmed]);

  const scrollTo = idx => {
    const el = cardRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const showNextHint = slides.length > 1 && chevronArmed && activeIdx === 0;
  const progressPct = ((activeIdx + 1) / slides.length) * 100;

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      {/* Header chip — day number + type icon + localized type label. */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        fontSize: 11,
        color: C.muted,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontFamily: F.sans,
      }}>
        <span style={{ fontSize: 14 }}>{typeIcon(type)}</span>
        <span>{t("v2.daily.day_label")} {dayNumber} · {typeLabel(type)}</span>
        <span style={{ marginLeft: "auto", color: C.muted, fontWeight: 500, letterSpacing: "0.04em" }}>
          {activeIdx + 1} / {slides.length}
        </span>
      </div>

      {/* Progress bar — Instagram Stories style, ~2px, fills with accent. */}
      <div style={{
        width: "100%",
        height: 2,
        background: C.dim,
        borderRadius: 1,
        marginBottom: 12,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${progressPct}%`,
          height: "100%",
          background: accent,
          transition: "width 0.3s cubic-bezier(.16,1,.3,1)",
        }} />
      </div>

      {/* Scroll-snap track. */}
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
          @keyframes form16-swipe-hint{
            0%{transform:translateX(0);opacity:0.55}
            50%{transform:translateX(5px);opacity:1}
            100%{transform:translateX(0);opacity:0.55}
          }
        `}</style>
        {slides.map((s, i) => (
          <div
            key={i}
            ref={el => (cardRefs.current[i] = el)}
            data-idx={i}
            style={{ flex: "0 0 100%", scrollSnapAlign: "center" }}
          >
            <SlideRenderer
              slide={s}
              accent={accent}
              type={type}
              dayNumber={dayNumber}
              profile={profile}
            />
          </div>
        ))}
      </div>

      {/* Swipe-right hint chevron — only visible on slide 0 until first scroll. */}
      {slides.length > 1 && (
        <div
          style={{
            position: "absolute",
            top: "60%",
            right: 0,
            transform: "translateY(-50%)",
            zIndex: 2,
            opacity: showNextHint ? 1 : 0,
            pointerEvents: showNextHint ? "auto" : "none",
            transition: "opacity 0.45s ease-out",
          }}
        >
          <button
            aria-label="next slide"
            onClick={() => { setChevronArmed(false); scrollTo(activeIdx + 1); }}
            style={{
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
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block" }}>
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
