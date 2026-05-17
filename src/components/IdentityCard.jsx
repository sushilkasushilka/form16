// Identity affirmation prompt — appears on the home screen Days 4–14 only.
// One day-specific prompt per day, persisted to daily_reflections table.
//
// Hidden on Days 6, 7, 12, 14 because the DailyTaskCarousel renders an
// ActionSlide / ReflectionSlide on those days that writes to the same
// daily_reflections row (UNIQUE on user_id+day_number). Showing both
// surfaces would let the user enter two different responses on the same
// day and silently overwrite each other on save.
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, F } from "../theme.js";
import { t } from "../i18n.js";

// English literals — day numbers where the carousel owns the day's reflection
// input. Rule #4: not translated, not derived from locale.
const COLLISION_DAYS = [6, 7, 12, 14];

export function IdentityCard({ profile, currentDay }) {
  const [response, setResponse] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const promptKey = `v2.identity.day${currentDay}`;

  useEffect(() => {
    if (!profile?.id || currentDay < 4 || currentDay > 14) {
      setLoading(false); return;
    }
    supabase
      .from("daily_reflections")
      .select("response")
      .eq("user_id", profile.id)
      .eq("day_number", currentDay)
      .single()
      .then(({ data }) => {
        if (data?.response) {
          setResponse(data.response);
          setSaved(true);
        }
        setLoading(false);
      });
  }, [profile?.id, currentDay]);

  async function handleSave() {
    if (!response.trim()) return;
    await supabase
      .from("daily_reflections")
      .upsert({
        user_id: profile.id,
        day_number: currentDay,
        prompt_key: promptKey,
        response: response.trim(),
      }, { onConflict: "user_id,day_number" });
    setSaved(true);
  }

  if (loading || currentDay < 4 || currentDay > 14) return null;
  // Carousel owns the reflection on these days — skip rendering so the two
  // surfaces don't fight over the same daily_reflections row.
  if (COLLISION_DAYS.includes(currentDay)) return null;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 18, padding: "14px 18px", marginBottom: 14,
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
        {t("v2.identity.label")} · {t("v2.identity.day_prefix", { day: currentDay })}
      </div>
      <div style={{ fontSize: 14, color: C.text, marginBottom: 10, lineHeight: 1.5, fontStyle: "italic" }}>
        {t(promptKey)}
      </div>
      <textarea
        value={response}
        onChange={e => { setResponse(e.target.value.slice(0, 300)); setSaved(false); }}
        rows={2}
        placeholder="…"
        style={{
          width: "100%", boxSizing: "border-box",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "10px 12px", color: C.text, fontSize: 13,
          fontFamily: F.sans, outline: "none", resize: "none", lineHeight: 1.55,
        }}
      />
      <button onClick={handleSave} disabled={!response.trim() || saved}
        style={{
          marginTop: 8, padding: "8px 14px", borderRadius: 10,
          background: saved ? C.accentDim : (response.trim() ? C.accent : C.dim),
          color: saved ? C.accent : (response.trim() ? C.bg : C.muted),
          border: "none", fontSize: 12, fontWeight: 500,
          fontFamily: F.sans, cursor: response.trim() && !saved ? "pointer" : "default",
        }}>
        {saved ? `✓ ${t("v2.identity.saved")}` : t("v2.identity.save")}
      </button>
    </div>
  );
}
