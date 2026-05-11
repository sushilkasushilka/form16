// Authenticated member view — three tabs: today (current task + habits),
// program (16-week calendar), account (progress + profile + FatSecret).
// Hosts every log/chat/day-detail modal.
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C } from "../theme.js";
import { todayStr, fmtDate, calcBMI } from "../utils.js";
import { t } from "../i18n.js";
import { PROGRAM, getUserGlobalDay, getTodayData, getMissedMeasurement } from "../program.js";
import { MetricBar, WeightChart } from "../components/ui.jsx";
import { FatSecretConnect } from "../components/FatSecretConnect.jsx";
import { InlineChatBar, ChatModal } from "../components/Chat.jsx";
import { DayDetailModal, MorningLogModal, EveningLogModal, LogModal } from "../components/LogModals.jsx";
import { MissionStrip } from "../components/MissionStrip.jsx";
import { DailyTaskCarousel } from "../components/DailyTaskCarousel.jsx";

export function MemberDashboard({profile,setProfile,saveLog,onSignOut,onBack,openLogOnLoad,onLogOpened}){
  const [tab,setTab]=useState("today");
  const [showLog,setShowLog]=useState(false);
  const [showMorningLog,setShowMorningLog]=useState(false);
  const [showEveningLog,setShowEveningLog]=useState(false);
  const [selectedDay,setSelectedDay]=useState(null);
  const [showChat,setShowChat]=useState(false);
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
  const currentWeekNum = Math.max(1, Math.min(16, Math.ceil((userGlobalDay) / 7) || 1));
  const { week: currentWeekData, day: todayDayData, isDay0 } = getTodayData(profile) || { week: PROGRAM[0], day: PROGRAM[0].days[0], isDay0: true };
  const missedMeasurement = getMissedMeasurement(profile);
  const fsSyncData=profile.fsSyncData;
  const nutritionSource=fsSyncData&&profile.fsSyncedAt&&new Date(profile.fsSyncedAt).toISOString().split("T")[0]===todayStr()?fsSyncData:todayLog;

  function handleSaveLog(log){
    if(saveLog) saveLog(log);
    else setProfile(p=>({...p,logs:[...(p.logs||[]).filter(l=>l.date!==log.date),log],streak:p.streak+1,totalXP:p.totalXP+20}));
    // Update BFP on profile if measurements were logged
    if(log.bfp) setProfile(p=>({...p,bfp:log.bfp}));
  }

  const TABS=[{id:"today",icon:"📊",label:t("tab.today")},{id:"program",icon:"🗓",label:t("tab.program")},{id:"account",icon:"👤",label:"Я"}];

  const taskTypeColor = {training:C.orange,nutrition:C.accent,mindset:C.purple,rest:C.muted}[todayDayData?.type]||C.orange;

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:88}}>
      {/* Header — name + day/week + date + program-progress bar.
          One united block at the top, replacing the previous header + the
          standalone date/progress card. Log buttons moved into a new
          "Отчёты" card on the today tab. */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"48px 20px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {onBack&&<button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,padding:0,marginRight:2}}>←</button>}
          <div style={{width:44,height:44,borderRadius:14,background:C.accentDim,border:`1.5px solid ${C.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{profile.avatar}</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{profile.name}</div>
            {!isDay0 && (
              <div style={{fontSize:11,color:C.muted,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                <span style={{color:C.accent,fontWeight:700}}>День {userGlobalDay}</span>
                <span style={{margin:"0 6px",color:C.dim}}>·</span>
                Неделя {currentWeekNum} — {currentWeekData.theme}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:C.orange}}>🔥{profile.streak}</div><div style={{fontSize:10,color:C.muted}}>{t("header.streak")}</div></div>
            {onSignOut&&<button onClick={onSignOut} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,padding:"5px 10px",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>{t("header.signout")}</button>}
          </div>
        </div>

        {/* Date + program-progress (same surface block as the header above) */}
        {!isDay0 && (
          <div style={{marginTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:12,color:C.muted,textTransform:"capitalize"}}>{new Date().toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"})}</div>
              <div style={{fontSize:10,color:C.muted}}>{userGlobalDay} / 112</div>
            </div>
            <div style={{height:5,background:C.dim,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",background:`linear-gradient(90deg,${C.accent},#00D2FF)`,width:`${Math.min(100,(userGlobalDay/112)*100)}%`,borderRadius:3,transition:"width 1s cubic-bezier(.16,1,.3,1)"}}/>
            </div>
          </div>
        )}
      </div>


      {/* ── TODAY ── */}
      {tab==="today"&&(
        <div style={{padding:"18px",animation:"slideUp 0.28s both"}}>

          {/* ── ОТЧЁТЫ ── morning + evening log buttons in their own card ── */}
          {!isDay0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:10}}>Отчёты</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button onClick={()=>setShowMorningLog(true)} style={{
                  background: todayLog?.weight ? C.accentDim : C.accent,
                  color: todayLog?.weight ? C.accent : C.bg,
                  border: todayLog?.weight ? `1.5px solid ${C.accent}55` : "none",
                  borderRadius:14, padding:"14px 12px",
                  fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                  <span style={{fontSize:18}}>⚖️</span>
                  <span>Утренний</span>
                  {todayLog?.weight && <span style={{fontWeight:800}}>✓</span>}
                </button>
                <button onClick={()=>setShowEveningLog(true)} style={{
                  background: todayLog?.calories ? C.blueDim : C.blue,
                  color: todayLog?.calories ? C.blue : C.bg,
                  border: todayLog?.calories ? `1.5px solid ${C.blue}55` : "none",
                  borderRadius:14, padding:"14px 12px",
                  fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                  <span style={{fontSize:18}}>🌙</span>
                  <span>Вечерний</span>
                  {todayLog?.calories && <span style={{fontWeight:800}}>✓</span>}
                </button>
              </div>
            </div>
          )}

          {/* ── DAY 0 FULL TAKEOVER ── */}
          {isDay0 ? (
            <div style={{animation:"fadeIn 0.3s both"}}>

              {/* Setup checklist — carried from Day 0 screen */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,marginBottom:14,overflow:"hidden"}}>
                <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:700}}>Настройка</div>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700}}>
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
                <div style={{fontSize:11,color:C.blue,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12}}>Задача дня 0</div>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <div style={{width:48,height:48,borderRadius:15,background:`${C.blue}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🍽️</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Запиши первый приём пищи</div>
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
                    <div><div style={{fontSize:12,fontWeight:700}}>Персональный тренер</div><div style={{fontSize:10,color:C.accent}}>ИИ · отвечает мгновенно</div></div>
                  </div>
                  <button onClick={()=>setShowChat(true)} style={{fontSize:11,color:C.accent,background:C.accentDim,border:"none",borderRadius:14,padding:"4px 10px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>Открыть →</button>
                </div>
                <div style={{padding:"10px 12px",display:"flex",gap:8,alignItems:"center"}}>
                  <input placeholder="Спроси тренера…" onFocus={()=>setShowChat(true)} readOnly style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 12px",color:C.muted,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer"}}/>
                  <div style={{width:34,height:34,borderRadius:"50%",background:C.dim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.bg,flexShrink:0}}>↑</div>
                </div>
              </div>

              {/* Tomorrow preview */}
              <div style={{background:C.card,border:`1.5px solid ${C.accent}44`,borderRadius:18,overflow:"hidden"}}>
                <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Завтра — День 1</div>
                  <div style={{fontSize:12,color:C.muted}}>Вот что тебя ждёт</div>
                </div>
                {[
                  {time:"07:00",icon:"⚖️",col:C.accent,label:"Встань на весы",sub:"После туалета, до завтрака"},
                  {time:"Днём",icon:"🍽️",col:C.blue,label:"Записывай еду",sub:"Каждый приём пищи сразу после еды"},
                  {time:"21:00",icon:"🌙",col:C.purple,label:"Итог дня",sub:"Напомним проверить и дозаписать питание"},
                ].map((item,i,arr)=>(
                  <div key={item.time} style={{display:"flex",gap:14,padding:"12px 18px",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",alignItems:"center"}}>
                    <div style={{width:38,textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:10,color:item.col,fontWeight:700,marginBottom:5}}>{item.time}</div>
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

              {/* ── MISSION STRIP ── one-line week view; tap a circle opens that day's detail modal ── */}
              {todayDayData && (
                <MissionStrip
                  profile={profile}
                  userGlobalDay={userGlobalDay}
                  currentWeekNum={currentWeekNum}
                  currentWeekData={currentWeekData}
                  onDaySelected={(weekData, dayData) => setSelectedDay({weekData, day: dayData})}
                />
              )}

              {/* ── TODAY'S TASK CAROUSEL ── separate from the mission strip ── */}
              {todayDayData && (
                <DailyTaskCarousel
                  todayDayData={todayDayData}
                  currentWeekData={currentWeekData}
                  profile={profile}
                  onOpenDetails={()=>setSelectedDay({weekData:currentWeekData,day:todayDayData})}
                />
              )}

              {/* ── MEASUREMENT REMINDER ── persistent until logged ── */}
              {missedMeasurement && (
                <div style={{background:`${C.purple}14`,border:`1.5px solid ${C.purple}44`,borderRadius:18,padding:"14px 16px",marginBottom:14}}>
                  <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>
                    📏 {missedMeasurement.daysSince === 0
                      ? `День замеров — Неделя ${missedMeasurement.weekNum}`
                      : `Замеры за неделю ${missedMeasurement.weekNum} — пропущены ${missedMeasurement.daysSince} ${missedMeasurement.daysSince === 1 ? "день" : missedMeasurement.daysSince < 5 ? "дня" : "дней"} назад`}
                  </div>
                  <div style={{fontSize:13,color:C.muted,lineHeight:1.65,marginBottom:12}}>
                    {missedMeasurement.daysSince === 0
                      ? "Раз в 7 дней замеряем тело — так мы рассчитываем % жира по методу ВМС США. Нужна сантиметровая лента."
                      : "Внеси замеры сегодня, чтобы пересчитать % жира и не сбить тренд. Нужна сантиметровая лента."}
                    {profile.gender==="male"
                      ? " Замеряй: талию и шею."
                      : " Замеряй: талию, бёдра и шею."}
                  </div>
                  <button onClick={()=>setShowMorningLog(true)} style={{background:C.purple,color:"#fff",border:"none",borderRadius:14,padding:"10px 18px",fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Внести замеры →</button>
                </div>
              )}

              {/* ── INLINE CHAT BAR ── */}
              <InlineChatBar profile={profile} onOpen={()=>setShowChat(true)}/>

              {/* Weight + BFP */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"16px"}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:5}}>{t("today.weight")}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,lineHeight:1}}>{currentWeight}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>кг</div>
                  <div style={{fontSize:12,marginTop:8,color:weightDiff<=0?C.accent:C.orange,fontWeight:600}}>{weightDiff>0?"+":""}{weightDiff} кг с начала</div>
                </div>
                <div style={{background:C.purpleDim,border:`1px solid ${C.purple}33`,borderRadius:20,padding:"16px"}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:5}}>{t("today.bodyfat")}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,lineHeight:1,color:C.purple}}>{currentBFP}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>%</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:8}}>{t("today.navy")}</div>
                </div>
              </div>

              {/* Weight trend */}
              {profile.logs.length>1&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"14px 16px",marginBottom:14}}><div style={{fontSize:12,color:C.muted,marginBottom:10}}>{t("today.trend")}</div><WeightChart logs={profile.logs} compact/></div>}

              {/* Metrics */}
              {(todayLog||nutritionSource)?(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,padding:"18px 20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontWeight:700}}>{t("today.metrics")}</div>{nutritionSource?.fromFatSecret&&<span style={{fontSize:11,color:C.accent,background:C.accentDim,padding:"3px 10px",borderRadius:20,fontWeight:700}}>⚡ FatSecret</span>}</div>
                  <MetricBar label={t("metric.calories")} value={nutritionSource?.calories||0} target={profile.dailyTargets?.calories||2000} unit="ккал" color={C.orange} icon="🔥"/>
                  <MetricBar label={t("metric.protein")} value={nutritionSource?.protein||0} target={profile.dailyTargets?.protein||150} unit="г" color={C.purple} icon="🥩"/>
                  <MetricBar label={t("metric.steps")} value={todayLog?.steps||0} target={profile.dailyTargets?.steps||10000} unit="шагов" color={C.accent} icon="👟"/>
                </div>
              ):(
                <div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:22,padding:"24px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{color:C.muted,fontSize:14}}>{t("today.no_log")}</div></div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── PROGRAM — 112 daily cards ── */}
      {tab==="program"&&(
        <div style={{padding:"18px",animation:"slideUp 0.28s both"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>{t("program.title")}</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:18}}>{t("program.tap")}</div>
          {PROGRAM.map(wk=>{
            const weekUnlocked = wk.week <= profile.currentWeek;
            const weekActive = wk.week === profile.currentWeek;
            // Global day number: week 1 day 1 = day 1, week 2 day 1 = day 8, etc.
            return (
              <div key={wk.week} style={{marginBottom:8}}>
                {/* Week header */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,marginTop:wk.week>1?16:0}}>
                  <div style={{width:28,height:28,borderRadius:8,background:`${wk.color}22`,border:`1.5px solid ${wk.color}${weekUnlocked?"88":"33"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:weekUnlocked?wk.color:C.dim,flexShrink:0}}>
                    {wk.week}
                  </div>
                  <div style={{flex:1}}>
                    <span style={{fontSize:13,fontWeight:700,color:weekUnlocked?C.text:C.dim}}>{t(`week.${wk.week}.theme`)}</span>
                    {weekActive&&<span style={{marginLeft:8,fontSize:10,color:wk.color,background:`${wk.color}22`,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{t("program.active")}</span>}
                  </div>
                  {!weekUnlocked&&<span style={{fontSize:14}}>🔒</span>}
                </div>

                {/* Day cards */}
                {wk.days.map(day=>{
                  const globalDay = (wk.week-1)*7 + day.day;
                  const userGlobalDay = getUserGlobalDay(profile);
                  const dayDone = globalDay < userGlobalDay;
                  const dayActive = globalDay === userGlobalDay && userGlobalDay > 0;
                  const dayUnlocked = globalDay <= Math.max(1, userGlobalDay) && wk.week <= profile.currentWeek;
                  const typeColor = {training:C.orange,nutrition:C.accent,mindset:C.purple,rest:C.muted,active_recovery:C.blue}[day.type]||C.muted;
                  return (
                    <div key={day.day}
                      onClick={()=>dayUnlocked&&setSelectedDay({weekData:wk,day})}
                      style={{background:dayActive?`${typeColor}14`:dayDone?C.surface:C.card,border:`1px solid ${dayActive?typeColor+"66":dayDone?C.dim:C.border}`,borderRadius:16,padding:"12px 14px",marginBottom:6,opacity:dayUnlocked?1:0.3,cursor:dayUnlocked?"pointer":"default",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}
                    >
                      {/* Day number */}
                      <div style={{width:36,height:36,borderRadius:10,background:dayDone?C.accent+"33":dayActive?`${typeColor}22`:C.dim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:dayDone?16:13,fontWeight:800,color:dayDone?C.accent:dayActive?typeColor:C.muted}}>
                        {dayDone?"✓":day.icon}
                      </div>
                      {/* Content */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div style={{fontSize:13,fontWeight:700,color:dayActive?typeColor:dayDone?C.muted:C.text,flex:1}}>{day.title}</div>
                        </div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{day.task}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ACCOUNT (Progress + Profile combined) ── */}
      {tab==="account"&&(
        <div style={{padding:"18px",animation:"slideUp 0.28s both"}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:14}}>Прогресс</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:18}}>{t("progress.title")}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[{label:t("progress.start"),val:`${profile.weight} kg`,color:C.muted,icon:"📍"},{label:t("progress.current"),val:`${currentWeight} kg`,color:C.blue,icon:"⚖️"},{label:weightDiff<=0?t("progress.lost"):t("progress.gained"),val:`${Math.abs(weightDiff)} kg`,color:weightDiff<=0?C.accent:C.orange,icon:weightDiff<=0?"📉":"📈"},{label:t("progress.bodyfat"),val:`${currentBFP}%`,color:C.purple,icon:"📊"},{label:t("progress.bmi"),val:String(profile.bmi||calcBMI(currentWeight,profile.height)),color:C.blue,icon:"🩺"}].map(s=>(
              <div key={s.label} style={{background:C.card,borderRadius:18,padding:"14px 16px",border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}><span style={{fontSize:15}}>{s.icon}</span><span style={{fontSize:11,color:C.muted}}>{s.label}</span></div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{background:C.card,borderRadius:22,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:3}}>{t("progress.trend")}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>{t("progress.tracked",{n:profile.logs.length})}</div>
            <WeightChart logs={profile.logs}/>
          </div>
          {weekLogs.length>0&&(
            <div style={{background:C.card,borderRadius:22,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:700,marginBottom:14}}>{t("progress.averages")}</div>
              <MetricBar label={t("metric.calories")} value={Math.round(weekLogs.reduce((s,l)=>s+(l.calories||0),0)/weekLogs.length)} target={profile.dailyTargets?.calories||2000} unit="kcal" color={C.orange} icon="🔥"/>
              <MetricBar label={t("metric.protein")} value={Math.round(weekLogs.reduce((s,l)=>s+(l.protein||0),0)/weekLogs.length)} target={profile.dailyTargets?.protein||150} unit="g" color={C.purple} icon="🥩"/>
              <MetricBar label={t("metric.steps")} value={Math.round(weekLogs.reduce((s,l)=>s+(l.steps||0),0)/weekLogs.length)} target={profile.dailyTargets?.steps||10000} unit={t("unit.steps")} color={C.accent} icon="👟"/>
            </div>
          )}
          {profile.logs.length>0&&(
            <div style={{background:C.card,borderRadius:22,padding:"18px",border:`1px solid ${C.border}`}}>
              <div style={{fontWeight:700,marginBottom:14}}>{t("progress.log")}</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr>{["Date","⚖️","🔥","🥩","👟"].map(h=><th key={h} style={{textAlign:"right",padding:"5px 7px",color:C.muted,fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                  <tbody>{[...profile.logs].reverse().slice(0,14).map(l=>(
                    <tr key={l.date} style={{borderTop:`1px solid ${C.dim}`}}>
                      <td style={{padding:"7px 7px",color:C.muted,whiteSpace:"nowrap"}}>{fmtDate(l.date)}</td>
                      <td style={{padding:"7px 7px",textAlign:"right",fontWeight:600,color:C.blue}}>{l.weight}</td>
                      <td style={{padding:"7px 7px",textAlign:"right",color:C.orange}}>{l.calories}</td>
                      <td style={{padding:"7px 7px",textAlign:"right",color:C.purple}}>{l.protein}g</td>
                      <td style={{padding:"7px 7px",textAlign:"right",color:C.accent}}>{((l.steps||0)/1000).toFixed(1)}k</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="account"&&(
        <div style={{padding:"18px",paddingTop:4,animation:"slideUp 0.28s both"}}>
          <div style={{fontWeight:800,marginBottom:14,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,fontSize:11}}>Профиль</div>
          <div style={{textAlign:"center",marginBottom:22}}>
            <div style={{width:76,height:76,borderRadius:"50%",fontSize:36,background:C.accentDim,border:`3px solid ${C.accent}55`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>{profile.avatar}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800}}>{profile.name}</div>
            <div style={{color:C.muted,fontSize:13,marginTop:3,textTransform:"capitalize"}}>{(profile.goal||"").replace("_"," ")} · Week {profile.currentWeek} — {currentWeekData.theme}</div>
            <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:10}}>
              <span style={{fontSize:12,color:C.orange,background:C.orangeDim,padding:"4px 12px",borderRadius:20,fontWeight:700}}>🔥 {profile.streak} дней подряд</span>
            </div>
          </div>
          <div style={{background:C.card,borderRadius:20,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:12}}>{t("profile.body_stats")}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[["Age",`${profile.age}y`],["Height",`${profile.height}cm`],["Weight",`${profile.weight}kg`],["BMI",profile.bmi||"—"],["Body Fat",profile.bfp?`${profile.bfp}%`:"—"]].map(([k,v])=>(
                <div key={k} style={{background:C.surface,borderRadius:12,padding:"10px 9px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800}}>{v}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{k}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:C.card,borderRadius:20,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:12}}>{t("profile.measurements")}</div>
            {[["Waist",profile.waist,"cm"],["Neck",profile.neck,"cm"],...(profile.gender==="female"&&profile.thigh?[["Thigh",profile.thigh,"cm"]]:[])].filter(([,v])=>v).map(([k,v,u])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:13}}>{k}</span><span style={{fontWeight:700,fontSize:13}}>{v} {u}</span></div>
            ))}
          </div>
          <div style={{background:C.card,borderRadius:20,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:12}}>{t("profile.lifestyle")}</div>
            {[
              [t("profile.stress"),["😌","🙂","😐","😤","😰"][(profile.stress||3)-1]+" "+[t("stress.1"),t("stress.2"),t("stress.3"),t("stress.4"),t("stress.5")][(profile.stress||3)-1]],
              [t("profile.sleep"),["😴","🛌","😑","😟","😵"][(profile.sleep||3)-1]+" "+[t("sleep.1"),t("sleep.2"),t("sleep.3"),t("sleep.4"),t("sleep.5")][(profile.sleep||3)-1]],
              [t("profile.diet"),["🥗","🍱","🍜","🍔","🍕"][(profile.dietQuality||3)-1]+" "+[t("diet.1"),t("diet.2"),t("diet.3"),t("diet.4"),t("diet.5")][(profile.dietQuality||3)-1]],
              [t("profile.training"),profile.training==="none"?t("training.display.none"):profile.training==="1_2x_week"?t("training.display.1_2x"):t("training.display.3plus")],
              ...(profile.trainingExp?[[t("profile.experience"),profile.trainingExp]]:[]),
              [t("profile.activity"),(profile.activity||"moderate")],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:13}}>{k}</span><span style={{fontWeight:600,fontSize:13,textTransform:"capitalize"}}>{v}</span></div>
            ))}
          </div>
          {/* Current week mindset */}
          <div style={{background:C.purpleDim,border:`1px solid ${C.purple}33`,borderRadius:20,padding:"16px 18px",marginBottom:12}}>
            <div style={{fontWeight:700,marginBottom:8}}>🧠 {t("profile.mindset",{w:profile.currentWeek})}</div>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:6}}>{currentWeekData.mindset.title}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.7,fontStyle:"italic",borderLeft:`3px solid ${C.purple}`,paddingLeft:12}}>"{currentWeekData.mindset.quote}"</div>
          </div>
          {/* FatSecret connection */}
          <FatSecretConnect profile={profile} setProfile={setProfile} userId={profile.id}/>
          <div style={{background:C.card,borderRadius:20,padding:"16px 18px",border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:700,marginBottom:12}}>{t("profile.targets")}</div>
            {[{l:t("profile.calories"),v:`${profile.dailyTargets?.calories||2000} kcал`,c:C.orange},{l:t("profile.protein"),v:`${profile.dailyTargets?.protein||150} г`,c:C.purple},{l:t("profile.steps"),v:(profile.dailyTargets?.steps||10000).toLocaleString(),c:C.accent}].map(tgt=>(
              <div key={tgt.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:13}}>{tgt.l}</span><span style={{fontWeight:700,color:tgt.c,fontSize:13}}>{tgt.v}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",padding:"10px 16px 22px"}}>
        {TABS.map(tb=><button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===tb.id?C.accent:C.dim,fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:0.3,padding:"5px 0",transition:"color 0.18s"}}><span style={{fontSize:20}}>{tb.icon}</span>{tb.label}</button>)}
      </div>

      {showLog&&<LogModal profile={profile} onSave={log=>{handleSaveLog(log);setShowLog(false);}} onClose={()=>setShowLog(false)}/>}
      {showMorningLog&&<MorningLogModal profile={profile} userGlobalDay={userGlobalDay} isMeasureOverdue={!!missedMeasurement} onSave={log=>{handleSaveLog(log);setShowMorningLog(false);}} onClose={()=>setShowMorningLog(false)}/>}
      {showEveningLog&&<EveningLogModal profile={profile} userGlobalDay={userGlobalDay} currentWeekNum={currentWeekNum} onSave={log=>{handleSaveLog(log);setShowEveningLog(false);}} onClose={()=>setShowEveningLog(false)}/>}
      {selectedDay&&<DayDetailModal weekData={selectedDay.weekData} day={selectedDay.day} onClose={()=>setSelectedDay(null)}/>}
      {showChat&&<ChatModal profile={profile} onClose={()=>{setShowChat(false);setUnreadCount(0);}}/>}
    </div>
  );
}
