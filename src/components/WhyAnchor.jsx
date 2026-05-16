// Pinned "Why I'm here" anchor card — visible on every home screen from Day 0
// to Day 112. Three states:
//   - empty (currentDay < 3 and no initial_why): placeholder, not editable
//   - cta (currentDay >= 3 and no initial_why): prompt to write one
//   - filled (initial_why set): displays the quote with an edit affordance
import { useState } from "react";
import { C, F } from "../theme.js";
import { t } from "../i18n.js";

export function WhyAnchor({ profile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.initialWhy || "");
  const currentDay = profile.currentDay ?? 0; // caller passes via prop or it derives from getUserGlobalDay

  const hasWhy = !!profile.initialWhy;
  const canEdit = currentDay >= 3 || hasWhy;

  function handleSave() {
    onSave(draft.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{
        background: C.accentDim, border: `1px solid ${C.accent}44`,
        borderRadius: 18, padding: "14px 18px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          {t("v2.why.anchor.label")}
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, 200))}
          placeholder={t("v2.why.placeholder")}
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "10px 12px", color: C.text, fontSize: 14,
            fontFamily: F.sans, outline: "none", resize: "none", lineHeight: 1.5,
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={handleSave} disabled={!draft.trim()}
            style={{
              flex: 1, padding: "10px", borderRadius: 10,
              background: draft.trim() ? C.accent : C.dim,
              color: draft.trim() ? C.bg : C.muted,
              border: "none", fontSize: 13, fontWeight: 500,
              fontFamily: F.sans, cursor: draft.trim() ? "pointer" : "default",
            }}>
            {t("v2.identity.save")}
          </button>
          <button onClick={() => { setDraft(profile.initialWhy || ""); setEditing(false); }}
            style={{
              padding: "10px 14px", borderRadius: 10, background: "none",
              border: `1px solid ${C.border}`, color: C.muted, fontSize: 13,
              fontFamily: F.sans, cursor: "pointer",
            }}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (!hasWhy && currentDay < 3) {
    return (
      <div style={{
        background: C.card, border: `1px dashed ${C.border}`,
        borderRadius: 18, padding: "14px 18px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
          {t("v2.why.anchor.label")}
        </div>
        <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
          {t("v2.why.anchor.empty")}
        </div>
      </div>
    );
  }

  if (!hasWhy && currentDay >= 3) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{
          width: "100%", textAlign: "left",
          background: C.card, border: `1px solid ${C.accent}88`,
          borderRadius: 18, padding: "14px 18px", marginBottom: 14,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
          {t("v2.why.anchor.label")}
        </div>
        <div style={{ fontSize: 13, color: C.accent, fontWeight: 500 }}>
          {t("v2.why.anchor.add")}
        </div>
      </button>
    );
  }

  return (
    <div style={{
      background: C.accentDim, border: `1px solid ${C.accent}44`,
      borderRadius: 18, padding: "14px 18px", marginBottom: 14,
      position: "relative",
    }}>
      <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
        {t("v2.why.anchor.label")}
      </div>
      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55, fontStyle: "italic", paddingRight: 36 }}>
        «{profile.initialWhy}»
      </div>
      <button onClick={() => { setDraft(profile.initialWhy); setEditing(true); }}
        style={{
          position: "absolute", top: 12, right: 12,
          background: "none", border: "none", color: C.muted,
          fontSize: 11, cursor: "pointer", fontFamily: "inherit",
        }}>
        {t("v2.why.anchor.edit")}
      </button>
    </div>
  );
}
