// New 4-step onboarding (v2). Identity-first, no goal selection,
// no NEAT collection (deferred to Day 33), no TDEE preview.
// Includes SCOFF eating disorder screener.
import { useState } from "react";
import { C } from "../theme.js";
import { todayStr, calcBMI } from "../utils.js";
import { t } from "../i18n.js";
import { ProgressDots, TextInput, NumberInput, PillSelect, CardSelect, Btn } from "../components/ui.jsx";
import { Avatar, AVATAR_OPTIONS } from "../components/icons.jsx";

const STEP_META = [
  { titleKey: "v2.step1.title", subKey: "v2.step1.subtitle" },
  { titleKey: "v2.step2.title", subKey: "v2.step2.subtitle" },
  { titleKey: "v2.step3.title", subKey: "v2.step3.subtitle" },
  { titleKey: "v2.step4.title", subKey: "v2.step4.subtitle" },
];

const SCOFF_QUESTIONS = ["q1", "q2", "q3", "q4", "q5"];

export function SignUp({ onComplete, onBack }) {
  // Step state — extended from v1 to support 4 steps + SCOFF substeps
  const [step, setStep] = useState(0);
  // Within step 3 (safety), substeps: conditions → scoff intro → 5 questions → maybe flagged
  const [step3Sub, setStep3Sub] = useState("conditions"); // conditions | scoffIntro | scoffQ1..5 | scoffFlagged | scoffOk
  const [scoffIndex, setScoffIndex] = useState(0);

  const [f, setF] = useState({
    // Step 1 — identity
    previousAttempts: "",
    initialWhy: "",
    // Step 2 — body
    avatar: "fox",
    name: "",
    gender: "male",
    age: "",
    height: "",
    weight: "",
    // Step 3 — safety
    conditions: [],
    scoffAnswers: [null, null, null, null, null],
    scoffAcknowledged: false,
    // Step 4 — logistics
    morningTime: "07:00",
    eveningTime: "21:00",
    notificationsEnabled: false,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Derived
  const wNum = parseFloat(f.weight), hNum = parseFloat(f.height);
  const bmi = (wNum && hNum) ? calcBMI(wNum, hNum) : null;
  const scoffScore = f.scoffAnswers.filter(a => a === "yes").length;
  const isPregnant = f.conditions.includes("pregnancy");

  // canNext rules per step
  const canNext = [
    !!f.previousAttempts,                                     // step 1 — attempts required, why optional
    f.name.trim() && f.age && f.height && f.weight,          // step 2 — body required
    step3Sub === "conditions"   ? (f.conditions.length > 0) :
    step3Sub === "scoffIntro"   ? true :
    step3Sub === "scoffQ"       ? f.scoffAnswers[scoffIndex] !== null :
    step3Sub === "scoffFlagged" ? f.scoffAcknowledged :
    step3Sub === "scoffOk"      ? true :
    false,
    true,                                                     // step 4 — always allowed
  ][step];

  function next() {
    // Step 3 has internal substeps to navigate before advancing
    if (step === 2) {
      if (step3Sub === "conditions") {
        // Pregnancy → hard block (handled in render)
        if (isPregnant) return;
        // Move to SCOFF intro
        setStep3Sub("scoffIntro");
        return;
      }
      if (step3Sub === "scoffIntro") {
        setStep3Sub("scoffQ");
        setScoffIndex(0);
        return;
      }
      if (step3Sub === "scoffQ") {
        // Advance to next question or evaluate
        if (scoffIndex < 4) {
          setScoffIndex(scoffIndex + 1);
        } else {
          // Done with SCOFF — decide route
          setStep3Sub(scoffScore >= 2 ? "scoffFlagged" : "scoffOk");
        }
        return;
      }
      if (step3Sub === "scoffOk" || step3Sub === "scoffFlagged") {
        setStep(3);
        return;
      }
    }
    // Normal step advance
    if (step < 3) setStep(s => s + 1);
    else finish();
  }

  function back() {
    if (step === 2 && step3Sub !== "conditions") {
      // Navigate within step 3 backwards
      if (step3Sub === "scoffIntro")    return setStep3Sub("conditions");
      if (step3Sub === "scoffQ" && scoffIndex > 0) return setScoffIndex(scoffIndex - 1);
      if (step3Sub === "scoffQ" && scoffIndex === 0) return setStep3Sub("scoffIntro");
      if (step3Sub === "scoffOk" || step3Sub === "scoffFlagged") {
        setStep3Sub("scoffQ");
        setScoffIndex(4);
        return;
      }
    }
    if (step > 0) setStep(s => s - 1);
    else onBack();
  }

  async function requestNotifications() {
    if (!("Notification" in window)) { set("notificationsEnabled", false); return; }
    const result = await Notification.requestPermission();
    set("notificationsEnabled", result === "granted");
  }

  function finish() {
    onComplete({
      id: "u_" + Date.now(),
      // Identity (v2-only fields)
      previousAttempts: f.previousAttempts,
      initialWhy: f.initialWhy || null,
      // Body
      avatar: f.avatar,
      name: f.name,
      gender: f.gender,
      age: parseFloat(f.age),
      height: parseFloat(f.height),
      weight: parseFloat(f.weight),
      bmi: bmi ? parseFloat(bmi) : null,
      // Safety
      medicalConditions: f.conditions,
      scoffScore: scoffScore,
      scoffCompletedAt: new Date().toISOString(),
      scoffAcknowledgedRisk: scoffScore >= 2 && f.scoffAcknowledged,
      // Logistics
      morningReminderTime: f.morningTime,
      eveningReminderTime: f.eveningTime,
      // Deferred fields — populated later in the program
      goal: null,
      activity: null,
      training: null,
      trainingExp: null,
      stress: null,
      sleep: null,
      dietQuality: null,
      targetWeight: null,
      tdee: null,
      bfp: null,
      waist: null, neck: null, thigh: null,
      // System
      onboardingVersion: 2,
      currentWeek: 1,
      streak: 0,
      totalXP: 0,
      fatsecretConnected: false,
      joinedAt: todayStr(),
      notes: "",
      logs: [],
      foodLog: [],
      dailyTargets: { calories: null, protein: null, steps: null }, // null until unlocked
    });
  }

  const headerTitle = STEP_META[step].titleKey;
  const headerSub   = STEP_META[step].subKey;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "52px 22px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={back} style={{ width: 40, height: 40, borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}><ProgressDots total={4} current={step} /></div>
      </div>

      {/* Title bar */}
      <div style={{ padding: "0 22px 6px" }}>
        <div style={{ fontSize: 11, color: C.accent, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>{step + 1} / 4</div>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{t(headerTitle)}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{t(headerSub)}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 0" }}>

        {/* STEP 1 — Identity */}
        {step === 0 && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{t("v2.attempts.label")}</div>
              {["never", "1_2", "3_5", "many"].map(opt => (
                <button
                  key={opt}
                  onClick={() => set("previousAttempts", opt)}
                  style={{
                    width: "100%", padding: "14px 16px", marginBottom: 8,
                    background: f.previousAttempts === opt ? C.accentDim : C.surface,
                    border: `1.5px solid ${f.previousAttempts === opt ? C.accent : C.border}`,
                    borderRadius: 14, color: C.text, textAlign: "left", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 14,
                  }}
                >
                  {t(`v2.attempts.${opt}`)}
                </button>
              ))}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>{t("v2.attempts.hint")}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>{t("v2.why.label")}</div>
              <textarea
                value={f.initialWhy}
                onChange={e => set("initialWhy", e.target.value.slice(0, 200))}
                placeholder={t("v2.why.placeholder")}
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: "12px 14px", color: C.text, fontSize: 14,
                  fontFamily: "'Inter',system-ui,sans-serif", outline: "none", resize: "none",
                  lineHeight: 1.55,
                }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{t("v2.why.hint")}</div>
            </div>
          </div>
        )}

        {/* STEP 2 — Body */}
        {step === 1 && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 22 }}>
              {AVATAR_OPTIONS.map(a => (
                <button key={a} type="button" onClick={() => set("avatar", a)}
                  style={{ width: 50, height: 50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                           background: f.avatar === a ? C.accentDim : C.surface,
                           border: `1.5px solid ${f.avatar === a ? C.accent : C.border}`,
                           color: f.avatar === a ? C.accent : C.text,
                           cursor: "pointer", transition: "all 0.15s", padding: 0 }}>
                  <Avatar value={a} size={28} strokeWidth={f.avatar === a ? 1.75 : 1.5} />
                </button>
              ))}
            </div>
            <TextInput label={t("field.name")} value={f.name} onChange={v => set("name", v)} placeholder={t("field.name.ph")} />
            <PillSelect label={t("field.gender")} value={f.gender} onChange={v => set("gender", v)}
              options={[{ value: "male", label: t("field.gender.male") }, { value: "female", label: t("field.gender.female") }]} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <NumberInput label={t("field.age")} value={f.age} onChange={v => set("age", v)} unit={t("field.age.unit")} placeholder={t("field.age.ph")} step="1" />
              <NumberInput label={t("field.height")} value={f.height} onChange={v => set("height", v)} unit="cm" placeholder={t("field.height.ph")} step="1" />
            </div>
            <NumberInput label={t("field.weight")} value={f.weight} onChange={v => set("weight", v)} unit="kg" placeholder={t("field.weight.ph")} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: -10, marginBottom: 14 }}>{t("v2.weight.hint")}</div>
            {/* DO NOT show BMI/TDEE preview here — different from v1 */}
          </div>
        )}

        {/* STEP 3 — Safety (multi-substep) */}
        {step === 2 && step3Sub === "conditions" && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{t("v2.conditions.label")}</div>
            {["thyroid", "diabetes1", "diabetes2", "meds", "pregnancy", "none"].map(cond => {
              const checked = f.conditions.includes(cond);
              return (
                <button
                  key={cond}
                  onClick={() => {
                    if (cond === "none") {
                      set("conditions", checked ? [] : ["none"]);
                    } else {
                      const without = f.conditions.filter(c => c !== "none");
                      set("conditions", checked
                        ? without.filter(c => c !== cond)
                        : [...without, cond]);
                    }
                  }}
                  style={{
                    width: "100%", padding: "13px 16px", marginBottom: 8,
                    background: checked ? C.accentDim : C.surface,
                    border: `1.5px solid ${checked ? C.accent : C.border}`,
                    borderRadius: 14, color: C.text, textAlign: "left", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 14,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <span>{t(`v2.conditions.${cond}`)}</span>
                  {checked && <span style={{ color: C.accent }}>✓</span>}
                </button>
              );
            })}

            {/* Pregnancy hard block */}
            {isPregnant && (
              <div style={{ marginTop: 16, padding: "14px 16px", background: C.surface, border: `1.5px solid ${C.red || "#c44"}`, borderRadius: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                  {t("v2.pregnancy.block.title")}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
                  {t("v2.pregnancy.block.body")}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && step3Sub === "scoffIntro" && (
          <div style={{ animation: "slideUp 0.3s both", padding: "20px 0" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 10 }}>
              {t("v2.scoff.intro.title")}
            </div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>
              {t("v2.scoff.intro.body")}
            </div>
          </div>
        )}

        {step === 2 && step3Sub === "scoffQ" && (
          <div style={{ animation: "slideUp 0.3s both", padding: "8px 0" }}>
            <div style={{ fontSize: 11, color: C.accent, marginBottom: 12, fontWeight: 600 }}>
              {scoffIndex + 1} / 5
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: C.text, marginBottom: 24, lineHeight: 1.4 }}>
              {t(`v2.scoff.q${scoffIndex + 1}`)}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["yes", "no"].map(ans => (
                <button
                  key={ans}
                  onClick={() => {
                    const newAnswers = [...f.scoffAnswers];
                    newAnswers[scoffIndex] = ans;
                    set("scoffAnswers", newAnswers);
                    // Auto-advance after a brief delay
                    setTimeout(() => {
                      if (scoffIndex < 4) setScoffIndex(scoffIndex + 1);
                      else {
                        const score = newAnswers.filter(a => a === "yes").length;
                        setStep3Sub(score >= 2 ? "scoffFlagged" : "scoffOk");
                      }
                    }, 220);
                  }}
                  style={{
                    flex: 1, padding: "16px",
                    background: f.scoffAnswers[scoffIndex] === ans ? C.accentDim : C.surface,
                    border: `1.5px solid ${f.scoffAnswers[scoffIndex] === ans ? C.accent : C.border}`,
                    borderRadius: 14, color: C.text, fontSize: 15, fontWeight: 500,
                    fontFamily: "inherit", cursor: "pointer",
                  }}
                >
                  {t(`v2.scoff.${ans}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && step3Sub === "scoffFlagged" && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ background: C.surface, border: `1.5px solid ${C.orange || "#d4a847"}`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 10 }}>
                {t("v2.scoff.flagged.title")}
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, marginBottom: 12 }}>
                {t("v2.scoff.flagged.body")}
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, padding: "10px 12px", background: C.card, borderRadius: 10 }}>
                {t("v2.scoff.flagged.resource")}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 0" }}>
              <input
                type="checkbox"
                checked={f.scoffAcknowledged}
                onChange={e => set("scoffAcknowledged", e.target.checked)}
                style={{ marginTop: 3, accentColor: C.accent, transform: "scale(1.2)" }}
              />
              <span style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>
                {t("v2.scoff.flagged.acknowledge")}
              </span>
            </label>
          </div>
        )}

        {step === 2 && step3Sub === "scoffOk" && (
          <div style={{ animation: "slideUp 0.3s both", padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 15, color: C.text }}>
              {/* Simple all-clear — no extra copy needed, button below advances */}
            </div>
          </div>
        )}

        {/* STEP 4 — Logistics */}
        {step === 3 && (
          <div style={{ animation: "slideUp 0.3s both" }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{t("v2.morning.label")}</div>
              <input
                type="time"
                value={f.morningTime}
                onChange={e => set("morningTime", e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: "12px 14px", color: C.text, fontSize: 16,
                  fontFamily: "inherit", outline: "none",
                }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{t("v2.morning.hint")}</div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{t("v2.evening.label")}</div>
              <input
                type="time"
                value={f.eveningTime}
                onChange={e => set("eveningTime", e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: "12px 14px", color: C.text, fontSize: 16,
                  fontFamily: "inherit", outline: "none",
                }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{t("v2.evening.hint")}</div>
            </div>
            <button
              onClick={requestNotifications}
              style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: f.notificationsEnabled ? C.accentDim : C.card,
                border: `1.5px solid ${f.notificationsEnabled ? C.accent : C.border}`,
                color: f.notificationsEnabled ? C.accent : C.text,
                fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
              }}
            >
              {f.notificationsEnabled ? "✓ " : ""}{t("v2.notifications.enable")}
            </button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "18px 22px 48px" }}>
        <Btn onClick={next} disabled={!canNext}>
          {step === 3 ? t("v2.start") : t("onboarding.continue")}
        </Btn>
      </div>
    </div>
  );
}
