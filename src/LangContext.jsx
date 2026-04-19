import { createContext, useContext, useState } from "react";
import { createTranslator, LANGUAGES } from "./lang.js";

// ── Language Context ──────────────────────────────────────────────────────────
const LangContext = createContext({ lang: "ru", t: k => k, setLang: () => {}, chosen: false });
export function useLang() { return useContext(LangContext); }

// ── Language Provider ─────────────────────────────────────────────────────────
export function LangProvider({ children }) {
  const stored = localStorage.getItem("form16_lang");
  const [lang, setLangState] = useState(stored || null);

  function setLang(code) {
    localStorage.setItem("form16_lang", code);
    setLangState(code);
  }

  const chosen = !!lang;
  const t = createTranslator(lang || "ru");

  return (
    <LangContext.Provider value={{ lang: lang || "ru", t, setLang, chosen }}>
      {children}
    </LangContext.Provider>
  );
}

// ── Language Picker Screen ────────────────────────────────────────────────────
const C = {
  bg:"#07090F", card:"#111520", border:"#1C2333",
  accent:"#C8F135", text:"#EEF2F7", muted:"#6B7A99",
};

export function LanguagePicker({ onPick }) {
  const [selected, setSelected] = useState("ru");

  return (
    <div style={{
      position:"fixed", inset:0, background:C.bg,
      display:"flex", flexDirection:"column",
      justifyContent:"center", padding:"32px 28px",
      fontFamily:"'DM Sans', sans-serif",
      zIndex: 9999,
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"10px 18px", marginBottom:28 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:C.text, letterSpacing:1 }}>FORM16</span>
        </div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:C.text, marginBottom:10 }}>
          {selected === "ru" ? "Выберите язык" : "Choose your language"}
        </div>
        <div style={{ fontSize:14, color:C.muted }}>
          {selected === "ru" ? "Вы можете изменить это в профиле" : "You can change this later in your profile"}
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:40 }}>
        {LANGUAGES.map(l => (
          <div
            key={l.code}
            onClick={() => setSelected(l.code)}
            style={{
              background: selected === l.code ? `${C.accent}18` : C.card,
              border: `2px solid ${selected === l.code ? C.accent : C.border}`,
              borderRadius: 20, padding: "20px 22px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 18,
              transition: "all 0.18s",
            }}
          >
            <span style={{ fontSize: 36 }}>{l.flag}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight:700, fontSize:18, color: selected === l.code ? C.accent : C.text }}>
                {l.label}
              </div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
                {l.code === "en" ? "English" : "Русский язык"}
              </div>
            </div>
            {selected === l.code && (
              <div style={{ width:28, height:28, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:14, color:C.bg, fontWeight:800 }}>✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => onPick(selected)}
        style={{
          width:"100%", background:C.accent, color:C.bg,
          border:"none", borderRadius:18, padding:"17px",
          fontSize:16, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
          cursor:"pointer",
        }}
      >
        {selected === "ru" ? "Продолжить" : "Continue"}
      </button>
    </div>
  );
}

// ── Language Context ──────────────────────────────────────────────────────────
const LangContext = createContext({ lang: "en", t: k => k, setLang: () => {} });
export function useLang() { return useContext(LangContext); }

// ── Language Provider — wrap your entire App in this ─────────────────────────
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("form16_lang") || null; // null = not chosen yet
  });

  function setLang(code) {
    localStorage.setItem("form16_lang", code);
    setLangState(code);
  }

  const t = createTranslator(lang || "en");

  return (
    <LangContext.Provider value={{ lang: lang || "en", t, setLang, chosen: !!lang }}>
      {children}
    </LangContext.Provider>
  );
}

// ── Language Picker Screen ────────────────────────────────────────────────────
// Shown once on first launch before the splash/auth screens
const C_LANG = {
  bg:"#07090F", card:"#111520", border:"#1C2333",
  accent:"#C8F135", text:"#EEF2F7", muted:"#6B7A99",
};

export function LanguagePicker({ onPick }) {
  const [selected, setSelected] = useState("en");

  return (
    <div style={{
      minHeight:"100vh", background:C_LANG.bg,
      display:"flex", flexDirection:"column",
      justifyContent:"center", padding:"32px 28px",
      fontFamily:"'DM Sans', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:C_LANG.card, border:`1px solid ${C_LANG.border}`, borderRadius:14, padding:"10px 18px", marginBottom:28 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:C_LANG.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:C_LANG.text, letterSpacing:1 }}>FORM16</span>
        </div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:C_LANG.text, marginBottom:10 }}>
          {selected === "ru" ? "Выберите язык" : "Choose your language"}
        </div>
        <div style={{ fontSize:14, color:C_LANG.muted }}>
          {selected === "ru" ? "Вы можете изменить это в профиле" : "You can change this later in your profile"}
        </div>
      </div>

      {/* Language options */}
      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:40 }}>
        {LANGUAGES.map(lang => (
          <div
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            style={{
              background: selected === lang.code ? `${C_LANG.accent}18` : C_LANG.card,
              border: `2px solid ${selected === lang.code ? C_LANG.accent : C_LANG.border}`,
              borderRadius: 20, padding: "20px 22px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 18,
              transition: "all 0.18s",
            }}
          >
            <span style={{ fontSize: 36 }}>{lang.flag}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight:700, fontSize:18, color: selected === lang.code ? C_LANG.accent : C_LANG.text }}>
                {lang.label}
              </div>
              <div style={{ fontSize:13, color:C_LANG.muted, marginTop:3 }}>
                {lang.code === "en" ? "English" : "Русский язык"}
              </div>
            </div>
            {selected === lang.code && (
              <div style={{ width:28, height:28, borderRadius:"50%", background:C_LANG.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:14, color:C_LANG.bg, fontWeight:800 }}>✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Continue button */}
      <button
        onClick={() => onPick(selected)}
        style={{
          width:"100%", background:C_LANG.accent, color:C_LANG.bg,
          border:"none", borderRadius:18, padding:"17px",
          fontSize:16, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
          cursor:"pointer",
        }}
      >
        {selected === "ru" ? "Продолжить" : "Continue"}
      </button>
    </div>
  );
}


// ─── HOW TO INTEGRATE ─────────────────────────────────────────────────────────
//
// 1. Copy lang.js into src/lang.js
// 2. Copy this file's content into src/LangContext.jsx
// 3. In src/main.jsx wrap your App in LangProvider:
//
//    import { LangProvider } from "./LangContext.jsx";
//    createRoot(document.getElementById("root")).render(
//      <StrictMode>
//        <LangProvider>
//          <App />
//        </LangProvider>
//      </StrictMode>
//    );
//
// 4. In App.jsx root component, add before the auth/splash check:
//
//    const { lang, t, setLang, chosen } = useLang();
//    if (!chosen) return <LanguagePicker onPick={setLang} />;
//
// 5. Pass `t` down to every component that needs it, OR call useLang() 
//    inside each component directly.
//
// 6. Replace every hardcoded string with t("key"):
//    Example: "Today" → t("tab.today")
//    Example: "Week 3 details →" → t("today.week_details", { w: profile.currentWeek })
//
// 7. Save user language to Supabase profile:
//    Add a `language` column to your profiles table:
//    ALTER TABLE profiles ADD COLUMN language text DEFAULT 'en';
//    Then save setLang(lang) when saving the profile.
//
// ─────────────────────────────────────────────────────────────────────────────
