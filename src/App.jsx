// Root component: language picker, Supabase auth state, screen routing,
// and the global CSS that every other screen relies on. Feature components
// live under src/components and src/screens.
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import { LANGUAGES } from "./lang.js";
import { C, F, BRAND } from "./theme.js";
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
function LanguagePicker({ onPick }) {
  const [selected, setSelected] = useState("ru");
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"32px 28px",fontFamily:F.sans,zIndex:9999}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:28}}>
          <div style={{width:32,height:32,borderRadius:8,background:C.text,color:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.serif,fontWeight:600,fontSize:18,letterSpacing:"-0.02em"}}>S</div>
          <div style={{textAlign:"left"}}>
            <div style={{fontFamily:F.serif,fontSize:18,fontWeight:500,color:C.text,letterSpacing:"-0.015em",lineHeight:1}}>{BRAND.name}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:3}}>{BRAND.tagline}</div>
          </div>
        </div>
        <div style={{fontFamily:F.serif,fontSize:30,fontWeight:400,color:C.text,marginBottom:8,letterSpacing:"-0.02em",lineHeight:1.15}}>
          {selected==="ru"?"Выберите язык":"Choose your language"}
        </div>
        <div style={{fontSize:14,color:C.muted}}>
          {selected==="ru"?"Можно изменить позже в профиле":"You can change this later in your profile"}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:36}}>
        {LANGUAGES.map(l=>(
          <button key={l.code} onClick={()=>setSelected(l.code)} style={{background:selected===l.code?C.accentDim:C.surface,border:`1.5px solid ${selected===l.code?C.accent:C.border}`,borderRadius:14,padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"all 0.18s",fontFamily:"inherit",textAlign:"left",width:"100%"}}>
            <span style={{fontSize:30}}>{l.flag}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:16,color:selected===l.code?C.accent:C.text}}>{l.label}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{l.code==="en"?"English":"Русский язык"}</div>
            </div>
            {selected===l.code&&<div style={{width:22,height:22,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:12,color:"#fff",fontWeight:500}}>✓</span></div>}
          </button>
        ))}
      </div>
      <button onClick={()=>onPick(selected)} style={{width:"100%",background:C.text,color:C.bg,border:"none",borderRadius:14,padding:"16px",fontSize:15,fontWeight:600,fontFamily:F.sans,cursor:"pointer",letterSpacing:"0.01em"}}>
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
  // Two paths: (1) cold start where the SW opens a new window with ?action=…
  // in the URL; (2) warm app where the SW posts NOTIFICATION_CLICK to the
  // already-focused client (no URL change). Without the postMessage branch
  // the user lands on the dashboard and has to tap the morning button.
  useEffect(() => {
    function openFromAction(action) {
      if (action !== "morning" && action !== "evening" && action !== "log") return;
      // Slight delay so the dashboard mounts first; otherwise the modal
      // flashes against an empty screen.
      setTimeout(() => {
        setOpenLogOnLoad(action === "evening" ? "evening" : "morning");
      }, 400);
    }

    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action) {
      window.history.replaceState({}, "", window.location.pathname);
      openFromAction(action);
    }

    const onSwMessage = (e) => {
      if (e.data?.type !== "NOTIFICATION_CLICK") return;
      const url = e.data.url || "";
      const a = new URLSearchParams(url.split("?")[1] || "").get("action");
      openFromAction(a);
    };
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }
    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", onSwMessage);
      }
    };
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
        // Boolean checkbox from the evening log (week 4+); consumed by
        // the "Овощи" row in the MissionStrip expanded grid (week 5+).
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
      avatar: p.avatar,
      current_week: p.currentWeek,
      streak: p.streak,
      total_xp: p.totalXP,
      fatsecret_connected: p.fatsecretConnected,
      daily_calories: p.dailyTargets?.calories,
      daily_protein: p.dailyTargets?.protein,
      daily_steps: p.dailyTargets?.steps,
      is_subscribed: p.is_subscribed,
      subscribed_at: p.subscribed_at,
    }).eq("id", userId);
  }

  async function saveLog(log) {
    const userId = session?.user?.id;
    if (!userId) return;

    // Read the existing row for this date so a partial log (morning-only or
    // evening-only) doesn't blank out fields the other half already wrote.
    // `undefined` in `log` = "not in this update"; anything else overrides.
    const { data: existing } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", log.date)
      .maybeSingle();

    const pick = (next, prev) => next !== undefined ? next : (prev ?? null);
    const payload = {
      user_id: userId,
      date: log.date,
      weight:   pick(log.weight,   existing?.weight),
      calories: pick(log.calories, existing?.calories),
      protein:  pick(log.protein,  existing?.protein),
      steps:    pick(log.steps,    existing?.steps),
      waist:    pick(log.waist,    existing?.waist),
      neck:     pick(log.neck,     existing?.neck),
      hips:     pick(log.hips,     existing?.hips),
      bfp:      pick(log.bfp,      existing?.bfp),
      greens:   typeof log.greens === "boolean" ? log.greens : (existing?.greens ?? null),
      from_fatsecret: log.fromFatSecret !== undefined ? log.fromFatSecret : (existing?.from_fatsecret ?? false),
    };

    const { error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,date" });
    if (error) {
      console.error("saveLog Supabase error:", error);
      alert("Не удалось сохранить отчёт: " + (error.message || "ошибка БД"));
      return;
    }

    // Merge into local state with the same precedence as the DB payload.
    setProfile(p => {
      const prevLogs = p.logs || [];
      const prev = prevLogs.find(l => l.date === log.date) || {};
      const merged = {
        ...prev,
        date: log.date,
        ...(log.weight   !== undefined ? { weight: log.weight     } : {}),
        ...(log.calories !== undefined ? { calories: log.calories } : {}),
        ...(log.protein  !== undefined ? { protein: log.protein   } : {}),
        ...(log.steps    !== undefined ? { steps: log.steps       } : {}),
        ...(log.waist    !== undefined ? { waist: log.waist       } : {}),
        ...(log.neck     !== undefined ? { neck: log.neck         } : {}),
        ...(log.hips     !== undefined ? { hips: log.hips         } : {}),
        ...(log.bfp      !== undefined ? { bfp: log.bfp           } : {}),
        ...(typeof log.greens === "boolean" ? { greens: log.greens } : {}),
        ...(log.fromFatSecret !== undefined ? { fromFatSecret: log.fromFatSecret } : {}),
      };
      const wasLoggedToday = prevLogs.some(l => l.date === todayStr());
      return {
        ...p,
        logs: [...prevLogs.filter(l => l.date !== log.date), merged],
        streak: p.streak + (log.date === todayStr() && !wasLoggedToday ? 1 : 0),
        totalXP: p.totalXP + 20,
        ...(log.bfp ? { bfp: log.bfp } : {}),
      };
    });

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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Onest:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${C.bg};color:${C.text};-webkit-font-smoothing:antialiased;font-family:${F.sans};}
        ::-webkit-scrollbar{width:0;}
        input,button,textarea,select{font-family:${F.sans};}
        input::placeholder,textarea::placeholder{color:${C.muted};opacity:1;}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
        input[type=number]{-moz-appearance:textfield;}
        @keyframes slideUp{from{transform:translateY(26px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop{0%{transform:scale(0.6);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.4);opacity:0}}
      `}</style>
      <div style={{maxWidth:430,margin:"0 auto",color:C.text,minHeight:"100vh",background:C.bg}}>

        {/* Language picker — shown on first launch before everything else */}
        {!chosen && <LanguagePicker onPick={setLang} />}

        {/* All other screens — only shown after language is chosen */}
        {chosen && screen==="loading" && (
          <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
            <div style={{width:32,height:32,borderRadius:8,background:C.text,color:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.serif,fontWeight:600,fontSize:18,letterSpacing:"-0.02em"}}>S</div>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"0.04em"}}>Loading…</div>
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
            lang={lang}
            setLang={setLang}
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
