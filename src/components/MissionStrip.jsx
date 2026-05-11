// MissionStrip — week-at-a-glance ribbon. One row of 7 circles (День 1–7
// of the user's current program week) plus an optional expanded grid that
// breaks down each day by the metrics expected for the current program week.
//
// Circle color reflects today's completion against the same per-week metric
// set that the expanded grid uses, so the two views agree:
//
//   green ring + halo — today (always)
//   green             — every expected metric was hit
//   orange            — some hit, some missed
//   red               — none hit (and the day is in the past)
//   muted             — future days
//
// Per-week metric sets:
//   W1     — weight + food log (any calorie entry)
//   W2     — weight + total calories logged
//   W3     — weight + hit calorie target + hit protein target
//   W4     — + hit step target
//   W5–16  — + hit greens target
//
// "Hit target" means logged value within the per-day target band:
//   calories: within ±10% of `dailyTargets.calories`
//   protein:  ≥ 80% of `dailyTargets.protein`
//   steps:    ≥ 80% of `dailyTargets.steps`
//   greens:   `log.greens === true` (the boolean from the evening log)
//
// Tapping any day circle opens the existing read-only DayDetailModal for
// that day's program task via `onDaySelected`.
import { useState } from "react";
import { C } from "../theme.js";

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Each metric carries its own predicate over (log, dailyTargets). Keeping
// them keyed by id (not week) makes the per-week list an array of refs and
// avoids duplicating predicate logic.
const METRICS = {
  weight: {
    label: "Вес",
    check: (l) => l?.weight > 0,
  },
  food: {
    label: "Еда",
    check: (l) => l?.calories > 0,
  },
  calories: {
    label: "Калории",
    check: (l) => l?.calories > 0,
  },
  caloriesTarget: {
    label: "Цель ккал",
    check: (l, t) => l?.calories > 0 && !!t?.calories
      && l.calories >= t.calories * 0.9
      && l.calories <= t.calories * 1.1,
  },
  proteinTarget: {
    label: "Цель белка",
    check: (l, t) => l?.protein > 0 && !!t?.protein && l.protein >= t.protein * 0.8,
  },
  stepsTarget: {
    label: "Цель шагов",
    check: (l, t) => l?.steps > 0 && !!t?.steps && l.steps >= t.steps * 0.8,
  },
  greensTarget: {
    label: "Овощи",
    check: (l) => l?.greens === true,
  },
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

function statusColor(ratio, isToday, isFuture) {
  if (isToday)  return { fill: C.green, text: "#fff" };
  if (isFuture) return { fill: C.dim,   text: C.muted };
  if (ratio === 1)  return { fill: C.green,  text: "#fff" };
  if (ratio > 0)    return { fill: C.orange, text: "#fff" };
  return                    { fill: C.red,    text: "#fff" };
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
    const color = statusColor(ratio, isToday, isFuture);
    return {
      gd, dateStr, log, isToday, isFuture,
      met, total, color,
      dayInWeek: i + 1,
      label: DAY_LABELS[i],
      programDay: currentWeekData?.days?.[i],
    };
  });

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      padding: "14px 16px",
      marginBottom: 14,
    }}>
      {/* Strip header — title + expand/collapse toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{
          fontSize: 11, color: C.muted, fontWeight: 700,
          letterSpacing: 0.8, textTransform: "uppercase",
        }}>Миссия недели</div>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: 12, padding: 4,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {expanded ? "Свернуть ↑" : "Раскрыть ↓"}
        </button>
      </div>

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
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              opacity: d.isFuture ? 0.55 : 1,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: d.color.fill,
              boxShadow: d.isToday
                ? `0 0 0 2px ${C.bg}, 0 0 0 4px ${C.green}`
                : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne',sans-serif",
              fontSize: 14, fontWeight: 800,
              color: d.color.text,
              transition: "all 0.18s",
            }}>
              {d.dayInWeek}
            </div>
            <div style={{
              fontSize: 10,
              color: d.isToday ? C.green : C.muted,
              fontWeight: d.isToday ? 700 : 500,
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
                <td style={{ width: 96, paddingBottom: 8 }}/>
                {days.map(d => (
                  <td key={d.gd} style={{ textAlign: "center", paddingBottom: 8 }}>
                    <div style={{
                      fontSize: 10,
                      color: d.isToday ? C.green : C.muted,
                      fontWeight: d.isToday ? 700 : 400,
                    }}>{d.label}</div>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricIds.map(id => {
                const m = METRICS[id];
                return (
                  <tr key={id} style={{ borderTop: `0.5px solid ${C.border}` }}>
                    <td style={{
                      padding: "6px 0", fontSize: 11, color: C.muted, whiteSpace: "nowrap",
                    }}>{m.label}</td>
                    {days.map(d => {
                      const done = m.check(d.log, targets);
                      const future = d.isFuture;
                      const missed = !future && !d.isToday && !done;
                      return (
                        <td key={d.gd} style={{ textAlign: "center", padding: "6px 2px" }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 6, margin: "0 auto",
                            background: done ? `${C.green}33` : C.surface,
                            border: missed
                              ? `1.5px dashed ${C.border}`
                              : done
                              ? "none"
                              : `0.5px solid ${C.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11,
                            color: done ? C.green : "transparent",
                            opacity: future ? 0.3 : 1,
                          }}>
                            {done ? "✓" : ""}
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
  );
}
