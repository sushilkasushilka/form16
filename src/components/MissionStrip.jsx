// MissionStrip — week-at-a-glance ribbon for the user's current program week.
//
// One row of 7 circles (День 1–7). The circle is a "pie" split into N equal
// sectors, one per metric tracked in the current week. A sector is filled
// in the accent color when that metric was hit for the day. So a Week 1
// user who only filed their morning report sees a half-filled circle; a
// user who also filed evening sees a fully filled circle.
//
// Per-week metric sets:
//   W1     — weight + food log (any calorie entry)
//   W2     — weight + total calories logged
//   W3     — weight + hit calorie target + hit protein target
//   W4     — + hit step target
//   W5–16  — + hit greens target
//
// "Hit target" rules (against `profile.dailyTargets`):
//   calories — within ±10% of target
//   protein  — ≥ 80% of target
//   steps    — ≥ 80% of target
//   greens   — `log.greens === true` (boolean from evening log)
//
// Tapping a circle toggles the expanded per-day metric grid (it no longer
// opens the program-task modal — that affordance lives elsewhere now).
import { useState } from "react";
import { C, F } from "../theme.js";
import { Icon } from "./icons.jsx";

// Russian short weekday labels, indexed by JS Date.getDay()
// (0=Sun, 1=Mon … 6=Sat). The strip labels each circle with the actual
// calendar weekday for that program day, so a Tuesday signup lands
// day 1 on Wednesday and the ribbon reads Ср · Чт · Пт · Сб · Вс · Пн · Вт.
const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const METRICS = {
  weight:         { label: "Вес",        check: (l)    => l?.weight > 0 },
  food:           { label: "Еда",        check: (l)    => l?.calories > 0 },
  calories:       { label: "Калории",    check: (l)    => l?.calories > 0 },
  caloriesTarget: { label: "Цель ккал",  check: (l, targets) => l?.calories > 0 && !!targets?.calories
                                                        && l.calories >= targets.calories * 0.9
                                                        && l.calories <= targets.calories * 1.1 },
  proteinTarget:  { label: "Цель белка", check: (l, targets) => l?.protein > 0 && !!targets?.protein && l.protein >= targets.protein * 0.8 },
  stepsTarget:    { label: "Цель шагов", check: (l, targets) => l?.steps > 0 && !!targets?.steps && l.steps >= targets.steps * 0.8 },
  greensTarget:   { label: "Овощи",      check: (l)    => l?.greens === true },
};

function metricIdsForWeek(weekNum) {
  // Aligned to curriculum unlock days: calorie Day 18 (Week 3),
  // protein Day 24 (mid-Week 4 — snapped to Week 4 here since the
  // MissionStrip is week-granular), steps Day 33 (Week 5), greens Week 4.
  if (weekNum <= 2) return ["weight"];
  if (weekNum === 3) return ["weight", "caloriesTarget"];
  if (weekNum === 4) return ["weight", "caloriesTarget", "proteinTarget", "greensTarget"];
  return ["weight", "caloriesTarget", "proteinTarget", "stepsTarget", "greensTarget"];
}

// Sectored day circle — splits the disc into N equal pie wedges (one per
// metric tracked this week) and fills the "done" wedges with the accent
// colour. The day number sits in a small surface-coloured medallion at the
// center so it stays legible regardless of which wedges are filled.
function SectoredDay({ segments, dayInWeek, isToday, isFuture }) {
  const size = 36;
  const cx = size / 2, cy = size / 2;
  const r = (size - 2) / 2;
  const innerR = r * 0.62;
  const n = Math.max(1, segments.length);

  // Build SVG wedge paths. With a single segment we fall back to a circle to
  // dodge the 360° arc degeneracy.
  const rad = (deg) => ((deg - 90) * Math.PI) / 180;
  const point = (a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];

  const anyDone = segments.some(s => s.done);
  const allDone = segments.length > 0 && segments.every(s => s.done);
  const missed  = !isToday && !isFuture && !anyDone;

  // Border + day-number colour rules. Today's accent halo wins.
  const borderColor = isToday ? C.accent : isFuture ? C.dim : missed ? C.red : C.border;
  const borderDash  = missed ? "3 3" : "";
  const textColor   = isToday ? C.accent : isFuture ? C.muted : C.text;

  return (
    <div style={{
      position: "relative",
      width: size, height: size,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: isToday ? `0 0 0 2px ${C.bg}, 0 0 0 4px ${C.accent}` : "none",
      borderRadius: "50%",
      opacity: isFuture ? 0.7 : 1,
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Filled wedges (only when the metric was hit) */}
        {n === 1
          ? segments[0]?.done && (
              <circle cx={cx} cy={cy} r={r} fill={C.accent} />
            )
          : segments.map((seg, i) => {
              if (!seg.done) return null;
              const start = (360 / n) * i;
              const end   = (360 / n) * (i + 1);
              const [x1, y1] = point(start);
              const [x2, y2] = point(end);
              const large = end - start > 180 ? 1 : 0;
              return (
                <path
                  key={i}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={C.accent}
                />
              );
            })}

        {/* Sector separators when more than one segment exists — gives the
            "split into N parts" affordance even if no wedge is filled. */}
        {n > 1 && segments.map((_, i) => {
          const a = (360 / n) * i;
          const [x, y] = point(a);
          return (
            <line key={`sep-${i}`} x1={cx} y1={cy} x2={x} y2={y}
                  stroke={allDone ? C.accent : C.border} strokeWidth={1} />
          );
        })}

        {/* Outer ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={borderColor}
          strokeWidth={1.5}
          strokeDasharray={borderDash || undefined}
        />

        {/* Inner medallion so the digit reads cleanly over any wedge */}
        <circle cx={cx} cy={cy} r={innerR} fill={C.surface} />
      </svg>

      <span style={{
        position: "absolute",
        fontFamily: F.serif,
        fontSize: 13, fontWeight: 600,
        color: textColor,
        lineHeight: 1,
      }}>{dayInWeek}</span>
    </div>
  );
}

export function MissionStrip({
  profile,
  userGlobalDay,
  currentWeekNum,
  currentWeekData,
  // `onDaySelected` is intentionally unused now — kept in the signature so
  // existing callers don't need to change. The week-task affordance was
  // removed from the day circles per design.
}) {
  const [expanded, setExpanded] = useState(false);
  const targets = profile?.dailyTargets || {};
  const metricIds = metricIdsForWeek(currentWeekNum);

  const weekStartGlobalDay = (currentWeekNum - 1) * 7 + 1;
  const days = Array.from({ length: 7 }, (_, i) => {
    const gd = weekStartGlobalDay + i;
    const date = new Date(profile.joinedAt);
    date.setDate(date.getDate() + gd);
    const dateStr = date.toISOString().split("T")[0];
    const log = profile.logs.find(l => l.date === dateStr);
    const isToday  = gd === userGlobalDay;
    const isFuture = gd > userGlobalDay;
    const segments = metricIds.map(id => ({
      id,
      done: !isFuture && METRICS[id].check(log, targets),
    }));
    return {
      gd, dateStr, log, isToday, isFuture, segments,
      dayInWeek: i + 1,
      // Pull the label from the calendar weekday of the actual date
      // (not the position-in-week), so the ribbon reflects the user's
      // real Mon/Tue/… as they live them.
      label: WEEKDAY_LABELS[date.getDay()],
      programDay: currentWeekData?.days?.[i],
    };
  });

  const toggleExpand = () => setExpanded(v => !v);

  return (
    <>
      {/* Section header — matches the rest of the today tab */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        margin: "4px 0 12px",
      }}>
        <div style={{
          fontSize: 10, color: C.muted, fontWeight: 500,
          textTransform: "uppercase", letterSpacing: "0.12em",
        }}>Задача недели</div>
        <button
          onClick={toggleExpand}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: 11, padding: 0,
            fontFamily: F.sans, letterSpacing: "0.02em",
          }}
        >
          {expanded ? "Свернуть ↑" : "Раскрыть ↓"}
        </button>
      </div>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "16px 14px",
        marginBottom: 22,
      }}>
        {/* Day circles — tap any one to toggle the expanded metric grid */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
          {days.map(d => (
            <button
              key={d.gd}
              onClick={toggleExpand}
              aria-label={`День ${d.dayInWeek}${d.isToday ? " (сегодня)" : ""} — ${d.segments.filter(s=>s.done).length}/${d.segments.length} выполнено`}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                padding: "4px 0",
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                // Kill the iOS tap-flash + the focus halo around the day
                // number that read as a "blink" after a tap. The circle
                // itself already telegraphs "tap me" via its accent halo
                // for today, so no extra focus styling is needed.
                WebkitTapHighlightColor: "transparent",
                outline: "none",
              }}
            >
              <SectoredDay
                segments={d.segments}
                dayInWeek={d.dayInWeek}
                isToday={d.isToday}
                isFuture={d.isFuture}
              />
              <div style={{
                fontSize: 10,
                color: d.isToday ? C.accent : C.muted,
                fontWeight: d.isToday ? 600 : 500,
                letterSpacing: "0.04em",
              }}>{d.label}</div>
            </button>
          ))}
        </div>

        {/* Expanded per-day metric grid — animates downward from its top
            edge so the panel reads as opening top-to-bottom (we used to use
            slideUp, which made the panel feel like it grew bottom-up). */}
        {expanded && (
          <div style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${C.border}`,
            // 1s reveal — slower, more deliberate "drawer drops down" feel.
            animation: "revealDown 1s cubic-bezier(.16,1,.3,1) both",
            transformOrigin: "top",
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <td style={{ width: 90, paddingBottom: 10 }}/>
                  {days.map(d => (
                    <td key={d.gd} style={{ textAlign: "center", paddingBottom: 10, width: 32 }}>
                      <div style={{
                        fontSize: 10,
                        color: d.isToday ? C.accent : C.muted,
                        fontWeight: d.isToday ? 600 : 500,
                        letterSpacing: "0.02em",
                      }}>{d.label}</div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricIds.map(id => {
                  const m = METRICS[id];
                  return (
                    <tr key={id}>
                      <td style={{
                        padding: "6px 0", fontSize: 12, color: C.text,
                        fontWeight: 500, whiteSpace: "nowrap",
                      }}>{m.label}</td>
                      {days.map(d => {
                        const done = m.check(d.log, targets);
                        const future = d.isFuture;
                        const missed = !future && !d.isToday && !done;
                        const fillBg = done
                          ? (d.isToday ? C.accent : C.text)
                          : "transparent";
                        const borderStyle = done
                          ? `1px solid ${d.isToday ? C.accent : C.text}`
                          : missed
                          ? `1px dashed ${C.dim}`
                          : `1px solid ${C.dim}`;
                        return (
                          <td key={d.gd} style={{ textAlign: "center", padding: "6px 2px" }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: 5, margin: "0 auto",
                              background: fillBg,
                              border: borderStyle,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: done ? C.bg : "transparent",
                              opacity: future ? 0.45 : 1,
                            }}>
                              {done && <Icon name="check" size={11} strokeWidth={2.2} />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
