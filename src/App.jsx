// Root component: language picker, Supabase auth state, screen routing,
// and the global CSS that every other screen relies on. Feature components
// live under src/components and src/screens.
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import { LANGUAGES } from "./lang.js";
import { C } from "./theme.js";
import { todayStr } from "./utils.js";
import { MOCK_ATHLETES } from "./program.js";
import { AuthScreen } from "./screens/AuthScreen.jsx";
import { SignUp } from "./screens/SignUp.jsx";
import { Day0Screen } from "./screens/Day0Screen.jsx";
import { MemberDashboard } from "./screens/MemberDashboard.jsx";
import { CoachDashboard } from "./screens/CoachDashboard.jsx";

// Register service worker once on app load
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// ─── INLINE LANGUAGE PICKER ───────────────────────────────────────────────────
const CL = { bg:"#07090F",card:"#111520",border:"#1C2333",accent:"#C8F135",text:"#EEF2F7",muted:"#6B7A99" };

function LanguagePicker({ onPick }) {
  const [selected, setSelected] = useState("ru");
  return (
    <div style={{position:"fixed",inset:0,background:CL.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"32px 28px",fontFamily:"'DM Sans',sans-serif",zIndex:9999}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap');`}</style>
      <div style={{textAlign:"center",marginBottom:48}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:CL.card,border:`1px solid ${CL.border}`,borderRadius:14,padding:"10px 18px",marginBottom:28}}>
          <div style={{width:28,height:28,borderRadius:8,background:CL.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:CL.text,letterSpacing:1}}>FORM16</span>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:CL.text,marginBottom:10}}>
          {selected==="ru"?"Выберите язык":"Choose your language"}
        </div>
        <div style={{fontSize:14,color:CL.muted}}>
          {selected==="ru"?"Вы можете изменить это в профиле":"You can change this later in your profile"}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:40}}>
        {LANGUAGES.map(l=>(
          <div key={l.code} onClick={()=>setSelected(l.code)} style={{background:selected===l.code?`${CL.accent}18`:CL.card,border:`2px solid ${selected===l.code?CL.accent:CL.border}`,borderRadius:20,padding:"20px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:18,transition:"all 0.18s"}}>
            <span style={{fontSize:36}}>{l.flag}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:18,color:selected===l.code?CL.accent:CL.text}}>{l.label}</div>
              <div style={{fontSize:13,color:CL.muted,marginTop:3}}>{l.code==="en"?"English":"Русский язык"}</div>
            </div>
            {selected===l.code&&<div style={{width:28,height:28,borderRadius:"50%",background:CL.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:CL.bg,fontWeight:800}}>✓</span></div>}
          </div>
        ))}
      </div>
      <button onClick={()=>onPick(selected)} style={{width:"100%",background:CL.accent,color:CL.bg,border:"none",borderRadius:18,padding:"17px",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>
        {selected==="ru"?"Продолжить":"Continue"}
      </button>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [lang, setLangState] = useState(() => localStorage.getItem("form16_lang") || null);
  const chosen = !!lang;
  function setLang(code) { localStorage.setItem("form16_lang", code); setLangState(code); }
  const [screen, setScreen]   = useState("loading");
  const [session, setSession] = useState(null);
  const [openLogOnLoad, setOpenLogOnLoad] = useState(false);
  const [profile, setProfile] = useState(()=>{
    // Load cached profile instantly — eliminates white screen on reload
    try { const c=localStorage.getItem("form16_profile_cache"); return c?JSON.parse(c):null; } catch{ return null; }
  });
  const [athletes, setAthletes] = useState(MOCK_ATHLETES);

  // True only when the user explicitly tapped the sign-out button. Supabase
  // also fires "SIGNED_OUT" on transient token-refresh failures (e.g. when a
  // VPN switches and the in-flight refresh dies); without this flag we'd kick
  // the user to the auth screen every time their network blinked.
  const userInitiatedSignOut = useRef(false);

  // Cache profile to localStorage whenever it changes
  useEffect(()=>{
    if(profile) {
      try { localStorage.setItem("form16_profile_cache", JSON.stringify({...profile, logs:[]})); } catch{}
    }
  },[profile?.streak, profile?.currentWeek, profile?.weight, profile?.is_subscribed]);

  // ── Detect notification tap → open correct modal ─────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action === "morning" || action === "evening" || action === "log") {
      window.history.replaceState({}, "", window.location.pathname);
      const timer = setTimeout(() => {
        setOpenLogOnLoad(action === "evening" ? "evening" : "morning");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Detect FatSecret OAuth callback (?fs_connected=1) ────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fs_connected") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) loadProfile(data.user.id);
      });
    }
  }, []);

  // ── Listen to auth state ──────────────────────────────────────────────────
  // Design notes (see "auto-logout on VPN" bug):
  // - SIGNED_OUT can fire from a transient token-refresh failure, not just
  //   real sign-outs. We only act on it when the user clicked the button.
  // - On startup with no session yet (slow network), we render the cached
  //   profile instead of dropping to auth — getSession() runs in background.
  // - We never wipe the cache except on intentional sign-out; the profile is
  //   always re-loaded from Supabase once a session is confirmed.
  useEffect(() => {
    let initialDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (session) {
        if (!initialDone) {
          initialDone = true;
          // If we have cached profile, show app immediately while loading fresh data
          const cached = localStorage.getItem("form16_profile_cache");
          if (cached) {
            try {
              const p = JSON.parse(cached);
              if (p.id === session.user.id) {
                const hasSeenDay0 = localStorage.getItem(`form16_day0_${session.user.id}`);
                const isNewUser = p.joinedAt === todayStr() && !hasSeenDay0;
                setScreen(isNewUser ? "day0" : "member");
              }
            } catch{}
          }
          // Always load fresh profile in background
          loadProfile(session.user.id);
        } else if (event === "SIGNED_IN") {
          loadProfile(session.user.id);
        }
        // TOKEN_REFRESHED: nothing to do — we just stay logged in.
      } else if (event === "SIGNED_OUT") {
        // Only act on the user's own sign-out. Supabase also fires this on
        // transient refresh failures (network drop, VPN flip) and we don't
        // want to bounce users to login because their network blinked.
        if (userInitiatedSignOut.current) {
          userInitiatedSignOut.current = false;
          initialDone = true;
          localStorage.removeItem("form16_profile_cache");
          setScreen("auth");
          setProfile(null);
        }
        // Otherwise: ignore. Session is gone right now but the refresh token
        // is still in localStorage; Supabase will retry, or we'll trigger a
        // refresh ourselves on the next "online" / visibility-change event.
      } else if (!initialDone) {
        initialDone = true;
        // No session yet on startup. If we have a cached profile, render that
        // and let auth resolve in the background. Only show auth screen when
        // there's truly nothing local to render.
        const cached = localStorage.getItem("form16_profile_cache");
        if (cached) {
          try {
            const p = JSON.parse(cached);
            const hasSeenDay0 = localStorage.getItem(`form16_day0_${p.id}`);
            const isNewUser = p.joinedAt === todayStr() && !hasSeenDay0;
            setScreen(isNewUser ? "day0" : "member");
            return;
          } catch { /* fall through to auth screen */ }
        }
        setScreen("auth");
      }
    });

    // Recover the session whenever the network comes back or the app returns
    // to the foreground. iOS PWAs in particular pause everything in the
    // background; without this kick, a stale session can sit there until the
    // user does something that hits Supabase.
    const tryRefresh = () => {
      if (navigator.onLine) {
        supabase.auth.getSession().then(({ data }) => {
          if (!data?.session) supabase.auth.refreshSession().catch(() => {});
        }).catch(() => {});
      }
    };
    const onVisibility = () => { if (document.visibilityState === "visible") tryRefresh(); };
    window.addEventListener("online", tryRefresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("online", tryRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ── Load profile from Supabase ────────────────────────────────────────────
  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      // No profile yet — send to onboarding
      setScreen("onboarding");
      return;
    }

    // Load daily logs
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    const fullProfile = {
      ...data,
      currentWeek: data.current_week || 1,
      streak: data.streak || 0,
      totalXP: data.total_xp || 0,
      fatsecretConnected: data.fatsecret_connected || false,
      dietQuality: data.diet_quality || 3,
      trainingExp: data.training_exp || "",
      joinedAt: data.joined_at || todayStr(),
      logs: (logs || []).map(l => ({
        date: l.date,
        weight: l.weight,
        calories: l.calories,
        protein: l.protein,
        steps: l.steps,
        // Body measurements + computed body-fat percentage. Optional —
        // only present on logs created on/after a measurement day.
        waist: l.waist,
        neck: l.neck,
        hips: l.hips,
        bfp: l.bfp,
        // Boolean checkbox — week 4+ evening log; consumed by the
        // "Овощи" row in the MissionStrip expanded grid (week 5+).
        greens: l.greens,
        fromFatSecret: l.from_fatsecret,
      })),
      dailyTargets: {
        calories: data.daily_calories || 2000,
        protein: data.daily_protein || 150,
        steps: data.daily_steps || 10000,
      },
      foodLog: [],
    };

    setProfile(fullProfile);

    // Route to day0 if: joined today, no logs yet, and haven't seen day0 screen yet
    const isNewUser = fullProfile.joinedAt === todayStr() && (!logs || logs.length === 0);
    const hasSeenDay0 = localStorage.getItem(`form16_day0_${userId}`);
    setScreen(isNewUser && !hasSeenDay0 ? "day0" : "member");
  }

  async function saveProfile(p) {
    const userId = session.user.id;
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      name: p.name,
      avatar: p.avatar,
      gender: p.gender,
      age: p.age,
      height: p.height,
      weight: p.weight,
      waist: p.waist,
      neck: p.neck,
      thigh: p.thigh,
      goal: p.goal,
      activity: p.activity,
      stress: p.stress,
      sleep: p.sleep,
      diet_quality: p.dietQuality,
      training: p.training,
      training_exp: p.trainingExp,
      bmi: p.bmi,
      bfp: p.bfp,
      tdee: p.tdee,
      current_week: p.currentWeek || 1,
      streak: p.streak || 0,
      total_xp: p.totalXP || 0,
      fatsecret_connected: p.fatsecretConnected || false,
      joined_at: p.joinedAt || todayStr(),
      daily_calories: p.dailyTargets?.calories,
      daily_protein: p.dailyTargets?.protein,
      daily_steps: p.dailyTargets?.steps,
    });

    if (!error) {
      setProfile({ ...p, id: userId, logs: [], foodLog: [] });
      setScreen("day0");
    }
  }

  async function updateProfile(p) {
    const userId = session?.user?.id;
    if (!userId) return;
    setProfile(p);
    await supabase.from("profiles").update({
      current_week: p.currentWeek,
      streak: p.streak,
      total_xp: p.totalXP,
      fatsecret_connected: p.fatsecretConnected,
      daily_calories: p.dailyTargets?.calories,
      daily_protein: p.dailyTargets?.protein,
      daily_steps: p.dailyTargets?.steps,
    }).eq("id", userId);
  }

  async function saveLog(log) {
    const userId = session?.user?.id;
    if (!userId) return;

    // Upsert — replaces existing log for same date.
    // NOTE: requires `waist`, `neck`, `hips`, `bfp` (numeric, nullable) and
    // `greens` (boolean, nullable) columns on `daily_logs`. Add them via
    // Supabase Dashboard → Table Editor.
    const { error } = await supabase.from("daily_logs").upsert({
      user_id: userId,
      date: log.date,
      weight: log.weight,
      calories: log.calories,
      protein: log.protein,
      steps: log.steps,
      waist: log.waist ?? null,
      neck:  log.neck  ?? null,
      hips:  log.hips  ?? null,
      bfp:   log.bfp   ?? null,
      // Treat `undefined` as "field not in this update" rather than
      // overwriting a previously-saved true. Only `false` and `true`
      // explicit values flow through.
      ...(typeof log.greens === "boolean" ? { greens: log.greens } : {}),
      from_fatsecret: log.fromFatSecret || false,
    }, { onConflict: "user_id,date" });
    if (error) console.error("saveLog Supabase error:", error);

    setProfile(p => ({
      ...p,
      logs: [...(p.logs||[]).filter(l=>l.date!==log.date), log],
      streak: p.streak + (p.logs?.at(-1)?.date !== todayStr() ? 1 : 0),
      totalXP: p.totalXP + 20,
      // Bubble the latest BFP up onto the profile so the BFP card on the
      // today/account screens reflects it without waiting for a reload.
      ...(log.bfp ? { bfp: log.bfp } : {}),
    }));

    // Persist the new BFP to the profiles row too — otherwise the local
    // value above is lost on the next page load.
    if (log.bfp) {
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ bfp: log.bfp })
        .eq("id", userId);
      if (profErr) console.error("saveLog profile.bfp error:", profErr);
    }
  }

  async function signOut() {
    userInitiatedSignOut.current = true;
    await supabase.auth.signOut();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};}
        ::-webkit-scrollbar{width:0;}
        input,button,textarea,select{font-family:'DM Sans',sans-serif;}
        input::placeholder,textarea::placeholder{color:${C.muted};opacity:1;}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
        input[type=number]{-moz-appearance:textfield;}
        @keyframes slideUp{from{transform:translateY(26px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{0%{transform:scale(0.6);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
      `}</style>
      <div style={{maxWidth:430,margin:"0 auto",color:C.text,minHeight:"100vh",background:C.bg}}>

        {/* Language picker — shown on first launch before everything else */}
        {!chosen && <LanguagePicker onPick={setLang} />}

        {/* All other screens — only shown after language is chosen */}
        {chosen && screen==="loading" && (
          <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
            <div style={{width:26,height:26,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
            <div style={{fontSize:14,color:C.muted}}>Loading…</div>
          </div>
        )}

        {chosen && screen==="auth" && <AuthScreen onAuth={()=>{}} />}

        {chosen && screen==="onboarding" && (
          <SignUp
            onComplete={saveProfile}
            onBack={async()=>{ userInitiatedSignOut.current = true; await supabase.auth.signOut(); setScreen("auth"); }}
          />
        )}

        {chosen && screen==="day0" && profile && (
          <Day0Screen
            profile={profile}
            userId={session?.user?.id}
            onDone={()=>{
              localStorage.setItem(`form16_day0_${session?.user?.id}`,"1");
              setScreen("member");
            }}
          />
        )}

        {chosen && screen==="member" && profile && (
          <MemberDashboard
            profile={profile}
            setProfile={updateProfile}
            saveLog={saveLog}
            onSignOut={signOut}
            openLogOnLoad={openLogOnLoad}
            onLogOpened={()=>setOpenLogOnLoad(false)}
          />
        )}

        {chosen && screen==="coach" && (
          <CoachDashboard
            athletes={athletes}
            setAthletes={setAthletes}
            onBack={()=>setScreen("auth")}
          />
        )}
      </div>
    </>
  );
}
