// MissionStrip — week-at-a-glance ribbon. One row of 7 circles (Mon..Sun)
// for the user's current program week. Each circle is colored by completion:
//
//   green   — every expected metric was logged
//   orange  — some logged, some missed
//   red     — none logged (and the day is in the past)
//   accent  — today (always highlighted, regardless of how much was logged)
//   muted   — future days
//
// "Expected metrics" depends on the program week (the same gating as the
// habit grid):  weight + meals from week 1, + steps from week 2.
//
// Tap any circle to expand the strip and reveal the per-day task content
// (DailyTaskCarousel). Tap the same circle again or the close handle to
// collapse. Today is selected by default after the user opens it once.
import { useState } from "react";
import { C } from "../theme.js";
import { DailyTaskCarousel } from "./DailyTaskCarousel.jsx";

// Russian short weekday labels in Mon-first order (program weeks always
// start on the user's signup weekday, not Monday — so these are just the
// "day 1..day 7" badges, named to feel familiar without implying actual
// calendar weekdays).
const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Returns { met, total } — how many of the day's expected metrics were
// logged. Mirrors the habit-grid logic so a green circle means the same
// thing in both places.
function dayCompletion(log, weekNum) {
  const expected = ["weight", "calories"];
  if (weekNum >= 2) expected.push("steps");
  let met = 0;
  for (const k of expected) {
    if (log?.[k] != null && log[k] > 0) met++;
  }
  return { met, total: expected.length };
}

// Maps a completion ratio to circle colors. Today always wins over the
// completion color so the "you are here" affordance is unmistakable.
function statusColor(ratio, isToday, isFuture) {
  if (isToday)  return { fill: C.green, text: "#fff", ring: C.green };
  if (isFuture) return { fill: C.dim,   text: C.muted, ring: "transparent" };
  if (ratio === 1)  return { fill: C.green,  text: "#fff", ring: "transparent" };
  if (ratio > 0)    return { fill: C.orange, text: "#fff", ring: "transparent" };
  return                    { fill: C.red,    text: "#fff", ring: "transparent" };
}

export function MissionStrip({
  profile,
  userGlobalDay,
  currentWeekNum,
  currentWeekData,
  onOpenDetails,
}) {
  const [selectedIdx, setSelectedIdx] = useState(null); // null = collapsed

  // The 7 days of the user's current program week. Each entry carries
  // both the program-side data (programDay) and the user-side data (log)
  // for its date.
  const weekStartGlobalDay = (currentWeekNum - 1) * 7 + 1;
  const days = Array.from({ length: 7 }, (_, i) => {
    const gd = weekStartGlobalDay + i;
    const date = new Date(profile.joinedAt);
    date.setDate(date.getDate() + gd);
    const dateStr = date.toISOString().split("T")[0];
    const log = profile.logs.find(l => l.date === dateStr);
    const isToday  = gd === userGlobalDay;
    const isPast   = gd < userGlobalDay;
    const isFuture = gd > userGlobalDay;
    const { met, total } = dayCompletion(log, currentWeekNum);
    const ratio = total ? met / total : 0;
    const color = statusColor(ratio, isToday, isFuture);
    return {
      gd, dateStr, log, isToday, isPast, isFuture,
      met, total, color,
      dayInWeek: i + 1,
      label: DAY_LABELS[i],
      programDay: currentWeekData?.days?.[i],
    };
  });

  const expanded = selectedIdx !== null && days[selectedIdx];

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      padding: "14px 16px",
      marginBottom: 14,
    }}>
      {/* Strip header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{
          fontSize: 11, color: C.muted, fontWeight: 700,
          letterSpacing: 0.8, textTransform: "uppercase",
        }}>Миссия недели</div>
        <button
          onClick={() => setSelectedIdx(prev => prev === null ? days.findIndex(d => d.isToday) : null)}
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
        {days.map((d, i) => {
          const isSelected = selectedIdx === i;
          return (
            <button
              key={d.gd}
              onClick={() => setSelectedIdx(isSelected ? null : i)}
              aria-label={`День ${d.dayInWeek}${d.isToday ? " (сегодня)" : ""}`}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                padding: "4px 0",
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                opacity: d.isFuture ? 0.55 : 1,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: d.color.fill,
                border: isSelected ? `2px solid ${C.text}` : `2px solid transparent`,
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
          );
        })}
      </div>

      {/* Expanded detail panel */}
      {expanded && expanded.programDay && (
        <div style={{ marginTop: 16, animation: "slideUp 0.25s both" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 10, fontSize: 11, color: C.muted,
          }}>
            <span>День {expanded.gd} · {expanded.label}</span>
            <span>
              {expanded.isFuture
                ? "будущее"
                : `${expanded.met}/${expanded.total} метрик отмечено`}
            </span>
          </div>
          <DailyTaskCarousel
            todayDayData={expanded.programDay}
            currentWeekData={currentWeekData}
            profile={profile}
            onOpenDetails={onOpenDetails}
          />
        </div>
      )}
    </div>
  );
}
