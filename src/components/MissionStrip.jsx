// MissionStrip — week-at-a-glance ribbon for the user's current program week.
// Re-ported into the Sciencebody "Lab" aesthetic: paper background, hairline
// borders, single accent green, Fraunces serif for the day number, Onest sans
// for labels.
//
// One row of 7 circles (День 1–7). Each circle is colored by completion
// against the per-week metric set:
//
//   today    — solid accent + halo (always, regardless of completion)
//   hit all  — solid accent fill, white text
//   partial  — hollow with amber hairline border, amber text
//   missed   — hollow with red dashed border, red text   (past day only)
//   future   — hollow with dim hairline, muted text
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
// Tap any circle to open the existing read-only DayDetailModal for that
// day's program task via `onDaySelected`. Tap "Раскрыть" to expand a
// per-day metrics grid; the same metric set is used for both views so
// they always agree.
import { useState } from "react";
import { C, F } from "../theme.js";
import { Icon } from "./icons.jsx";

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const METRICS = {
  weight:         { label: "Вес",        check: (l)    => l?.weight > 0 },
  food:           { label: "Еда",        check: (l)    => l?.calories > 0 },
  calories:       { label: "Калории",    check: (l)    => l?.calories > 0 },
  caloriesTarget: { label: "Цель ккал",  check: (l, t) => l?.calories > 0 && !!t?.calories
                                                        && l.calories >= t.calories * 0.9
                                                        && l.calories <= t.calories * 1.1 },
  proteinTarget:  { label: "Цель белка", check: (l, t) => l?.protein > 0 && !!t?.protein && l.protein >= t.protein * 0.8 },
  stepsTarget:    { label: "Цель шагов", check: (l, t) => l?.steps > 0 && !!t?.steps && l.steps >= t.steps * 0.8 },
  greensTarget:   { label: "Овощи",      check: (l)    => l?.greens === true },
};

function metricIdsForWeek(weekNum) {
  if (weekNum <= 1) return ["weight", "food"];
  if (weekNum === 2) return ["weight", "calories"];
  if (weekNum === 3) return ["weight", "caloriesTarget", "proteinTarget"];
  if (weekNum === 4) return ["weight", "caloriesTarget", "proteinTarget", "stepsTarget"];
  return ["weight", "caloriesTarget", "proteinTarget", "stepsTarget", "greensTarget"];
}

function dayCompletion(log, weekNum, dailyTargets) {
  const ids = metricIdsForWeek(weekNum);
  let met = 0;
  for (const id of ids) {
    if (METRICS[id].check(log, dailyTargets)) met++;
  }
  return { met, total: ids.length };
}

// Lab-styled circle states. Today wins over completion so the
// "you are here" affordance is unmistakable.
function circleStyle(ratio, isToday, isFuture) {
  if (isToday) return {
    fill:   C.accent,
    border: C.accent,
    text:   "#fff",
    halo:   true,
    dashed: false,
  };
  if (isFuture) return {
    fill:   "transparent",
    border: C.dim,
    text:   C.muted,
    halo:   false,
    dashed: false,
  };
  if (ratio === 1) return {
    fill:   C.text,
    border: C.text,
    text:   C.bg,
    halo:   false,
    dashed: false,
  };
  if (ratio > 0) return {
    fill:   "transparent",
    border: C.yellow,
    text:   C.yellow,
    halo:   false,
    dashed: false,
  };
  // none hit on a past day
  return {
    fill:   "transparent",
    border: C.red,
    text:   C.red,
    halo:   false,
    dashed: true,
  };
}

export function MissionStrip({
  profile,
  userGlobalDay,
  currentWeekNum,
  currentWeekData,
  onDaySelected,
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
    const { met, total } = dayCompletion(log, currentWeekNum, targets);
    const ratio = total ? met / total : 0;
    const style = circleStyle(ratio, isToday, isFuture);
    return {
      gd, dateStr, log, isToday, isFuture,
      met, total, style,
      dayInWeek: i + 1,
      label: DAY_LABELS[i],
      programDay: currentWeekData?.days?.[i],
    };
  });

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
        }}>Миссия недели</div>
        <button
          onClick={() => setExpanded(v => !v)}
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
        {/* Day circles */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
          {days.map(d => (
            <button
              key={d.gd}
              onClick={() => d.programDay && onDaySelected?.(currentWeekData, d.programDay)}
              aria-label={`День ${d.dayInWeek}${d.isToday ? " (сегодня)" : ""}`}
              disabled={!d.programDay}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                padding: "4px 0",
                cursor: d.programDay ? "pointer" : "default",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                opacity: d.isFuture ? 0.7 : 1,
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: d.style.fill,
                border: `1.5px ${d.style.dashed ? "dashed" : "solid"} ${d.style.border}`,
                boxShadow: d.style.halo
                  ? `0 0 0 2px ${C.bg}, 0 0 0 4px ${C.accent}`
                  : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F.serif,
                fontSize: 14, fontWeight: 600,
                color: d.style.text,
                transition: "all 0.18s",
              }}>
                {d.dayInWeek}
              </div>
              <div style={{
                fontSize: 10,
                color: d.isToday ? C.accent : C.muted,
                fontWeight: d.isToday ? 600 : 500,
                letterSpacing: "0.04em",
              }}>{d.label}</div>
            </button>
          ))}
        </div>

        {/* Expanded per-day metric grid */}
        {expanded && (
          <div style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${C.border}`,
            animation: "slideUp 0.25s both",
            overflowX: "auto",
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
