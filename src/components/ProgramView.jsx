// Mountain-trail timeline view of the 16-week program.
// Day 112 (summit) at the top, day 1 (start) at the bottom, on a winding path.
// Scenery: valley → forest → rocky alpine → snowy summit, with two bridges
// across springs. On first entry, scrolls from summit down to today.

import { useEffect, useRef, Fragment } from "react";
import { C, F } from "../theme.js";
import { PROGRAM, getUserGlobalDay } from "../program.js";
import { Icon } from "./icons.jsx";

// ─── Geometry ─────────────────────────────────────────────────────────
const FREE_DAYS       = 14;
const TOTAL_DAYS      = 112;
const ROW_HEIGHT      = 44;
const PATH_TOP_PAD    = 60;
const PATH_BOTTOM_PAD = 40;
const PAYWALL_GAP     = 120;   // extra vertical space inserted between day 7 and day 8
const PAYWALL_BAND_H  = 84;    // height of the visible paywall band
const CLIMB_HEIGHT    = PATH_TOP_PAD + TOTAL_DAYS * ROW_HEIGHT + PAYWALL_GAP + PATH_BOTTOM_PAD;

const dayX = d => {
  const t = d - 1;
  return 50
    + 13 * Math.sin((t / 25.5) * Math.PI * 2 + 0.3)
    +  7 * Math.sin((t /  9.3) * Math.PI * 2 - 1.2)
    +  3 * Math.sin((t /  4.7) * Math.PI * 2 + 2.1);
};
// Piecewise: days 1-7 anchored to the bottom; days 8-112 sit above the paywall band.
const dayY = d => {
  const base = CLIMB_HEIGHT - PATH_BOTTOM_PAD - (d - 1) * ROW_HEIGHT;
  return d >= FREE_DAYS + 1 ? base - PAYWALL_GAP : base;
};
// Approximate inverse — fine for scenery placement; paywall zone returns a fractional day
// that's never used (no scenery placed inside the band).
const yToDay = y => {
  const flat = 1 + (CLIMB_HEIGHT - PATH_BOTTOM_PAD - y) / ROW_HEIGHT;
  return flat <= FREE_DAYS ? flat : flat + PAYWALL_GAP / ROW_HEIGHT;
};
const pathXAt = y => dayX(yToDay(y));

// Paywall band centered between day 7 and day 8
const PAYWALL_BAND_MID = (dayY(FREE_DAYS) + dayY(FREE_DAYS + 1)) / 2;
const PAYWALL_BAND_TOP = PAYWALL_BAND_MID - PAYWALL_BAND_H / 2;

// Catmull-Rom → cubic bezier through every day point.
const PATH_D = (() => {
  const pts = [];
  for (let d = TOTAL_DAYS; d >= 1; d--) pts.push({ x: dayX(d), y: dayY(d) });
  if (pts.length < 2) return "";
  const ext = [pts[0], ...pts, pts[pts.length - 1]];
  let s = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = ext[i], p1 = ext[i + 1], p2 = ext[i + 2], p3 = ext[i + 3];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    s += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return s;
})();

// ─── Scenery placement ────────────────────────────────────────────────
function seededRand(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const SCENE = (() => {
  const rand = seededRand(42);

  function place(kind, count, yMin, yMax, gapMin, gapMax) {
    const out = [];
    for (let i = 0; i < count; i++) {
      // Pure-random y for an organic clumpy distribution (some sparse, some dense).
      const yPos = yMin + rand() * (yMax - yMin);
      const pathX = pathXAt(yPos);
      // Narrow side — opposite of day title. Code on this side is short
      // (~14% of container) and gap >= 17 clears it.
      const textOnRight = pathX < 50;
      const side = textOnRight ? -1 : 1;
      const gap = gapMin + rand() * (gapMax - gapMin);
      const x = Math.max(3, Math.min(97, pathX + side * gap));
      const rotation = (rand() - 0.5) * 16;  // ±8° lean
      const scale    = 0.78 + rand() * 0.46; // 0.78–1.24
      out.push({
        kind, x, y: yPos,
        variant: Math.floor(rand() * 3),
        rotation, scale,
      });
    }
    return out;
  }

  const ySummit = CLIMB_HEIGHT * 0.10;
  const yRocky  = CLIMB_HEIGHT * 0.40;
  const yValley = CLIMB_HEIGHT * 0.78;
  const yBottom = CLIMB_HEIGHT - PATH_BOTTOM_PAD + 16;

  let decorations = [];

  // Halved item counts for a calmer, more readable trail.
  // gapMin >= 17 keeps items past the day-code column on the narrow side.
  decorations.push(...place("grass",     19, yValley, yBottom, 17, 30));
  decorations.push(...place("flower",    12, yValley, yBottom, 18, 32));
  decorations.push(...place("bush",       8, yValley, yBottom, 19, 30));

  decorations.push(...place("conifer",   17, yRocky, yValley, 20, 34));
  decorations.push(...place("broadleaf",  9, yRocky, yValley, 20, 32));
  decorations.push(...place("bush",       6, yRocky, yValley, 19, 30));

  decorations.push(...place("rock",          11, ySummit, yRocky, 19, 32));
  decorations.push(...place("snowy_conifer",  5, ySummit, yRocky, 20, 32));

  decorations.push(...place("snow", 7, 60, ySummit, 18, 32));

  const flag = { x: dayX(112), y: dayY(112) - 8 };

  return { decorations, flag };
})();

// ─── Component ────────────────────────────────────────────────────────
export function ProgramView({ profile, onDaySelect, onUpgrade }) {
  const userGlobalDay = getUserGlobalDay(profile);
  const subscribed = !!profile.is_subscribed;
  const animDone = useRef(false);

  useEffect(() => {
    if (animDone.current) return;
    animDone.current = true;
    const scroller = document.scrollingElement || document.documentElement;
    scroller.scrollTo({ top: 0 });
    const t = setTimeout(() => {
      const el = document.getElementById(`day-marker-${Math.max(1, userGlobalDay)}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 900);
    return () => clearTimeout(t);
  }, [userGlobalDay]);

  // Day list, top→bottom
  const days = [];
  for (let gd = TOTAL_DAYS; gd >= 1; gd--) {
    const weekNum = Math.ceil(gd / 7);
    const dayInWeek = ((gd - 1) % 7) + 1;
    const wkData = PROGRAM[weekNum - 1];
    const dayData = wkData?.days[dayInWeek - 1];
    days.push({ globalDay: gd, weekNum, dayInWeek, weekData: wkData, dayData });
  }

  // Week dividers: between week N+1 (above) and N (below). N = 15..1.
  const dividers = [];
  for (let N = 15; N >= 1; N--) {
    const fracDay = N * 7 + 0.5;
    dividers.push({ weekNum: N, y: dayY(fracDay) });
  }

  return (
    <div style={{ animation: "slideUp 0.28s both" }}>
      <SummitHeader theme={PROGRAM[15]?.theme} />

      <div style={{
        position: "relative",
        width: "100%",
        height: CLIMB_HEIGHT,
        maxWidth: 430,
        margin: "0 auto",
      }}>
        {/* Scenery — under everything */}
        {SCENE.decorations.map((dec, i) => (
          <Decoration key={`d-${i}`} {...dec} />
        ))}

        {/* Week dividers — left-aligned label + dashed line across */}
        {dividers.map(div => (
          <div key={`wk-${div.weekNum}`} style={{
            position: "absolute",
            left: 0, right: 0,
            top: div.y,
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            pointerEvents: "none",
            zIndex: 1,
          }}>
            <div style={{
              fontSize: 10,
              color: div.weekNum > 1 ? C.muted : C.text,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
              fontFamily: F.sans,
              whiteSpace: "nowrap",
              paddingRight: 10,
              background: C.bg,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              Неделя {div.weekNum}
              {div.weekNum > 1 && <Icon name="check" size={10} strokeWidth={2} />}
            </div>
            <div style={{ flex: 1, borderTop: `1px dashed ${C.dim}` }} />
          </div>
        ))}

        {/* Path — over scenery and dashed dividers */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible", zIndex: 2 }}
          viewBox={`0 0 100 ${CLIMB_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <path
            d={PATH_D}
            stroke={C.muted}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.9"
          />
        </svg>

        {/* Summit flag */}
        <div style={{
          position: "absolute",
          left: `${SCENE.flag.x}%`, top: SCENE.flag.y,
          transform: "translate(-50%, -100%)",
          pointerEvents: "none", zIndex: 4,
        }}>
          <FlagSvg />
        </div>

        {/* Paywall band — only shown for non-subscribers */}
        {!subscribed && (
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            top: PAYWALL_BAND_TOP,
            height: PAYWALL_BAND_H,
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            gap: 14,
            zIndex: 4,
            fontFamily: F.sans,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: C.accentDim, color: C.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name="lock" size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10, color: C.accent, letterSpacing: "0.18em",
                textTransform: "uppercase", fontWeight: 500,
              }}>Премиум</div>
              <div style={{
                fontFamily: F.serif, fontSize: 18, fontWeight: 400,
                letterSpacing: "-0.015em", marginTop: 2, lineHeight: 1.2,
                color: C.text,
              }}>Открой ещё 14 недель</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                98 заданий · ИИ-тренер
              </div>
            </div>
            <button
              onClick={() => onUpgrade && onUpgrade()}
              style={{
                background: C.accent, color: C.bg,
                border: "none", borderRadius: 999,
                padding: "10px 16px",
                fontSize: 13, fontWeight: 500,
                fontFamily: F.sans, cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >Открыть →</button>
          </div>
        )}

        {/* Day markers + info */}
        {days.map(d => {
          const x = dayX(d.globalDay);
          const y = dayY(d.globalDay);
          const unlocked    = d.globalDay <= FREE_DAYS || subscribed;
          const isToday     = d.globalDay === userGlobalDay;
          const isCompleted = d.globalDay < userGlobalDay && userGlobalDay > 0;
          const isStart     = d.globalDay === 1 && !isToday;
          const isSummit    = d.globalDay === TOTAL_DAYS && !isToday;
          const infoOnRight = x < 50;
          const handleTap   = () => unlocked
            ? onDaySelect(d.weekData, d.dayData)
            : onUpgrade && onUpgrade(d.weekNum);

          return (
            <Fragment key={d.globalDay}>
              <div
                id={`day-marker-${d.globalDay}`}
                onClick={handleTap}
                style={{
                  position: "absolute",
                  left: `${x}%`, top: y,
                  transform: "translate(-50%, -50%)",
                  zIndex: 5,
                  cursor: unlocked ? "pointer" : "default",
                  padding: 8,
                }}
              >
                <DayDot {...{ unlocked, isToday, isCompleted, isStart, isSummit }} />
              </div>
              {/* Day code — narrow side (path's swing side) */}
              <div
                onClick={handleTap}
                style={{
                  position: "absolute",
                  top: y,
                  transform: "translateY(-50%)",
                  ...(infoOnRight
                    ? { right: `calc(${100 - x}% + 18px)` }
                    : { left: `calc(${x}% + 18px)` }
                  ),
                  zIndex: 4,
                  cursor: unlocked ? "pointer" : "default",
                  fontFamily: F.sans,
                }}
              >
                <DayCode {...{ globalDay: d.globalDay, isToday, unlocked }} />
              </div>
              {/* Title — wide side */}
              <div
                onClick={handleTap}
                style={{
                  position: "absolute",
                  top: y,
                  transform: "translateY(-50%)",
                  ...(infoOnRight
                    ? { left: `calc(${x}% + 18px)`, right: 16 }
                    : { right: `calc(${100 - x}% + 18px)`, left: 16 }
                  ),
                  textAlign: infoOnRight ? "left" : "right",
                  zIndex: 4,
                  cursor: unlocked ? "pointer" : "default",
                  fontFamily: F.sans,
                }}
              >
                <DayTitle {...{ dayData: d.dayData, unlocked, isToday, isCompleted }} />
              </div>
            </Fragment>
          );
        })}
      </div>

      <StartFooter theme={PROGRAM[0]?.theme} />
    </div>
  );
}

// ─── Summit + Start ───────────────────────────────────────────────────
function SummitHeader({ theme }) {
  return (
    <div style={{ padding: "60px 22px 14px", textAlign: "center" }}>
      <svg width="260" height="118" viewBox="0 0 260 118" fill="none" stroke={C.text}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ margin: "0 auto", display: "block" }}>
        {/* Far ridge */}
        <path d="M 0 96 L 28 74 L 50 85 L 76 64 L 100 78 L 130 56 L 162 72 L 198 60 L 226 76 L 260 84"
          strokeWidth="0.6" opacity="0.45" />
        {/* Middle ridge */}
        <path d="M 0 108 L 36 66 L 64 84 L 92 50 L 122 70 L 152 48 L 184 68 L 218 56 L 260 92"
          strokeWidth="0.85" opacity="0.75" />
        {/* Main range — prominent */}
        <path d="M 0 114 L 50 46 L 80 78 L 122 12 L 158 60 L 200 32 L 260 94"
          strokeWidth="1.4" />
        {/* Snow lines on main peak */}
        <path d="M 106 26 L 122 12 L 132 22 L 140 18" strokeWidth="1" />
        <path d="M 110 36 L 128 22 L 138 32" strokeWidth="0.7" />
        {/* Tiny flag on the topmost peak */}
        <line x1="122" y1="12" x2="122" y2="3" strokeWidth="1" />
        <path d="M 122 3 L 132 5.5 L 122 8 Z" fill={C.accent} stroke={C.accent} strokeWidth="0.5" />
      </svg>
      <div style={{
        fontSize: 10, color: C.muted, letterSpacing: "0.18em",
        textTransform: "uppercase", fontWeight: 500, marginTop: 16,
      }}>
        Вершина · 16 недель
      </div>
      <div style={{
        fontFamily: F.serif, fontSize: 34, fontWeight: 400,
        letterSpacing: "-0.025em", marginTop: 6, color: C.text,
      }}>
        День 112
      </div>
      {theme && (
        <div style={{
          fontSize: 13, color: C.muted, lineHeight: 1.55,
          maxWidth: 280, margin: "8px auto 0",
        }}>
          {theme}
        </div>
      )}
    </div>
  );
}

function StartFooter({ theme }) {
  // No "ты здесь" or extra dot — the trail's day-1 milestone marker IS the start.
  // This is just a caption beneath the climb so the page closes cleanly.
  return (
    <div style={{ padding: "12px 22px 80px", textAlign: "center" }}>
      <div style={{
        fontSize: 10, color: C.muted, letterSpacing: "0.18em",
        textTransform: "uppercase", fontWeight: 500,
      }}>
        Старт программы
      </div>
      {theme && (
        <div style={{
          fontSize: 12, color: C.muted, lineHeight: 1.6,
          marginTop: 8, maxWidth: 280, margin: "8px auto 0",
        }}>
          {theme}
        </div>
      )}
    </div>
  );
}

// ─── Day marker + info ────────────────────────────────────────────────
function DayCode({ globalDay, isToday, unlocked }) {
  return (
    <div style={{
      fontFamily: F.mono, fontSize: 11,
      fontWeight: isToday ? 600 : 500,
      color: isToday ? C.accent : C.muted,
      letterSpacing: isToday ? "0.08em" : "0.04em",
      textTransform: isToday ? "uppercase" : "none",
      display: "inline-flex", alignItems: "center", gap: 5,
      whiteSpace: "nowrap",
    }}>
      <span>{isToday ? "Сегодня" : `Д${globalDay}`}</span>
      {!unlocked && !isToday && <Icon name="lock" size={10} strokeWidth={1.6} />}
    </div>
  );
}

function DayTitle({ dayData, unlocked, isToday, isCompleted }) {
  const titleColor = isToday
    ? C.accent
    : (unlocked || isCompleted) ? C.text : C.muted;
  return (
    <div style={{
      fontSize: 13, fontWeight: 500, color: titleColor,
      lineHeight: 1.3,
      display: "-webkit-box",
      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }}>
      {dayData?.title || "—"}
    </div>
  );
}

function DayDot({ unlocked, isToday, isCompleted, isStart, isSummit }) {
  if (isToday) {
    // Big accent dot with a radiating sonar pulse — unmissable.
    return (
      <div style={{ position: "relative", width: 26, height: 26 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: C.accent,
          animation: "pulseRing 1.8s ease-out infinite",
          transformOrigin: "center",
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: C.accent,
          border: `3px solid ${C.bg}`,
          boxShadow: `0 0 0 1.5px ${C.accent}`,
        }} />
      </div>
    );
  }
  if (isStart) {
    // Start milestone — always a filled accent medal, even when "completed".
    return <div style={{
      width: 16, height: 16, borderRadius: "50%", background: C.accent,
      border: `3px solid ${C.bg}`, boxShadow: `0 0 0 1px ${C.accent}`,
    }} />;
  }
  if (isSummit) {
    // Summit milestone — hollow accent ring; pairs with the flag SVG above.
    return <div style={{
      width: 16, height: 16, borderRadius: "50%", background: C.bg,
      border: `2.5px solid ${C.accent}`, boxShadow: `0 0 0 1px ${C.bg}`,
    }} />;
  }
  if (isCompleted) {
    return <div style={{
      width: 10, height: 10, borderRadius: "50%", background: C.text,
      border: `2px solid ${C.bg}`,
    }} />;
  }
  if (unlocked) {
    return <div style={{
      width: 10, height: 10, borderRadius: "50%", background: C.bg,
      border: `1.5px solid ${C.text}`,
    }} />;
  }
  return <div style={{
    width: 7, height: 7, borderRadius: "50%", background: C.bg,
    border: `1px solid ${C.dim}`,
  }} />;
}

// ─── Scenery: decoration host ─────────────────────────────────────────
function Decoration({ kind, x, y, variant, rotation = 0, scale = 1 }) {
  return (
    <div style={{
      position: "absolute",
      left: `${x}%`, top: y,
      transform: `translate(-50%, -100%) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(2)})`,
      transformOrigin: "50% 100%",
      pointerEvents: "none",
      zIndex: 0,
      color: C.muted,
    }}>
      <ItemSvg kind={kind} variant={variant} />
    </div>
  );
}

// ─── Scenery: individual SVG drawings ─────────────────────────────────
function ItemSvg({ kind, variant = 0 }) {
  switch (kind) {
    case "conifer":      return <ConiferSvg variant={variant} />;
    case "broadleaf":    return <BroadleafSvg variant={variant} />;
    case "bush":         return <BushSvg variant={variant} />;
    case "flower":       return <FlowerSvg variant={variant} />;
    case "grass":        return <GrassSvg variant={variant} />;
    case "rock":         return <RockSvg variant={variant} />;
    case "snowy_conifer":return <SnowyConiferSvg />;
    case "snow":         return <SnowSvg />;
    default: return null;
  }
}

// Tall layered pine — three triangles stacked, white-filled so they read as overlapping branches
function ConiferSvg({ variant }) {
  // Three size variants
  if (variant === 1) {
    // Tall slim — 4 tiers
    return (
      <svg width="20" height="38" viewBox="0 0 20 38" fill="none">
        <path d="M 10 27 L 2 36 L 18 36 Z" fill={C.bg} stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
        <path d="M 10 19 L 3 28 L 17 28 Z" fill={C.bg} stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
        <path d="M 10 11 L 4 20 L 16 20 Z" fill={C.bg} stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
        <path d="M 10 3 L 5 12 L 15 12 Z" fill={C.bg} stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
        <rect x="8.5" y="36" width="3" height="2" fill="currentColor"/>
      </svg>
    );
  }
  if (variant === 2) {
    // Short bushy — 2 tiers
    return (
      <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
        <path d="M 11 14 L 2 24 L 20 24 Z" fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
        <path d="M 11 4 L 5 16 L 17 16 Z" fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
        <rect x="9.5" y="24" width="3" height="2" fill="currentColor"/>
      </svg>
    );
  }
  // Default — classic 3-tier
  return (
    <svg width="22" height="34" viewBox="0 0 22 34" fill="none">
      <path d="M 11 21 L 2 31 L 20 31 Z" fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M 11 12 L 4 23 L 18 23 Z" fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M 11 3 L 6 15 L 16 15 Z" fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <rect x="9.5" y="31" width="3" height="3" fill="currentColor"/>
    </svg>
  );
}

// Broadleaf — round foliage with visible trunk and a few branches showing through
function BroadleafSvg({ variant }) {
  const sizes = [
    { w: 22, h: 32 },
    { w: 26, h: 36 },
    { w: 20, h: 30 },
  ];
  const { w, h } = sizes[variant % 3];
  return (
    <svg width={w} height={h} viewBox="0 0 22 32" fill="none">
      {/* trunk + small base */}
      <path d="M 11 14 L 11 29" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M 9 29 L 13 29 L 13 31 L 9 31 Z" fill="currentColor"/>
      {/* two branches reaching into the canopy */}
      <path d="M 11 20 L 7 16" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M 11 22 L 15 18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      {/* round canopy */}
      <circle cx="11" cy="10" r="8" fill={C.bg} stroke="currentColor" strokeWidth="1.1"/>
      {/* small notches on the canopy edge for leaf texture */}
      <path d="M 5 10 Q 6 11 7 10" stroke="currentColor" strokeWidth="0.7" fill="none"/>
      <path d="M 15 10 Q 16 11 17 10" stroke="currentColor" strokeWidth="0.7" fill="none"/>
      <path d="M 9 3.5 Q 10 4.5 11 3.5" stroke="currentColor" strokeWidth="0.7" fill="none"/>
    </svg>
  );
}

// Fluffy bush — three bumps merged into one silhouette
function BushSvg() {
  return (
    <svg width="24" height="15" viewBox="0 0 24 15" fill="none">
      <path d="
        M 2 13
        C 1 10 3 7 6 8
        C 6 4 11 4 12 7.5
        C 13 5 17 5 18 8.5
        C 21 8 23 11 21 13
        Z"
        fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M 7 13 Q 8 11 8 13" stroke="currentColor" strokeWidth="0.5"/>
      <path d="M 14 13 Q 15 11 15 13" stroke="currentColor" strokeWidth="0.5"/>
    </svg>
  );
}

// Flower — accent color, choose daisy or tulip per variant
function FlowerSvg({ variant }) {
  if (variant === 1) {
    // Tulip
    return (
      <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
        <path d="M 5.5 9 L 5.5 17" stroke={C.muted} strokeWidth="0.8" strokeLinecap="round"/>
        <path d="M 5.5 13 L 8 11.5" stroke={C.muted} strokeWidth="0.7" strokeLinecap="round"/>
        <path d="M 5.5 12 L 3 13" stroke={C.muted} strokeWidth="0.7" strokeLinecap="round"/>
        <path d="M 2 7 C 2 3 9 3 9 7 Q 7 5 5.5 7 Q 4 5 2 7 Z" fill={C.bg} stroke={C.accent} strokeWidth="0.9" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (variant === 2) {
    // Single bud
    return (
      <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
        <path d="M 4.5 7 L 4.5 15" stroke={C.muted} strokeWidth="0.8" strokeLinecap="round"/>
        <path d="M 4.5 11 L 7 10" stroke={C.muted} strokeWidth="0.7" strokeLinecap="round"/>
        <circle cx="4.5" cy="4" r="2" fill={C.bg} stroke={C.accent} strokeWidth="0.9"/>
        <circle cx="4.5" cy="4" r="0.7" fill={C.accent}/>
      </svg>
    );
  }
  // Daisy
  return (
    <svg width="13" height="18" viewBox="0 0 13 18" fill="none">
      <path d="M 6.5 9 L 6.5 17" stroke={C.muted} strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M 6.5 12 L 9 11" stroke={C.muted} strokeWidth="0.7" strokeLinecap="round"/>
      <circle cx="6.5" cy="3.5" r="1.4" fill={C.bg} stroke={C.accent} strokeWidth="0.8"/>
      <circle cx="3.5" cy="5.5" r="1.4" fill={C.bg} stroke={C.accent} strokeWidth="0.8"/>
      <circle cx="9.5" cy="5.5" r="1.4" fill={C.bg} stroke={C.accent} strokeWidth="0.8"/>
      <circle cx="6.5" cy="7.5" r="1.4" fill={C.bg} stroke={C.accent} strokeWidth="0.8"/>
      <circle cx="6.5" cy="5.5" r="0.9" fill={C.accent}/>
    </svg>
  );
}

// Grass — three curved blades
function GrassSvg({ variant }) {
  if (variant === 1) {
    return (
      <svg width="10" height="9" viewBox="0 0 10 9" fill="none">
        <path d="M 2 9 Q 2 5 1 1" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
        <path d="M 5 9 Q 6 5 5 0" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
        <path d="M 8 9 Q 7 5 9 2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      </svg>
    );
  }
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M 5 8 Q 3 4 2 1" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      <path d="M 5 8 L 5 0" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      <path d="M 5 8 Q 7 4 8 1" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// Rocks — a small cluster, big rock with two pebbles
function RockSvg({ variant }) {
  const sizes = [{w:24,h:14},{w:30,h:18},{w:20,h:12}];
  const { w, h } = sizes[variant % 3];
  return (
    <svg width={w} height={h} viewBox="0 0 28 17" fill="none">
      {/* main rock */}
      <path d="M 5 16 L 7 8 L 11 4 L 16 6 L 20 10 L 22 16 Z"
        fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      {/* crack line */}
      <path d="M 11 4 L 13 9" stroke="currentColor" strokeWidth="0.6"/>
      {/* pebble left */}
      <path d="M 1 16 L 3 13 L 6 14 L 6 16 Z"
        fill={C.bg} stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/>
      {/* pebble right */}
      <path d="M 21 16 L 23 13 L 26 14 L 27 16 Z"
        fill={C.bg} stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/>
    </svg>
  );
}

// Snow-dusted conifer — pine + snow lines on the branches
function SnowyConiferSvg() {
  return (
    <svg width="22" height="34" viewBox="0 0 22 34" fill="none">
      <path d="M 11 21 L 2 31 L 20 31 Z" fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M 11 12 L 4 23 L 18 23 Z" fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M 11 3 L 6 15 L 16 15 Z" fill={C.bg} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <rect x="9.5" y="31" width="3" height="3" fill="currentColor"/>
      {/* snow caps on each tier */}
      <path d="M 9 5 L 11 3 L 13 5" stroke={C.text} strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M 5 14 Q 8 16 11 14" stroke={C.text} strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      <path d="M 11 14 Q 14 16 17 14" stroke={C.text} strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      <path d="M 3 22 Q 7 24 11 22" stroke={C.text} strokeWidth="0.8" strokeLinecap="round" fill="none"/>
      <path d="M 11 22 Q 15 24 19 22" stroke={C.text} strokeWidth="0.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// Snow patch — wavy line of snow on the ground
function SnowSvg() {
  return (
    <svg width="28" height="8" viewBox="0 0 28 8" fill="none">
      <path d="M 1 6 Q 5 2 9 5 Q 14 8 18 5 Q 22 2 27 6"
        stroke={C.text} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Summit flag — pennant on a pole anchored in a small cairn ────────
function FlagSvg() {
  return (
    <svg width="34" height="52" viewBox="0 0 34 52" fill="none">
      {/* cairn */}
      <path d="M 1 48 Q 6 42 11 48 L 11 52 L 1 52 Z"
        fill={C.bg} stroke={C.text} strokeWidth="1" strokeLinejoin="round"/>
      <path d="M 4 48 L 5 45 L 7 48" stroke={C.text} strokeWidth="0.6"/>
      {/* pole */}
      <line x1="6" y1="3" x2="6" y2="48" stroke={C.text} strokeWidth="1.5" strokeLinecap="round"/>
      {/* pennant — triangular with a small cutout suggesting wind */}
      <path d="M 6 5 L 30 9 L 22 14 L 30 19 L 6 23 Z"
        fill={C.accent} stroke={C.accent} strokeWidth="0.6" strokeLinejoin="round"/>
      {/* small dot on flag */}
      <circle cx="13" cy="13" r="1.2" fill={C.bg}/>
    </svg>
  );
}
