// MissionStrip — week-at-a-glance ribbon. One row of 7 circles (День 1–7
// of the user's current program week). Each circle is colored by completion:
//
//   green   — every expected metric was logged
//   orange  — some logged, some missed
//   red     — none logged (and the day is in the past)
//   green ring + halo — today (always highlighted)
//   muted   — future days
//
// "Expected metrics" depends on the program week (matches the legacy habit
// grid): weight + meals from week 1, + steps from week 2.
//
// This component is purely the at-a-glance strip. The day's task content
// lives in a separate carousel section below; tapping a circle opens the
// existing read-only DayDetailModal for that day via `onDaySelected`.
import { C } from "../theme.js";

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function dayCompletion(log, weekNum) {
  const expected = ["weight", "calories"];
  if (weekNum >= 2) expected.push("steps");
  let met = 0;
  for (const k of expected) {
    if (log?.[k] != null && log[k] > 0) met++;
  }
  return { met, total: expected.length };
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
  const weekStartGlobalDay = (currentWeekNum - 1) * 7 + 1;
  const days = Array.from({ length: 7 }, (_, i) => {
    const gd = weekStartGlobalDay + i;
    const date = new Date(profile.joinedAt);
    date.setDate(date.getDate() + gd);
    const dateStr = date.toISOString().split("T")[0];
    const log = profile.logs.find(l => l.date === dateStr);
    const isToday  = gd === userGlobalDay;
    const isFuture = gd > userGlobalDay;
    const { met, total } = dayCompletion(log, currentWeekNum);
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
      <div style={{
        fontSize: 11, color: C.muted, fontWeight: 700,
        letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12,
      }}>Миссия недели</div>

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
    </div>
  );
}
