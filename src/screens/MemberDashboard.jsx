// Authenticated member view — three tabs: today (current task + habits),
// program (16-week calendar), account (progress + profile + FatSecret).
// Hosts every log/chat/day-detail modal.
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, F } from "../theme.js";
import { todayStr, fmtDate, calcBMI } from "../utils.js";
import { t } from "../i18n.js";
import { PROGRAM, getUserGlobalDay, getTodayData, getMissedMeasurement } from "../program.js";
import { MetricBar, WeightChart } from "../components/ui.jsx";
import { FatSecretConnect } from "../components/FatSecretConnect.jsx";
import { InlineChatBar, ChatModal } from "../components/Chat.jsx";
import { DayDetailModal, MorningLogModal, EveningLogModal, LogModal } from "../components/LogModals.jsx";
import { Icon, Avatar, AVATAR_OPTIONS } from "../components/icons.jsx";
import { ProgramView } from "../components/ProgramView.jsx";
import { MissionStrip } from "../components/MissionStrip.jsx";
import { DailyTaskCarousel } from "../components/DailyTaskCarousel.jsx";
import { WeekendTipsBar } from "../components/WeekendTipsBar.jsx";
import { isFeatureUnlocked, daysUntilUnlock } from "../featureUnlocks.js";
import { WhyAnchor } from "../components/WhyAnchor.jsx";
import { IdentityCard } from "../components/IdentityCard.jsx";

// Read-only placeholder for a feature that hasn't unlocked yet. Used in
// place of the food diary / step tracker / protein / calorie cards so the
// home screen still has visual scaffolding without leaking week-3+ topics.
function LockedCard({ featureName, currentDay }) {
  const days = daysUntilUnlock(featureName, currentDay);
  const titleKey = `v2.locked.${featureName === 'food_diary' ? 'food' : featureName === 'step_tracker' ? 'steps' : featureName === 'protein_target' ? 'protein' : 'calories'}.title`;
  const bodyKey  = `v2.locked.${featureName === 'food_diary' ? 'food' : featureName === 'step_tracker' ? 'steps' : featureName === 'protein_target' ? 'protein' : 'calories'}.body`;

  return (
    <div style={{
      background: C.card, border: `1px dashed ${C.border}`,
      borderRadius: 20, padding: "16px 18px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: C.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.muted }}>🔒</div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: C.text }}>{t(titleKey)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t("v2.locked.food.countdown", { days })}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{t(bodyKey)}</div>
    </div>
  );
}

export function MemberDashboard({profile,setProfile,saveLog,onSignOut,onBack,openLogOnLoad,onLogOpened,lang,setLang}){
  const [tab,setTab]=useState("today");
  const [showLog,setShowLog]=useState(false);
  const [showMorningLog,setShowMorningLog]=useState(false);
  const [showEveningLog,setShowEveningLog]=useState(false);
  const [selectedDay,setSelectedDay]=useState(null);
  const [showChat,setShowChat]=useState(false);
  const [showAvatarPicker,setShowAvatarPicker]=useState(false);
  const [showUpgrade,setShowUpgrade]=useState(false);
  const [showTargetsEdit,setShowTargetsEdit]=useState(false);
  const [showLangSheet,setShowLangSheet]=useState(false);
  const [unreadCount,setUnreadCount]=useState(0);

  // Auto-open correct modal when arriving from push notification
  useEffect(()=>{
    if(openLogOnLoad==="morning"){ setShowMorningLog(true); if(onLogOpened) onLogOpened(); }
    if(openLogOnLoad==="evening"){ setShowEveningLog(true); if(onLogOpened) onLogOpened(); }
  },[openLogOnLoad]);

  // Load unread coach messages count
  useEffect(()=>{
    if(!profile.id) return;
    supabase.from("messages")
      .select("id",{count:"exact"})
      .eq("user_id",profile.id)
      .eq("is_coach",true)
      .eq("read_by_user",false)
      .then(({count})=>setUnreadCount(count||0));
  },[profile.id]);

  const lastLog=profile.logs.at(-1);
  const todayLog=profile.logs.find(l=>l.date===todayStr());
  const currentWeight=lastLog?.weight||profile.weight;
  const weightDiff=+(currentWeight-profile.weight).toFixed(1);
  const weekLogs=profile.logs.slice(-7);
  const currentBFP=profile.bfp||"—";

  // ── WIRED: get today's task & tip from the program JSON ──
  const userGlobalDay = getUserGlobalDay(profile);
  // Feature unlocks (centralized thresholds in featureUnlocks.js)
  const showFoodDiary     = isFeatureUnlocked('food_diary',     userGlobalDay);
  const showStepTracker   = isFeatureUnlocked('step_tracker',   userGlobalDay);
  const showProteinTarget = isFeatureUnlocked('protein_target', userGlobalDay);
  const showIdentityCard  = userGlobalDay >= 4 && userGlobalDay <= 14;
  const currentWeekNum = Math.max(1, Math.min(16, Math.ceil((userGlobalDay) / 7) || 1));
  const { week: currentWeekData, day: todayDayData, isDay0 } = getTodayData(profile) || { week: PROGRAM[0], day: PROGRAM[0].days[0], isDay0: true };
  const missedMeasurement = getMissedMeasurement(profile);
  const fsSyncData=profile.fsSyncData;
  // Prefer the saved evening report over an in-flight FS sync once the
  // user has submitted today's report — saving evening should immediately
  // refresh the metrics bar (was reading stale fsSyncData before, which
  // overrode the user's just-saved numbers).
  const todayFsFresh = fsSyncData && profile.fsSyncedAt
    && new Date(profile.fsSyncedAt).toISOString().split("T")[0] === todayStr();
  const nutritionSource = todayLog?.calories
    ? todayLog
    : (todayFsFresh ? fsSyncData : todayLog);

  function handleSaveLog(log){
    if(saveLog) saveLog(log);
    else setProfile(p=>({...p,logs:[...(p.logs||[]).filter(l=>l.date!==log.date),log],streak:p.streak+1,totalXP:p.totalXP+20}));
    // Update BFP on profile if measurements were logged
    if(log.bfp) setProfile(p=>({...p,bfp:log.bfp}));
  }

  const TABS=[{id:"today",icon:"sun",label:t("tab.today")},{id:"program",icon:"grid",label:t("tab.program")},{id:"account",icon:"user",label:"Я"}];

  // Lab: single accent for all task types. Differentiate via labels.
  const taskTypeLabel = {training:"Тренировка",nutrition:"Питание",mindset:"Мышление",rest:"Отдых",active_recovery:"Восстановление"}[todayDayData?.type]||"Сегодня";
  const dayProgressPct = Math.min(100,(userGlobalDay/112)*100);

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:96,fontFamily:F.sans}}>
      {/* Header */}
      <div style={{background:C.bg,padding:"56px 22px 14px",display:"flex",alignItems:"center",gap:12}}>
        {onBack&&<button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:0,marginRight:2}}>←</button>}
        <div style={{width:38,height:38,borderRadius:10,background:C.accentDim,color:C.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Avatar value={profile.avatar} size={22} /></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,color:C.muted,letterSpacing:"0.02em"}}>{t("header.welcome")}</div>
          <div style={{fontFamily:F.serif,fontWeight:500,fontSize:18,letterSpacing:"-0.015em",lineHeight:1.1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.name}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontFamily:F.mono,fontSize:12,fontWeight:500,color:C.text,padding:"6px 12px",border:`1px solid ${C.dim}`,borderRadius:999,letterSpacing:"0.02em"}}>
          <Icon name="flame" size={13} />
          {profile.streak}<span style={{color:C.muted,fontWeight:500,marginLeft:2}}>· серия</span>
        </div>
        {onSignOut&&<button onClick={onSignOut} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 10px",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:F.sans}}>{t("header.signout")}</button>}
      </div>


      {/* ── TODAY ── */}
      {tab==="today"&&(
        <div style={{animation:"slideUp 0.28s both"}}>

          {/* Day strap — large serif day number on a hairline */}
          <section style={{padding:"4px 22px 22px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
              <div style={{fontFamily:F.serif,fontSize:60,fontWeight:400,letterSpacing:"-0.035em",lineHeight:0.95,color:C.text}}>
                {userGlobalDay} <span style={{color:C.muted,fontSize:20,fontWeight:400}}>/ 112</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:C.text,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Неделя {currentWeekNum}</div>
                <div style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:4}}>{new Date().toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"})}</div>
              </div>
            </div>
            <div style={{height:1,background:C.dim,position:"relative",marginTop:22}}>
              <div style={{position:"absolute",left:0,top:0,height:1,background:C.text,width:`${dayProgressPct}%`,transition:"width 1s cubic-bezier(.16,1,.3,1)"}}/>
              <div style={{position:"absolute",left:`${dayProgressPct}%`,top:-3,width:7,height:7,borderRadius:"50%",background:C.text,transform:"translateX(-50%)"}}/>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:12,letterSpacing:"0.02em"}}>{currentWeekData.theme}</div>
          </section>

          {/* Log buttons */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"18px 22px 0"}}>
            <button onClick={()=>setShowMorningLog(true)} style={{background:todayLog?.weight?C.accentDim:C.surface,border:`1px solid ${todayLog?.weight?C.accent:C.border}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left",fontFamily:F.sans,color:todayLog?.weight?C.accent:C.text}}>
              <Icon name={todayLog?.weight?"check":"sun"} size={22} strokeWidth={todayLog?.weight?1.75:1.5} />
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:todayLog?.weight?C.accent:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>Утро{todayLog?.weight?" · готово":""}</div>
                <div style={{fontFamily:F.mono,fontSize:13,fontWeight:500,color:todayLog?.weight?C.accent:C.text,marginTop:3}}>{todayLog?.weight?`${todayLog.weight} кг`:"Записать →"}</div>
              </div>
            </button>
            {!showFoodDiary ? (
              <div aria-disabled="true" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"default",fontFamily:F.sans,color:C.muted}}>
                <div style={{width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:C.muted}}>🔒</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>{t("v2.locked.evening.label")}</div>
                  <div style={{fontFamily:F.mono,fontSize:13,fontWeight:500,color:C.muted,marginTop:3}}>{t("v2.locked.evening.sub")}</div>
                </div>
              </div>
            ) : profile.fatsecretConnected ? (
              <button onClick={()=>setShowEveningLog(true)} style={{background:todayLog?.calories?C.accentDim:C.surface,border:`1px solid ${todayLog?.calories?C.accent:C.border}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left",fontFamily:F.sans,color:todayLog?.calories?C.accent:C.text}}>
                <div style={{width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{todayLog?.calories?"✓":"⚡"}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:todayLog?.calories?C.accent:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>Синх. FatSecret{todayLog?.calories?" · готово":""}</div>
                  <div style={{fontFamily:F.mono,fontSize:13,fontWeight:500,color:todayLog?.calories?C.accent:C.text,marginTop:3}}>{todayLog?.calories?`${todayLog.calories} ккал`:"Синхронизировать →"}</div>
                </div>
              </button>
            ) : (
              <button onClick={()=>setShowEveningLog(true)} style={{background:todayLog?.calories?C.accentDim:C.surface,border:`1px solid ${todayLog?.calories?C.accent:C.border}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left",fontFamily:F.sans,color:todayLog?.calories?C.accent:C.text}}>
                <Icon name={todayLog?.calories?"check":"moon"} size={22} strokeWidth={todayLog?.calories?1.75:1.5} />
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:todayLog?.calories?C.accent:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>Вечер{todayLog?.calories?" · готово":""}</div>
                  <div style={{fontFamily:F.mono,fontSize:13,fontWeight:500,color:todayLog?.calories?C.accent:C.text,marginTop:3}}>{todayLog?.calories?`${todayLog.calories} ккал`:"Записать →"}</div>
                </div>
              </button>
            )}
          </div>

          <div style={{padding:"24px 22px 0"}}>
          {/* ── DAY 0 FULL TAKEOVER ── */}
          {isDay0 ? (
            <div style={{animation:"fadeIn 0.3s both"}}>

              {/* Setup checklist — carried from Day 0 screen */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,marginBottom:14,overflow:"hidden"}}>
                <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:500}}>Настройка</div>
                  <div style={{fontSize:11,color:C.accent,fontWeight:500}}>
                    {[
                      true, // profile always done
                      "Notification" in window && Notification.permission==="granted",
                      false, // home screen — can't detect
                    ].filter(Boolean).length} / 3
                  </div>
                </div>
                {[
                  {icon:"📋",label:"Профиль заполнен",done:true},
                  {icon:"🔔",label:"Уведомления",done:"Notification" in window && Notification.permission==="granted"},
                  {icon:"📲",label:"Добавлено на главный экран",done:false},
                ].map((item,i,arr)=>(
                  <div key={item.label} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,background:item.done?C.accent:C.dim,color:item.done?C.bg:C.muted}}>
                      {item.done?"✓":""}
                    </div>
                    <div style={{fontSize:14,flexShrink:0}}>{item.icon}</div>
                    <div style={{fontSize:13,color:item.done?C.muted:C.text,textDecoration:item.done?"line-through":"none"}}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Day 0 single task */}
              <div style={{background:C.blueDim,border:`1.5px solid ${C.blue}44`,borderRadius:18,padding:"16px 18px",marginBottom:14}}>
                <div style={{fontSize:11,color:C.blue,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Задача дня 0</div>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <div style={{width:48,height:48,borderRadius:15,background:`${C.blue}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🍽️</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Запиши первый приём пищи</div>
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Даже один перекус считается. Нажми «+ Записать день» выше и добавь калории.</div>
                  </div>
                  {todayLog&&<div style={{fontSize:20,flexShrink:0}}>✅</div>}
                </div>
              </div>

              {/* Inline chat bar — Day 0 */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,marginBottom:14,overflow:"hidden"}}>
                <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:28,height:28,borderRadius:8,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🏋️</div>
                    <div><div style={{fontSize:12,fontWeight:500}}>Персональный тренер</div><div style={{fontSize:10,color:C.accent}}>ИИ · отвечает мгновенно</div></div>
                  </div>
                  <button onClick={()=>setShowChat(true)} style={{fontSize:11,color:C.accent,background:C.accentDim,border:"none",borderRadius:14,padding:"4px 10px",cursor:"pointer",fontFamily:"'Inter',system-ui,sans-serif",fontWeight:500}}>Открыть →</button>
                </div>
                <div style={{padding:"10px 12px",display:"flex",gap:8,alignItems:"center"}}>
                  <input placeholder="Спроси тренера…" onFocus={()=>setShowChat(true)} readOnly style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 12px",color:C.muted,fontSize:13,fontFamily:"'Inter',system-ui,sans-serif",outline:"none",cursor:"pointer"}}/>
                  <div style={{width:34,height:34,borderRadius:"50%",background:C.dim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.bg,flexShrink:0}}>↑</div>
                </div>
              </div>

              {/* Tomorrow preview */}
              <div style={{background:C.card,border:`1.5px solid ${C.accent}44`,borderRadius:18,overflow:"hidden"}}>
                <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,color:C.accent,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Завтра — День 1</div>
                  <div style={{fontSize:12,color:C.muted}}>Вот что тебя ждёт</div>
                </div>
                {[
                  {time:"07:00",icon:"⚖️",col:C.accent,label:"Встань на весы",sub:"После туалета, до завтрака"},
                  {time:"Днём",icon:"🍽️",col:C.blue,label:"Записывай еду",sub:"Каждый приём пищи сразу после еды"},
                  {time:"21:00",icon:"🌙",col:C.purple,label:"Итог дня",sub:"Напомним проверить и дозаписать питание"},
                ].map((item,i,arr)=>(
                  <div key={item.time} style={{display:"flex",gap:14,padding:"12px 18px",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",alignItems:"center"}}>
                    <div style={{width:38,textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:10,color:item.col,fontWeight:500,marginBottom:5}}>{item.time}</div>
                      <div style={{width:34,height:34,borderRadius:10,background:`${item.col}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,margin:"0 auto"}}>{item.icon}</div>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{item.label}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          ) : (
            /* ── NORMAL DAY 1+ CONTENT ── */
            <>

              {/* ── PINNED "WHY" ANCHOR ── always near the top from Day 0+. */}
              <WhyAnchor
                profile={{ ...profile, currentDay: userGlobalDay }}
                onSave={(why) => {
                  setProfile(p => ({ ...p, initialWhy: why }));
                  // Persist directly — updateProfile()'s column list doesn't include initial_why
                  supabase.from("profiles").update({ initial_why: why }).eq("id", profile.id);
                }}
              />

              {/* ── IDENTITY CARD ── Days 4–14 only (cleared internally otherwise). */}
              {showIdentityCard && <IdentityCard profile={profile} currentDay={userGlobalDay} />}

              {/* ── MISSION STRIP ── week-at-a-glance + per-week metrics expand ── */}
              {todayDayData && (
                <MissionStrip
                  profile={profile}
                  userGlobalDay={userGlobalDay}
                  currentWeekNum={currentWeekNum}
                  currentWeekData={currentWeekData}
                  onDaySelected={(weekData, dayData) => setSelectedDay({ weekData, day: dayData })}
                />
              )}

              {/* ── TODAY METRICS ── moved up to sit directly under the
                   "Задача недели" ribbon (used to live below the chart).
                   Each row is gated by its own feature flag; the whole
                   section disappears in Weeks 1–2 when nothing is unlocked. */}
              {(showFoodDiary || showProteinTarget || showStepTracker) && (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",margin:"8px 0 12px"}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.12em"}}>{t("today.metrics")}</div>
                    {showFoodDiary && nutritionSource?.fromFatSecret && <span style={{fontSize:10,color:C.accent,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase"}}>· FatSecret</span>}
                  </div>
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"4px 20px",marginBottom:18}}>
                    {showFoodDiary && <MetricBar label={t("metric.calories")} value={nutritionSource?.calories||0} target={profile.dailyTargets?.calories||2000} unit="ккал" color={C.text} icon=""/>}
                    {showProteinTarget && <MetricBar label={t("metric.protein")}  value={nutritionSource?.protein||0}  target={profile.dailyTargets?.protein||150}  unit="г"     color={C.text} icon=""/>}
                    {showStepTracker && <MetricBar label={t("metric.steps")}    value={todayLog?.steps||0}           target={profile.dailyTargets?.steps||10000} unit="шагов" color={C.text} icon=""/>}
                  </div>
                </>
              )}

              {/* ── WEEKEND TIPS BAR ── only renders on Fri / Sat / Sun
                   with a rotating recommendation tied to weekNum. Hidden
                   Mon-Thu so the day stays uncluttered. */}
              <WeekendTipsBar weekNum={currentWeekNum} />

              {/* ── DAILY ACTIONS CAROUSEL ── Instagram-style full-bleed
                   swipeable slides (task, why, how, goal, day-8 stats,
                   psychology tip). Sits right under Показатели дня so the
                   day's "what to do" is the next thing the user sees. */}
              {todayDayData && (
                <div style={{marginBottom:18}}>
                  <DailyTaskCarousel
                    todayDayData={todayDayData}
                    currentWeekData={currentWeekData}
                    profile={profile}
                  />
                </div>
              )}

              {/* Weight + BFP */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>{t("today.weight")}</div>
                  <div style={{fontFamily:F.serif,fontSize:40,fontWeight:400,lineHeight:1,letterSpacing:"-0.025em",marginTop:10,color:C.text}}>{currentWeight}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:4}}>кг</div>
                  <div style={{fontFamily:F.mono,fontSize:11,marginTop:12,color:C.accent,fontWeight:500,letterSpacing:"0.02em"}}>{weightDiff>0?"+":"−"}{Math.abs(weightDiff)} кг с начала</div>
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>{t("today.bodyfat")}</div>
                  <div style={{fontFamily:F.serif,fontSize:40,fontWeight:400,lineHeight:1,letterSpacing:"-0.025em",marginTop:10,color:C.text}}>{currentBFP}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:4}}>метод ВМС США</div>
                </div>
              </div>

              {/* ── MEASUREMENT BANNER ── persistent until logged ── */}
              {missedMeasurement && (
                <div style={{background:C.accentDim,border:`1px solid ${C.accent}`,borderRadius:14,padding:"14px 16px",marginBottom:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:10,color:C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>
                    <Icon name="ruler" size={13}/>
                    {missedMeasurement.daysSince === 0
                      ? `День замеров · Неделя ${missedMeasurement.weekNum}`
                      : `Замеры за неделю ${missedMeasurement.weekNum} · просрочено ${missedMeasurement.daysSince} ${missedMeasurement.daysSince === 1 ? "день" : missedMeasurement.daysSince < 5 ? "дня" : "дней"}`}
                  </div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:12}}>
                    {missedMeasurement.daysSince === 0
                      ? "Раз в 7 дней замеряем тело — так мы рассчитываем % жира по методу ВМС США. Нужна сантиметровая лента."
                      : "Внеси замеры сегодня, чтобы пересчитать % жира и не сбить тренд."}
                    {profile.gender==="male" ? " Замеряй талию и шею." : " Замеряй талию, бёдра и шею."}
                  </div>
                  <button onClick={()=>setShowMorningLog(true)} style={{background:C.accent,color:C.bg,border:"none",borderRadius:999,padding:"9px 18px",fontSize:12,fontWeight:500,fontFamily:F.sans,cursor:"pointer",letterSpacing:"0.02em"}}>
                    Внести замеры →
                  </button>
                </div>
              )}

              {/* ── INLINE CHAT BAR ── */}
              <InlineChatBar profile={profile} onOpen={()=>setShowChat(true)}/>

              {/* Weight-trend chart removed from the Today tab — it now lives
                  only on the Account ("Я") tab. */}
            </>
          )}
          </div>
        </div>
      )}

      {/* ── PROGRAM — mountain-climb timeline ── */}
      {tab==="program"&&(
        <ProgramView
          profile={profile}
          onDaySelect={(weekData, day) => setSelectedDay({weekData, day})}
          onUpgrade={() => setShowUpgrade(true)}
        />
      )}

      {/* ── ACCOUNT — identity, body, lifestyle, targets, progress, settings ── */}
      {tab==="account"&&(
        <div style={{padding:"18px",animation:"slideUp 0.28s both",fontFamily:F.sans}}>

          {/* Identity hero */}
          <div style={{textAlign:"center",marginBottom:26,paddingTop:6}}>
            <button onClick={()=>setShowAvatarPicker(true)} title="Сменить аватар" style={{
              width:76,height:76,borderRadius:"50%",background:C.accentDim,color:C.accent,
              border:`1.5px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",
              margin:"0 auto 12px",cursor:"pointer",padding:0,fontFamily:F.sans,transition:"transform 0.15s",
            }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              <Avatar value={profile.avatar} size={42} strokeWidth={1.5}/>
            </button>
            <div style={{fontFamily:F.serif,fontSize:24,fontWeight:500,letterSpacing:"-0.015em",lineHeight:1.2}}>
              {profile.name}
            </div>
            <div style={{color:C.muted,fontSize:13,marginTop:6}}>
              {goalLabel(profile.goal)} · Неделя {profile.currentWeek} · {currentWeekData.theme}
            </div>
            <div style={{
              display:"inline-flex",alignItems:"center",gap:6,marginTop:14,padding:"6px 12px",
              background:C.accentDim,borderRadius:999,color:C.accent,
              fontFamily:F.mono,fontSize:12,fontWeight:600,letterSpacing:"0.02em",
            }}>
              <Icon name="flame" size={13}/>
              <span>{profile.streak}</span>
              <span style={{color:C.muted,fontWeight:500,marginLeft:2}}>· серия</span>
            </div>
          </div>

          {/* Subscription */}
          <SectionTitle title="Подписка"/>
          <div style={{
            background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,
            padding:"16px 18px",marginBottom:26,display:"flex",alignItems:"center",gap:14,
          }}>
            <div style={{
              width:42,height:42,borderRadius:12,
              background:profile.is_subscribed?C.accentDim:"transparent",
              color:profile.is_subscribed?C.accent:C.muted,
              border:profile.is_subscribed?"none":`1px solid ${C.border}`,
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            }}>
              <Icon name={profile.is_subscribed?"check":"lock"} size={20} strokeWidth={profile.is_subscribed?2:1.5}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{
                fontSize:10,color:profile.is_subscribed?C.accent:C.muted,
                letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,
              }}>{profile.is_subscribed?"Премиум":"Бесплатно"}</div>
              <div style={{fontSize:14,fontWeight:500,marginTop:2,color:C.text,lineHeight:1.4}}>
                {profile.is_subscribed
                  ? "Все недели открыты"
                  : (userGlobalDay<=14
                    ? `Осталось ${Math.max(0,15-userGlobalDay)} ${plural(15-userGlobalDay,"день","дня","дней")}`
                    : "Пробный период закончился")}
              </div>
            </div>
            <button onClick={()=>profile.is_subscribed?null:setShowUpgrade(true)} disabled={profile.is_subscribed} style={{
              background:profile.is_subscribed?"transparent":C.text,
              color:profile.is_subscribed?C.muted:C.bg,
              border:profile.is_subscribed?`1px solid ${C.border}`:"none",
              borderRadius:999,padding:"8px 14px",
              fontSize:12,fontWeight:500,fontFamily:F.sans,
              cursor:profile.is_subscribed?"default":"pointer",
              whiteSpace:"nowrap",flexShrink:0,letterSpacing:"0.01em",
            }}>
              {profile.is_subscribed?"Активна":"Открыть →"}
            </button>
          </div>

          {/* Body */}
          <SectionTitle title="Тело" action="Обновить" onAction={()=>setShowLog(true)}/>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginBottom:26}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              {[
                {l:"Возраст",v:profile.age,u:"лет"},
                {l:"Рост",v:profile.height,u:"см"},
                {l:"Стартовый вес",v:profile.weight,u:"кг"},
                {l:"Текущий вес",v:currentWeight,u:"кг"},
                {l:"ИМТ",v:profile.bmi||calcBMI(currentWeight,profile.height)||"—",u:""},
                {l:"% жира",v:profile.bfp||"—",u:profile.bfp?"%":""},
              ].map(s=>(
                <div key={s.l}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:500}}>{s.l}</div>
                  <div style={{
                    fontFamily:F.serif,fontSize:22,fontWeight:500,marginTop:4,
                    color:C.text,letterSpacing:"-0.02em",lineHeight:1.1,
                  }}>
                    {s.v}{s.u && <span style={{fontFamily:F.sans,fontSize:11,color:C.muted,fontWeight:500,marginLeft:4}}>{s.u}</span>}
                  </div>
                </div>
              ))}
            </div>
            {(profile.waist||profile.neck)&&(
              <div style={{borderTop:`1px solid ${C.border}`,marginTop:18,paddingTop:14}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,marginBottom:6}}>Замеры</div>
                {[["Талия",profile.waist],["Шея",profile.neck],...(profile.gender==="female"&&profile.thigh?[["Бёдра",profile.thigh]]:[])].filter(([,v])=>v).map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13}}>
                    <span style={{color:C.muted}}>{k}</span>
                    <span style={{fontFamily:F.mono,fontWeight:500}}>{v} см</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lifestyle */}
          <SectionTitle title="Образ жизни"/>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"4px 20px",marginBottom:26}}>
            {[
              ["Стресс",scaleLabel(profile.stress,"stress")],
              ["Сон",scaleLabel(profile.sleep,"sleep")],
              ["Питание",scaleLabel(profile.dietQuality,"diet")],
              ["Тренировки",trainingLabel(profile.training)],
              ...(profile.trainingExp?[["Опыт",expLabel(profile.trainingExp)]]:[]),
              ["Активность",activityLabel(profile.activity||"moderate")],
            ].map(([k,v],i)=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderTop:i===0?"none":`1px solid ${C.border}`,fontSize:13}}>
                <span style={{color:C.muted}}>{k}</span>
                <span style={{fontWeight:500,textAlign:"right",maxWidth:"60%"}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Daily targets */}
          <SectionTitle title="Дневные цели" action="Изменить" onAction={()=>setShowTargetsEdit(true)}/>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"4px 20px",marginBottom:26}}>
            {[
              {l:"Калории",v:profile.dailyTargets?.calories||2000,u:"ккал"},
              {l:"Белок",v:profile.dailyTargets?.protein||150,u:"г"},
              {l:"Шаги",v:profile.dailyTargets?.steps||10000,u:""},
            ].map((tgt,i)=>(
              <div key={tgt.l} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"13px 0",borderTop:i===0?"none":`1px solid ${C.border}`,fontSize:13}}>
                <span style={{color:C.muted}}>{tgt.l}</span>
                <span style={{fontFamily:F.mono,fontWeight:600,color:C.text}}>
                  {tgt.v.toLocaleString("ru-RU")} {tgt.u && <span style={{color:C.muted,fontWeight:500}}>{tgt.u}</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Mindset of current week */}
          <SectionTitle title={`Мышление недели ${profile.currentWeek}`}/>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginBottom:26}}>
            <div style={{fontFamily:F.serif,fontSize:18,fontWeight:500,letterSpacing:"-0.015em",lineHeight:1.3,marginBottom:12,color:C.text}}>
              {currentWeekData.mindset.title}
            </div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.7,fontStyle:"italic",borderLeft:`2px solid ${C.accent}`,paddingLeft:14}}>
              «{currentWeekData.mindset.quote}»
            </div>
          </div>

          {/* FatSecret */}
          <SectionTitle title="Питание"/>
          {showFoodDiary
            ? <FatSecretConnect profile={profile} setProfile={setProfile} userId={profile.id}/>
            : <LockedCard featureName="food_diary" currentDay={userGlobalDay}/>
          }

          {/* Progress */}
          <div style={{height:8}}/>
          <SectionTitle title="Прогресс"/>
          {profile.logs.length>1&&(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px",marginBottom:12}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,marginBottom:6}}>Динамика веса</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:14}}>
                {profile.logs.length} {plural(profile.logs.length,"запись","записи","записей")}
              </div>
              <WeightChart logs={profile.logs}/>
            </div>
          )}
          {weekLogs.length>0&&(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"4px 20px",marginBottom:12}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,padding:"14px 0 4px"}}>Средние за неделю</div>
              <MetricBar label="Калории" value={Math.round(weekLogs.reduce((s,l)=>s+(l.calories||0),0)/weekLogs.length)} target={profile.dailyTargets?.calories||2000} unit="ккал" color={C.text} icon=""/>
              <MetricBar label="Белок" value={Math.round(weekLogs.reduce((s,l)=>s+(l.protein||0),0)/weekLogs.length)} target={profile.dailyTargets?.protein||150} unit="г" color={C.text} icon=""/>
              <MetricBar label="Шаги" value={Math.round(weekLogs.reduce((s,l)=>s+(l.steps||0),0)/weekLogs.length)} target={profile.dailyTargets?.steps||10000} unit="шагов" color={C.text} icon=""/>
            </div>
          )}
          {profile.logs.length>0&&(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginBottom:26,overflowX:"auto"}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,marginBottom:14}}>Журнал · 14 дней</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <th style={{textAlign:"left",padding:"6px 0",color:C.muted,fontWeight:500,fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:F.sans}}>Дата</th>
                  <th style={{textAlign:"right",padding:"6px 6px",color:C.muted,fontWeight:500,fontSize:10,letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:F.sans}}>Вес</th>
                  <th style={{textAlign:"right",padding:"6px 6px",color:C.muted,fontWeight:500,fontSize:10,letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:F.sans}}>Ккал</th>
                  <th style={{textAlign:"right",padding:"6px 6px",color:C.muted,fontWeight:500,fontSize:10,letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:F.sans}}>Белок</th>
                  <th style={{textAlign:"right",padding:"6px 0",color:C.muted,fontWeight:500,fontSize:10,letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:F.sans}}>Шаги</th>
                </tr></thead>
                <tbody>{[...profile.logs].reverse().slice(0,14).map(l=>(
                  <tr key={l.date} style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:"9px 0",color:C.muted,whiteSpace:"nowrap",fontFamily:F.sans}}>{fmtDate(l.date)}</td>
                    <td style={{padding:"9px 6px",textAlign:"right",fontFamily:F.mono,fontWeight:600,color:C.text}}>{l.weight||"—"}</td>
                    <td style={{padding:"9px 6px",textAlign:"right",fontFamily:F.mono,color:l.calories?C.text:C.muted,fontWeight:500}}>{l.calories||"—"}</td>
                    <td style={{padding:"9px 6px",textAlign:"right",fontFamily:F.mono,color:l.protein?C.text:C.muted,fontWeight:500}}>{l.protein||"—"}</td>
                    <td style={{padding:"9px 0",textAlign:"right",fontFamily:F.mono,color:l.steps?C.text:C.muted,fontWeight:500}}>{l.steps?(l.steps/1000).toFixed(1)+"к":"—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* Settings */}
          <SectionTitle title="Настройки"/>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
            <SettingRow icon="globe" title="Язык" value={lang==="ru"?"Русский":"English"} onClick={()=>setShowLangSheet(true)}/>
            <SettingRow icon="bell"  title="Уведомления" value={notifLabel()} onClick={requestNotifPerm}/>
            <SettingRow icon="heart" title="О программе" onClick={()=>window.open("https://sciencebody.app","_blank","noopener")}/>
            <SettingRow icon="logout" title="Выйти из аккаунта" onClick={onSignOut} last/>
          </div>
          <button onClick={()=>{if(window.confirm("Удалить аккаунт? Это действие нельзя отменить."))onSignOut&&onSignOut();}} style={{
            width:"100%",background:"none",border:"none",
            color:C.red,fontSize:13,padding:"14px 0",marginBottom:8,
            cursor:"pointer",fontFamily:F.sans,fontWeight:500,letterSpacing:"0.02em",
          }}>
            Удалить аккаунт
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(250,250,247,0.92)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,display:"flex",padding:"10px 14px calc(10px + env(safe-area-inset-bottom))"}}>
        {TABS.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:tab===tb.id?C.text:C.muted,fontSize:11,fontFamily:F.sans,fontWeight:tab===tb.id?700:500,letterSpacing:"0.02em",padding:"4px 0",transition:"color 0.18s"}}>
            <Icon name={tb.icon} size={22} strokeWidth={tab===tb.id?1.75:1.5} />
            {tb.label}
          </button>
        ))}
      </div>

      {showLog&&<LogModal profile={profile} onSave={log=>{handleSaveLog(log);setShowLog(false);}} onClose={()=>setShowLog(false)}/>}
      {showMorningLog&&<MorningLogModal profile={profile} userGlobalDay={userGlobalDay} isMeasureOverdue={!!missedMeasurement} onSave={log=>{handleSaveLog(log);setShowMorningLog(false);}} onClose={()=>setShowMorningLog(false)}/>}
      {showEveningLog&&<EveningLogModal profile={profile} userGlobalDay={userGlobalDay} currentWeekNum={currentWeekNum} onSave={log=>{handleSaveLog(log);setShowEveningLog(false);}} onClose={()=>setShowEveningLog(false)}/>}
      {selectedDay&&<DayDetailModal weekData={selectedDay.weekData} day={selectedDay.day} onClose={()=>setSelectedDay(null)}/>}
      {showChat&&<ChatModal profile={profile} onClose={()=>{setShowChat(false);setUnreadCount(0);}}/>}
      {showAvatarPicker&&<AvatarPickerModal current={profile.avatar} onSelect={a=>setProfile({...profile,avatar:a})} onClose={()=>setShowAvatarPicker(false)}/>}
      {showUpgrade&&<UpgradeModal onSubscribe={()=>{setProfile({...profile,is_subscribed:true,subscribed_at:new Date().toISOString()});setShowUpgrade(false);}} onClose={()=>setShowUpgrade(false)}/>}
      {showTargetsEdit&&<TargetsEditModal
        current={profile.dailyTargets}
        onSave={(t)=>{setProfile({...profile,dailyTargets:t});setShowTargetsEdit(false);}}
        onClose={()=>setShowTargetsEdit(false)}
      />}
      {showLangSheet&&<LangSheet
        current={lang}
        onSelect={(code)=>{setLang&&setLang(code);setShowLangSheet(false);}}
        onClose={()=>setShowLangSheet(false)}
      />}
    </div>
  );
}

// ─── Account-tab helpers (labels, formatting, notifications) ────────────
function goalLabel(g) {
  return {fat_loss:"Снижение жира",recomp:"Рекомпозиция",health:"Здоровье"}[g]||g||"";
}
function activityLabel(a) {
  return {sedentary:"Сидячий",light:"Лёгкий",moderate:"Умеренный",active:"Активный",veryActive:"Очень активный"}[a]||a;
}
function trainingLabel(trainingType) {
  return {none:"Нет",["1_2x_week"]:"1–2 раза в неделю",["3plus_week"]:"3+ раз в неделю"}[trainingType]||trainingType||"—";
}
function expLabel(e) {
  return {beginner:"Начинающий",intermediate:"Средний",advanced:"Продвинутый"}[e]||e||"—";
}
function scaleLabel(level, kind) {
  const i = (level||3)-1;
  const labels = {
    stress: ["Низкий","Спокойно","Средний","Напряжённо","Высокий"],
    sleep:  ["Глубокий","Хороший","Средний","Беспокойный","Плохой"],
    diet:   ["Чисто","В основном чисто","Смешанно","Часто фастфуд","Только фастфуд"],
  }[kind] || [];
  return labels[i] || "—";
}
function plural(n, one, few, many) {
  const m = Math.abs(n) % 100, m10 = m % 10;
  if (m > 10 && m < 20) return many;
  if (m10 > 1 && m10 < 5) return few;
  if (m10 === 1) return one;
  return many;
}
function notifLabel() {
  if (typeof Notification === "undefined") return "Недоступно";
  if (Notification.permission === "granted") return "Включены";
  if (Notification.permission === "denied") return "Отключены";
  return "Не настроены";
}
function requestNotifPerm() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// ─── Section title ─────────────────────────────────────────────────────
function SectionTitle({ title, action, onAction }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",margin:"4px 2px 10px"}}>
      <div style={{fontSize:10,color:C.muted,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,fontFamily:F.sans}}>
        {title}
      </div>
      {action && (
        <button onClick={onAction} style={{
          background:"none",border:"none",cursor:"pointer",
          color:C.accent,fontSize:11,fontWeight:600,
          letterSpacing:"0.06em",textTransform:"uppercase",
          fontFamily:F.sans,padding:0,
        }}>
          {action} →
        </button>
      )}
    </div>
  );
}

// ─── Setting row ───────────────────────────────────────────────────────
function SettingRow({ icon, title, value, onClick, last }) {
  return (
    <button onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:14,
      width:"100%",padding:"14px 18px",
      background:"transparent",border:"none",
      borderBottom:last?"none":`1px solid ${C.border}`,
      cursor:"pointer",fontFamily:F.sans,textAlign:"left",
    }}>
      {icon && (
        <div style={{
          width:32,height:32,borderRadius:8,background:C.bg,
          color:C.muted,display:"flex",alignItems:"center",justifyContent:"center",
          flexShrink:0,border:`1px solid ${C.border}`,
        }}>
          <Icon name={icon} size={15} strokeWidth={1.6}/>
        </div>
      )}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:500,color:C.text}}>{title}</div>
      </div>
      {value && <div style={{fontSize:12,color:C.muted}}>{value}</div>}
      <div style={{color:C.muted,marginLeft:4,display:"flex"}}>
        <Icon name="chevronRight" size={14} strokeWidth={1.5}/>
      </div>
    </button>
  );
}

// ─── Daily-targets edit sheet ──────────────────────────────────────────
function TargetsEditModal({ current, onSave, onClose }) {
  const [cal, setCal] = useState(String(current?.calories||2000));
  const [pro, setPro] = useState(String(current?.protein||150));
  const [stp, setStp] = useState(String(current?.steps||10000));
  function save() {
    onSave({
      calories: parseInt(cal,10)||2000,
      protein:  parseInt(pro,10)||150,
      steps:    parseInt(stp,10)||10000,
    });
  }
  const field = (label, val, set, unit) => (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,marginBottom:8}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
        <input type="number" inputMode="numeric" value={val} onChange={e=>set(e.target.value)} style={{
          flex:1,background:"none",border:"none",outline:"none",padding:"13px 16px",
          color:C.text,fontSize:18,fontFamily:F.mono,fontWeight:600,
        }}/>
        {unit && <span style={{padding:"0 14px",color:C.muted,fontSize:12,fontWeight:500,fontFamily:F.sans}}>{unit}</span>}
      </div>
    </div>
  );
  return (
    <div
      onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(14,17,23,0.35)",zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"fadeIn 0.2s both"}}
    >
      <div style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderRadius:"22px 22px 0 0",padding:"18px 22px calc(28px + env(safe-area-inset-bottom))",maxWidth:430,width:"100%",margin:"0 auto",animation:"slideUp 0.32s cubic-bezier(.16,1,.3,1) both",maxHeight:"82vh",overflowY:"auto",fontFamily:F.sans}}>
        <div style={{width:40,height:4,background:C.dim,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
          <div style={{fontSize:10,color:C.accent,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase"}}>Цели</div>
          <button onClick={onClose} aria-label="Закрыть" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:24,padding:0,lineHeight:1,fontFamily:F.sans}}>×</button>
        </div>
        <h3 style={{fontFamily:F.serif,fontSize:22,fontWeight:500,letterSpacing:"-0.015em",lineHeight:1.2,marginBottom:8}}>Дневные цели</h3>
        <p style={{fontSize:13,color:C.muted,lineHeight:1.55,marginBottom:18}}>Установи цели вручную. Калории и белок считай в день, шаги — суммарно.</p>
        {field("Калории", cal, setCal, "ккал")}
        {field("Белок", pro, setPro, "г")}
        {field("Шаги", stp, setStp, "")}
        <button onClick={save} style={{
          width:"100%",background:C.text,color:C.bg,border:"none",borderRadius:14,
          padding:"14px",fontSize:15,fontWeight:500,fontFamily:F.sans,cursor:"pointer",
          marginTop:6,letterSpacing:"0.01em",
        }}>Сохранить</button>
      </div>
    </div>
  );
}

// ─── Language sheet ────────────────────────────────────────────────────
function LangSheet({ current, onSelect, onClose }) {
  const options = [
    { code:"ru", label:"Русский", sub:"Russian" },
    { code:"en", label:"English", sub:"English" },
  ];
  return (
    <div
      onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(14,17,23,0.35)",zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"fadeIn 0.2s both"}}
    >
      <div style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderRadius:"22px 22px 0 0",padding:"18px 22px calc(28px + env(safe-area-inset-bottom))",maxWidth:430,width:"100%",margin:"0 auto",animation:"slideUp 0.32s cubic-bezier(.16,1,.3,1) both",fontFamily:F.sans}}>
        <div style={{width:40,height:4,background:C.dim,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
          <div style={{fontSize:10,color:C.accent,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase"}}>Настройки</div>
          <button onClick={onClose} aria-label="Закрыть" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:24,padding:0,lineHeight:1,fontFamily:F.sans}}>×</button>
        </div>
        <h3 style={{fontFamily:F.serif,fontSize:22,fontWeight:500,letterSpacing:"-0.015em",lineHeight:1.2,marginBottom:14}}>Язык приложения</h3>
        {options.map(o=>{
          const selected = current === o.code;
          return (
            <button key={o.code} onClick={()=>onSelect(o.code)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:12,
              padding:"14px 16px",marginBottom:8,
              background:selected?C.accentDim:C.bg,
              border:`1.5px solid ${selected?C.accent:C.border}`,
              borderRadius:14,cursor:"pointer",fontFamily:F.sans,textAlign:"left",
              color:selected?C.accent:C.text,
            }}>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:500}}>{o.label}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{o.sub}</div>
              </div>
              {selected && <div style={{width:22,height:22,borderRadius:"50%",background:C.accent,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="check" size={12} strokeWidth={2.5}/></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Avatar picker bottom-sheet ──────────────────────────────────────
function AvatarPickerModal({ current, onSelect, onClose }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{position:"fixed",inset:0,background:"rgba(14,17,23,0.35)",zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"fadeIn 0.2s both"}}
    >
      <div style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderRadius:"22px 22px 0 0",padding:"18px 22px calc(32px + env(safe-area-inset-bottom))",maxWidth:430,width:"100%",margin:"0 auto",animation:"slideUp 0.32s cubic-bezier(.16,1,.3,1) both",maxHeight:"82vh",overflowY:"auto",fontFamily:F.sans}}>
        <div style={{width:40,height:4,background:C.dim,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
          <div style={{fontSize:10,color:C.accent,fontWeight:500,letterSpacing:"0.14em",textTransform:"uppercase"}}>Профиль</div>
          <button onClick={onClose} aria-label="Закрыть" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:24,padding:0,lineHeight:1,fontFamily:F.sans}}>×</button>
        </div>
        <h3 style={{fontFamily:F.serif,fontSize:22,fontWeight:500,letterSpacing:"-0.015em",lineHeight:1.2,marginBottom:6}}>Сменить аватар</h3>
        <p style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:18}}>Выбери животное — оно появится в шапке и в профиле.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {AVATAR_OPTIONS.map(a => {
            const selected = current === a;
            return (
              <button
                key={a}
                onClick={() => { onSelect(a); onClose(); }}
                style={{
                  aspectRatio:"1",
                  borderRadius:14,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:selected?C.accentDim:C.bg,
                  border:`1.5px solid ${selected?C.accent:C.border}`,
                  color:selected?C.accent:C.text,
                  cursor:"pointer",padding:0,
                  transition:"all 0.15s",
                  fontFamily:F.sans,
                }}
              >
                <Avatar value={a} size={34} strokeWidth={selected?1.75:1.5} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Upgrade bottom-sheet ────────────────────────────────────────────
function UpgradeModal({ onSubscribe, onClose }) {
  const benefits = [
    { title: "Все 112 заданий программы",        sub: "16 недель структурированного пути по составу тела" },
    { title: "ИИ-тренер · 10 сообщений в день",  sub: "Ответы по питанию, тренировкам и мотивации" },
    { title: "Замеры и расчёт % жира",            sub: "Метод ВМС США раз в 7 дней — динамика по составу" },
    { title: "Синхронизация с FatSecret",         sub: "Автоматический подсчёт калорий и белка" },
  ];
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{position:"fixed",inset:0,background:"rgba(14,17,23,0.45)",zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"fadeIn 0.2s both"}}
    >
      <div style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderRadius:"22px 22px 0 0",padding:"18px 22px calc(28px + env(safe-area-inset-bottom))",maxWidth:430,width:"100%",margin:"0 auto",animation:"slideUp 0.32s cubic-bezier(.16,1,.3,1) both",maxHeight:"90vh",overflowY:"auto",fontFamily:F.sans}}>
        <div style={{width:40,height:4,background:C.dim,borderRadius:2,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:10,color:C.accent,fontWeight:500,letterSpacing:"0.18em",textTransform:"uppercase"}}>
            <Icon name="lock" size={12}/> Премиум
          </div>
          <button onClick={onClose} aria-label="Закрыть" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:24,padding:0,lineHeight:1,fontFamily:F.sans}}>×</button>
        </div>
        <h3 style={{fontFamily:F.serif,fontSize:26,fontWeight:500,letterSpacing:"-0.02em",lineHeight:1.15,marginTop:2,marginBottom:8}}>
          Открой полный путь<br/><span style={{color:C.muted}}>16 недель.</span>
        </h3>
        <p style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:20}}>
          Программа основана на методиках по составу тела. Бесплатно — первые 2 недели. Дальше открывается всё, что внутри.
        </p>

        {/* Benefits list */}
        <div style={{borderTop:`1px solid ${C.border}`,marginBottom:20}}>
          {benefits.map((b,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${C.accent}`,color:C.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                <Icon name="check" size={11} strokeWidth={2.4}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,color:C.text,fontWeight:500,lineHeight:1.35}}>{b.title}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.5,marginTop:2}}>{b.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Price block */}
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:12}}>
          <div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:500}}>Подписка</div>
            <div style={{fontFamily:F.serif,fontSize:26,fontWeight:500,letterSpacing:"-0.02em",marginTop:2,color:C.text}}>
              590 ₽ <span style={{fontSize:13,color:C.muted}}>/ мес</span>
            </div>
          </div>
          <div style={{fontSize:11,color:C.muted,textAlign:"right",lineHeight:1.5}}>
            Отмена<br/>в любой момент
          </div>
        </div>

        <button onClick={onSubscribe} style={{width:"100%",background:C.accent,color:C.bg,border:"none",borderRadius:14,padding:"15px",fontSize:15,fontWeight:500,fontFamily:F.sans,cursor:"pointer",letterSpacing:"0.01em"}}>
          Подписаться
        </button>
        <button onClick={onClose} style={{width:"100%",background:"none",border:"none",color:C.muted,fontSize:13,padding:"14px 0 0",cursor:"pointer",fontFamily:F.sans}}>
          Не сейчас
        </button>
      </div>
    </div>
  );
}
