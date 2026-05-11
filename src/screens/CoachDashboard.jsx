// Coach portal — three tabs: athletes (cards), insights (compliance + leaderboard),
// notes (free-form text per athlete). Drilling into an athlete renders the regular
// MemberDashboard with that athlete's profile.
import { useState } from "react";
import { C } from "../theme.js";
import { todayStr, pct } from "../utils.js";
import { t } from "../i18n.js";
import { getWeek } from "../program.js";
import { MemberDashboard } from "./MemberDashboard.jsx";

export function CoachDashboard({athletes,setAthletes,onBack}){
  const [view,setView]=useState("overview");
  const [selected,setSelected]=useState(null);
  const [coachTab,setCoachTab]=useState("athletes");
  function openAthlete(a){setSelected(a);setView("athlete");}
  function updateAthlete(updated){setAthletes(prev=>prev.map(a=>a.id===updated.id?updated:a));setSelected(updated);}
  if(view==="athlete"&&selected)return <MemberDashboard profile={selected} setProfile={updateAthlete} onBack={()=>setView("overview")}/>;
  const activeToday=athletes.filter(a=>a.logs.at(-1)?.date===todayStr()).length;
  const avgStreak=Math.round(athletes.reduce((s,a)=>s+a.streak,0)/athletes.length);
  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:20}}>
      <div style={{background:`linear-gradient(135deg,${C.surface},#0A0F1A)`,borderBottom:`1px solid ${C.border}`,padding:"52px 20px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div><div style={{fontSize:11,color:C.accent,fontWeight:500,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>{t("coach.portal")}</div><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:26,fontWeight:600}}>Team <span style={{color:C.accent}}>{t("coach.title")}</span></div></div>
          <button onClick={onBack} style={{background:C.card,border:`1px solid ${C.border}`,color:C.muted,borderRadius:12,padding:"8px 14px",cursor:"pointer",fontSize:13,fontFamily:"'Inter',system-ui,sans-serif"}}>{t("coach.exit")}</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[{label:t("coach.athletes"),val:athletes.length,color:C.accent,icon:"👥"},{label:t("coach.active"),val:activeToday,color:C.green,icon:"✅"},{label:t("coach.avg_streak"),val:`${avgStreak}d`,color:C.orange,icon:"🔥"},{label:t("coach.on_track"),val:athletes.filter(a=>pct(a.logs.at(-1)?.calories||0,a.dailyTargets?.calories||2000)>=70).length,color:C.blue,icon:"🎯"}].map(k=>(
            <div key={k.label} style={{background:C.card,borderRadius:16,padding:"12px 10px",textAlign:"center",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:600,color:k.color}}>{k.val}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
        {[{id:"athletes",label:t("coach.tab.athletes")},{id:"insights",label:t("coach.tab.insights")},{id:"notes",label:t("coach.tab.notes")}].map(tab=>(
          <button key={tab.id} onClick={()=>setCoachTab(tab.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"13px 4px 11px",color:coachTab===tab.id?C.accent:C.muted,borderBottom:`2px solid ${coachTab===tab.id?C.accent:"transparent"}`,fontSize:13,fontFamily:"'Inter',system-ui,sans-serif",fontWeight:500,transition:"color 0.18s"}}>{tab.label}</button>
        ))}
      </div>
      <div style={{padding:"18px"}}>
        {coachTab==="athletes"&&<div style={{animation:"slideUp 0.28s both"}}>{athletes.map((a,idx)=>{
          const ll=a.logs.at(-1),lt=ll?.date===todayStr(),wd=ll?+(ll.weight-a.weight).toFixed(1):0;
          const wkData=getWeek(a.currentWeek);
          return <div key={a.id} onClick={()=>openAthlete(a)} style={{background:C.card,borderRadius:22,padding:"16px 18px",marginBottom:12,border:`1px solid ${lt?C.accent+"44":C.border}`,cursor:"pointer",transition:"transform 0.15s",animation:`slideUp 0.35s ${idx*0.06}s both`}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            <div style={{display:"flex",alignItems:"flex-start",gap:13,marginBottom:12}}>
              <div style={{width:48,height:48,borderRadius:16,background:C.accentDim,border:`1.5px solid ${C.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{a.avatar}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontWeight:500,fontSize:15}}>{a.name}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Wk {a.currentWeek}: {wkData.theme} · {a.age}y · {(a.goal||"").replace("_"," ")}</div></div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <span style={{fontSize:11,fontWeight:500,color:lt?C.green:C.red,background:lt?C.greenDim:C.redDim,padding:"3px 9px",borderRadius:20}}>{lt?"✓ Logged":"No log"}</span>
                    <span style={{fontSize:11,color:wd<=0?C.accent:C.orange,fontWeight:500}}>{wd>0?"+":""}{wd} kg</span>
                  </div>
                </div>
              </div>
            </div>
            {ll&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:12}}>
              {[{icon:"⚖️",val:`${ll.weight}kg`,label:"weight",color:C.blue},{icon:"🔥",val:`${pct(ll.calories||0,a.dailyTargets?.calories||2000)}%`,label:"cal",color:pct(ll.calories||0,a.dailyTargets?.calories||2000)>=80?C.green:pct(ll.calories||0,a.dailyTargets?.calories||2000)>=50?C.yellow:C.red},{icon:"🥩",val:`${pct(ll.protein||0,a.dailyTargets?.protein||150)}%`,label:"prot",color:pct(ll.protein||0,a.dailyTargets?.protein||150)>=80?C.green:pct(ll.protein||0,a.dailyTargets?.protein||150)>=50?C.yellow:C.red},{icon:"👟",val:`${((ll.steps||0)/1000).toFixed(1)}k`,label:"steps",color:C.accent}].map(m=>(
                <div key={m.label} style={{background:C.surface,borderRadius:12,padding:"8px",textAlign:"center"}}><div style={{fontSize:14}}>{m.icon}</div><div style={{fontWeight:500,fontSize:13,color:m.color,marginTop:2}}>{m.val}</div><div style={{fontSize:10,color:C.muted}}>{m.label}</div></div>
              ))}
            </div>}
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{flex:1,height:4,background:C.dim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(90deg,${C.accent},#00D2FF)`,width:`${((a.currentWeek-1)/16)*100}%`,borderRadius:2}}/></div>
              <span style={{fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{a.streak}🔥</span>
            </div>
          </div>;
        })}</div>}
        {coachTab==="insights"&&<div style={{animation:"slideUp 0.28s both"}}>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:600,marginBottom:16}}>Team <span style={{color:C.accent}}>Insights</span></div>
          <div style={{background:C.card,borderRadius:22,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:500,marginBottom:14}}>Weekly Compliance</div>
            {athletes.map(a=>{
              const wl=a.logs.slice(-7);
              const ca=wl.length?Math.round(wl.reduce((s,l)=>s+(l.calories||0),0)/wl.length):0;
              const pa=wl.length?Math.round(wl.reduce((s,l)=>s+(l.protein||0),0)/wl.length):0;
              const sa=wl.length?Math.round(wl.reduce((s,l)=>s+(l.steps||0),0)/wl.length):0;
              return <div key={a.id} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:18}}>{a.avatar}</span><span style={{fontWeight:500,fontSize:14}}>{a.name}</span><span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>{wl.length}/7 days</span></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[{label:"Cal",val:ca,target:a.dailyTargets?.calories||2000,color:C.orange},{label:"Protein",val:pa,target:a.dailyTargets?.protein||150,unit:"g",color:C.purple},{label:"Steps",val:sa,target:a.dailyTargets?.steps||10000,color:C.accent}].map(m=>{const p=pct(m.val,m.target);return <div key={m.label} style={{background:C.surface,borderRadius:12,padding:"10px"}}><div style={{fontSize:10,color:C.muted,marginBottom:4}}>{m.label}</div><div style={{fontWeight:500,fontSize:14,color:p>=80?C.green:p>=50?C.yellow:C.red}}>{m.val.toLocaleString()}{m.unit||""}</div><div style={{height:3,background:C.dim,borderRadius:2,marginTop:5,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,borderRadius:2,background:p>=80?C.green:p>=50?C.yellow:C.red}}/></div></div>;})}
                </div>
              </div>;
            })}
          </div>
          <div style={{background:C.card,borderRadius:22,padding:"18px",border:`1px solid ${C.border}`}}>
            <div style={{fontWeight:500,marginBottom:14}}>🏆 Streak Leaderboard</div>
            {[...athletes].sort((a,b)=>b.streak-a.streak).map((a,i)=>(
              <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:[`${C.yellow}33`,`${C.muted}22`,`${C.orange}22`][i]||C.dim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:[C.yellow,C.muted,C.orange][i]||C.dim,flexShrink:0}}>{i+1}</div>
                <span style={{fontSize:18}}>{a.avatar}</span><span style={{flex:1,fontWeight:600}}>{a.name}</span>
                <span style={{fontSize:11,color:C.muted}}>{getWeek(a.currentWeek).theme}</span>
                <span style={{fontWeight:600,color:C.orange}}>🔥 {a.streak}d</span>
              </div>
            ))}
          </div>
        </div>}
        {coachTab==="notes"&&<div style={{animation:"slideUp 0.28s both"}}>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:600,marginBottom:16}}>Coach <span style={{color:C.accent}}>Notes</span></div>
          {athletes.map(a=>{
            const wk=getWeek(a.currentWeek);
            return <div key={a.id} style={{background:C.card,borderRadius:20,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:22}}>{a.avatar}</span><div><span style={{fontWeight:500,fontSize:15}}>{a.name}</span><div style={{fontSize:11,color:C.muted}}>Wk {a.currentWeek}: {wk.theme} · {wk.training.title}</div></div><span style={{marginLeft:"auto",fontSize:11,color:C.muted}}>Today: {wk.days[new Date().getDay()===0?6:new Date().getDay()-1]?.title}</span></div>
              <textarea value={a.notes||""} placeholder={`Notes for ${a.name.split(" ")[0]}…`} onChange={e=>setAthletes(prev=>prev.map(at=>at.id===a.id?{...at,notes:e.target.value}:at))} rows={3} style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 13px",color:C.text,fontSize:13,fontFamily:"'Inter',system-ui,sans-serif",outline:"none",resize:"vertical",lineHeight:1.65}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>;
          })}
        </div>}
      </div>
    </div>
  );
}
