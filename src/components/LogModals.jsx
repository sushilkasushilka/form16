// Bottom-sheet modals for logging a day.
// - DayDetailModal: read-only — opens a single day from the program calendar.
// - MorningLogModal: weight + (every 7 days) waist/neck/hips for BFP.
// - EveningLogModal: calories/protein/steps/greens, with fields gated by week.
// - LogModal: unified form (used by the "День замеров" deep link), supports FatSecret sync.
import { useState, useEffect } from "react";
import { C } from "../theme.js";
import { todayStr, calcBFP } from "../utils.js";
import { t } from "../i18n.js";
import { FS, getUserGlobalDay } from "../program.js";

export function DayDetailModal({ weekData, day, onClose }) {
  const col = {training:C.orange,nutrition:C.accent,mindset:C.purple,rest:C.muted,active_recovery:C.blue}[day.type]||C.accent;

  return (
    <div style={{position:"fixed",inset:0,background:"#000000EE",zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:"26px 26px 0 0",maxHeight:"92vh",display:"flex",flexDirection:"column",animation:"slideUp 0.35s cubic-bezier(.16,1,.3,1) both"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"14px auto 0",flexShrink:0}}/>

        {/* Header */}
        <div style={{padding:"16px 22px 0",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,borderRadius:15,background:`${col}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{day.icon}</div>
            <div>
              <div style={{fontSize:10,color:col,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>
                Неделя {weekData.week} · День {day.day}
              </div>
              <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:17,fontWeight:600}}>{day.title}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:C.card,border:"none",color:C.muted,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 22px 40px"}}>

          {/* Task */}
          <div style={{background:`${col}14`,border:`1px solid ${col}33`,borderRadius:16,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontSize:11,color:col,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>🎯 Задание дня</div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.7}}>{day.task}</div>
          </div>

          {/* Extended info blocks */}
          {day.info?.why&&(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",marginBottom:12}}>
              <div style={{fontSize:11,color:col,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>📖 Почему это важно</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.85,whiteSpace:"pre-line"}}>{day.info.why}</div>
            </div>
          )}

          {day.info?.howTo&&(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px 18px",marginBottom:12}}>
              <div style={{fontSize:11,color:col,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>✅ Как это делать</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.85,whiteSpace:"pre-line"}}>{day.info.howTo}</div>
            </div>
          )}

          {day.info?.weekTarget&&(
            <div style={{background:`${col}10`,border:`1px solid ${col}33`,borderRadius:16,padding:"14px 16px",marginBottom:12}}>
              <div style={{fontSize:11,color:col,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>🎯 Цель</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.8,whiteSpace:"pre-line"}}>{day.info.weekTarget}</div>
            </div>
          )}

          {/* Tip */}
          <div style={{background:C.accentDim,border:`1px solid ${C.accent}22`,borderRadius:14,padding:"12px 14px"}}>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.65}}>
              <b style={{color:C.accent}}>{day.tip.cat}:</b> {day.tip.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MorningLogModal({ profile, userGlobalDay, isMeasureOverdue, onSave, onClose }) {
  // Show measurement fields when today is a scheduled measurement day OR when
  // the user missed a previous one — in either case the data is what we need.
  const isMeasureDay = (userGlobalDay > 0 && userGlobalDay % 7 === 0) || !!isMeasureOverdue;
  const [weight, setWeight] = useState(String(profile.weight||""));
  const [waist,  setWaist]  = useState("");
  const [neck,   setNeck]   = useState("");
  const [hips,   setHips]   = useState("");

  function handleSave() {
    const log = { date:todayStr(), weight:parseFloat(weight)||profile.weight };
    if(isMeasureDay && waist && neck){
      log.waist = parseFloat(waist);
      log.neck  = parseFloat(neck);
      if(profile.gender==="female" && hips) log.hips = parseFloat(hips);
      const bfp = calcBFP({
        weight: log.weight,
        height: profile.height,
        age:    profile.age,
        waist:  log.waist,
        neck:   log.neck,
        gender: profile.gender,
        hip:    log.hips,
      });
      if(bfp!=="—") log.bfp = parseFloat(bfp);
    }
    onSave(log);
  }

  const inputStyle = {width:"100%",boxSizing:"border-box",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 16px",color:C.text,fontSize:22,fontFamily:"'Fraunces',Georgia,serif",fontWeight:600,outline:"none",textAlign:"center",marginBottom:12};

  return (
    <div style={{position:"fixed",inset:0,background:"#000000EE",zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:"26px 26px 0 0",padding:"24px 24px 40px",animation:"slideUp 0.35s cubic-bezier(.16,1,.3,1) both",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{fontSize:11,color:C.accent,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>⚖️ Утренний замер</div>
        <div style={{fontSize:18,fontWeight:600,marginBottom:20}}>{isMeasureDay?"Вес + замеры тела":"Утренний вес"}</div>

        <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Вес (кг)</div>
        <input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="0.0" style={inputStyle} autoFocus/>

        {isMeasureDay&&(
          <>
            <div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:14,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.muted,lineHeight:1.6}}>
              📏 {isMeasureOverdue
                ? "Замеры пропущены — внеси сейчас, чтобы пересчитать % жира."
                : "Раз в 7 дней замеряем тело для расчёта % жира. Используй сантиметровую ленту."}
            </div>
            <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Талия (см) — на уровне пупка</div>
            <input type="number" value={waist} onChange={e=>setWaist(e.target.value)} placeholder="0" style={{...inputStyle,fontSize:18}}/>
            <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Шея (см) — под кадыком</div>
            <input type="number" value={neck} onChange={e=>setNeck(e.target.value)} placeholder="0" style={{...inputStyle,fontSize:18}}/>
            {profile.gender==="female"&&(
              <>
                <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Бёдра (см) — в самом широком месте</div>
                <input type="number" value={hips} onChange={e=>setHips(e.target.value)} placeholder="0" style={{...inputStyle,fontSize:18}}/>
              </>
            )}
          </>
        )}

        <button onClick={handleSave} disabled={!weight} style={{width:"100%",background:weight?C.accent:C.dim,color:weight?C.bg:C.muted,border:"none",borderRadius:18,padding:"16px",fontSize:16,fontWeight:500,fontFamily:"'Inter',system-ui,sans-serif",cursor:weight?"pointer":"default"}}>
          Сохранить
        </button>
      </div>
    </div>
  );
}

export function EveningLogModal({ profile, userGlobalDay, currentWeekNum, onSave, onClose }) {
  const [calories, setCalories] = useState("");
  const [protein,  setProtein]  = useState("");
  const [steps,    setSteps]    = useState("");
  const [greens,   setGreens]   = useState(false);
  const [greensAuto, setGreensAuto] = useState(false); // true when ticked by FS keyword detection
  const [greensDetected, setGreensDetected] = useState([]); // canonical veg names FS matched

  const showProtein = currentWeekNum >= 2;
  const showSteps   = currentWeekNum >= 3;
  const showGreens  = currentWeekNum >= 4;

  // Auto-fill greens + protein/calories from FatSecret when connected (week 4+)
  useEffect(() => {
    if (!showGreens || !profile.fatsecretConnected) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await FS.fetchDiaryTotals(profile.id);
        if (cancelled || !d) return;
        if (d.calories && !calories) setCalories(String(d.calories));
        if (d.protein  && !protein)  setProtein(String(d.protein));
        if (d.greens) {
          setGreens(true);
          setGreensAuto(true);
          setGreensDetected(d.greensDetected || []);
        }
      } catch { /* sync failure is non-fatal — user can fill manually */ }
    })();
    return () => { cancelled = true; };
  }, [showGreens, profile.fatsecretConnected, profile.id]);

  function handleSave() {
    const todayExisting = profile.logs?.find(l=>l.date===todayStr())||{};
    onSave({
      ...todayExisting,
      date:     todayStr(),
      weight:   todayExisting.weight || profile.weight,
      calories: parseInt(calories)||0,
      protein:  showProtein ? parseInt(protein)||0   : todayExisting.protein,
      steps:    showSteps   ? parseInt(steps)||0     : todayExisting.steps,
      greens:   showGreens  ? greens                 : todayExisting.greens,
    });
  }

  const inputStyle = {width:"100%",boxSizing:"border-box",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:20,fontFamily:"'Fraunces',Georgia,serif",fontWeight:600,outline:"none",textAlign:"center",marginBottom:12};

  const fields=[
    {show:true,        label:"Калории (ккал)", val:calories, set:setCalories, target:profile.dailyTargets?.calories||2000, color:C.orange},
    {show:showProtein, label:"Белок (г)",       val:protein,  set:setProtein,  target:profile.dailyTargets?.protein||150,  color:C.purple},
    {show:showSteps,   label:"Шаги",            val:steps,    set:setSteps,    target:profile.dailyTargets?.steps||10000,  color:C.accent},
  ].filter(f=>f.show);

  return (
    <div style={{position:"fixed",inset:0,background:"#000000EE",zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.surface,borderRadius:"26px 26px 0 0",padding:"24px 24px 40px",animation:"slideUp 0.35s cubic-bezier(.16,1,.3,1) both",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{fontSize:11,color:C.blue,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>🌙 Вечерний итог</div>
        <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>Итог дня</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:20}}>Неделя {currentWeekNum} — заполни то, что отслеживаешь</div>

        {fields.map(f=>(
          <div key={f.label}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:12,color:C.muted}}>{f.label}</div>
              <div style={{fontSize:11,color:f.color}}>цель: {f.target.toLocaleString()}</div>
            </div>
            <input type="number" value={f.val} onChange={e=>f.set(e.target.value)} placeholder="0" style={{...inputStyle,borderColor:f.val?`${f.color}66`:C.border}}/>
          </div>
        ))}

        {showGreens&&(
          <div onClick={()=>{setGreens(v=>!v);setGreensAuto(false);}} style={{display:"flex",alignItems:"center",gap:12,background:greens?`${C.accent}14`:C.card,border:`1.5px solid ${greens?C.accent:C.border}`,borderRadius:14,padding:"14px 16px",marginBottom:12,cursor:"pointer",transition:"all 0.15s"}}>
            <div style={{width:24,height:24,borderRadius:8,background:greens?C.accent:C.dim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:greens?C.bg:"transparent",flexShrink:0}}>✓</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:13,fontWeight:600}}>🥦 Съел овощи сегодня</div>
                {greensAuto&&<span style={{fontSize:10,color:C.accent,background:C.accentDim,padding:"2px 8px",borderRadius:20,fontWeight:500}}>⚡ FatSecret</span>}
              </div>
              <div style={{fontSize:11,color:C.muted}}>
                {greensAuto && greensDetected.length>0
                  ? `Найдено по дневнику: ${greensDetected.slice(0,3).join(", ")}${greensDetected.length>3?` +${greensDetected.length-3}`:""}`
                  : "Минимум 2 порции разных овощей"}
              </div>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={!calories} style={{width:"100%",background:calories?C.blue:C.dim,color:calories?C.bg:C.muted,border:"none",borderRadius:18,padding:"16px",fontSize:16,fontWeight:500,fontFamily:"'Inter',system-ui,sans-serif",cursor:calories?"pointer":"default"}}>
          Сохранить итог дня
        </button>
      </div>
    </div>
  );
}

export function LogModal({profile,onSave,onClose}){
  const [vals,setVals]=useState({weight:"",calories:"",protein:"",steps:"",waist:"",neck:"",hips:""});
  const [fsSyncing,setFsSyncing]=useState(false);
  const [fsSynced,setFsSynced]=useState(false);
  const set=(k,v)=>setVals(p=>({...p,[k]:v}));

  // Is today a measurement day? Day 8 (start of week 2) then every 7 days
  const userGlobalDay = getUserGlobalDay(profile);
  const isMeasureDay = userGlobalDay >= 8 && (userGlobalDay - 8) % 7 === 0;
  const isMeasureReminder = userGlobalDay >= 7 && (userGlobalDay - 7) % 7 === 0 && !isMeasureDay;
  useEffect(()=>{
    if(profile.fsSyncData&&profile.fsSyncedAt){
      const sd=new Date(profile.fsSyncedAt).toISOString().split("T")[0];
      if(sd===todayStr()){setVals(p=>({...p,calories:String(profile.fsSyncData.calories),protein:String(profile.fsSyncData.protein)}));setFsSynced(true);}
    }
  },[]);
  async function syncFS(){
    setFsSyncing(true);
    try{
      const d = await FS.fetchDiaryTotals(profile.id);
      if(d){ setVals(p=>({...p,calories:String(d.calories),protein:String(d.protein)})); setFsSynced(true); }
    }catch(e){ console.error("FS sync error",e); }
    setFsSyncing(false);
  }
  function handleSave(){
    const log = {
      date:todayStr(),
      fromFatSecret:fsSynced,
      weight:parseFloat(vals.weight)||profile.weight,
      calories:parseInt(vals.calories)||0,
      protein:parseInt(vals.protein)||0,
      steps:parseInt(vals.steps)||0,
      waist:vals.waist?parseFloat(vals.waist):undefined,
      neck:vals.neck?parseFloat(vals.neck):undefined,
      hips:vals.hips?parseFloat(vals.hips):undefined,
    };
    // Recalculate BFP if measurements provided
    if(log.waist&&log.neck&&profile.height){
      const bfp = calcBFP({
        weight: log.weight,
        height: profile.height,
        age:    profile.age,
        waist:  log.waist,
        neck:   log.neck,
        gender: profile.gender,
        hip:    log.hips,
      });
      if(bfp!=="—") log.bfp = parseFloat(bfp);
    }
    onSave(log);
    onClose();
  }
  const fields=[{key:"weight",label:t("log.weight"),unit:t("unit.kg"),icon:"⚖️",ph:t("log.weight.ph"),color:C.blue},{key:"calories",label:t("log.calories"),unit:t("unit.kcal"),icon:"🔥",ph:t("log.calories.ph"),color:C.orange},{key:"protein",label:t("log.protein"),unit:t("unit.g"),icon:"🥩",ph:t("log.protein.ph"),color:C.purple},{key:"steps",label:t("log.steps"),unit:t("unit.steps"),icon:"👟",ph:t("log.steps.ph"),color:C.accent}];
  return (
    <div style={{position:"fixed",inset:0,background:"#000000CC",zIndex:500,display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",background:C.surface,borderRadius:"26px 26px 0 0",padding:"22px 22px 48px",maxHeight:"90vh",overflowY:"auto",animation:"slideUp 0.35s cubic-bezier(.16,1,.3,1) both"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:22,fontWeight:600}}>{t("log.title")}</div>
          {profile.fatsecretConnected&&<button onClick={syncFS} disabled={fsSyncing} style={{background:fsSynced?C.accentDim:C.accent,color:fsSynced?C.accent:C.bg,border:fsSynced?`1px solid ${C.accent}44`:"none",borderRadius:20,padding:"8px 16px",fontSize:12,fontWeight:500,fontFamily:"'Inter',system-ui,sans-serif",cursor:"pointer"}}>{fsSyncing?t("log.syncing"):fsSynced?t("log.synced"):t("log.sync")}</button>}
        </div>
        {fsSynced&&<div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:12,padding:"9px 14px",marginBottom:16,fontSize:12,color:C.accent}}>{t("log.synced.note")}</div>}

        {/* Measurement reminder banner */}
        {isMeasureReminder&&<div style={{background:C.yellowDim,border:`1px solid ${C.yellow}44`,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.muted,lineHeight:1.6}}>
          📏 <b style={{color:C.yellow}}>Завтра день замеров!</b> Подготовьте сантиметровую ленту — завтра нужно измерить талию, шею и бёдра.
        </div>}

        {fields.map(field=>(
          <div key={field.key} style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:0.9,marginBottom:7,display:"flex",gap:6,alignItems:"center"}}><span>{field.icon}</span>{field.label}</div>
            <div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:13,border:`1.5px solid ${C.border}`,overflow:"hidden",transition:"border-color 0.2s"}} onFocusCapture={e=>e.currentTarget.style.borderColor=field.color} onBlurCapture={e=>e.currentTarget.style.borderColor=C.border}>
              <input type="number" value={vals[field.key]} placeholder={field.ph} onChange={e=>set(field.key,e.target.value)} style={{flex:1,background:"none",border:"none",outline:"none",padding:"13px 15px",color:C.text,fontSize:16,fontFamily:"'Inter',system-ui,sans-serif"}}/>
              <span style={{padding:"0 13px 0 0",color:C.muted,fontSize:12,fontWeight:600}}>{field.unit}</span>
            </div>
          </div>
        ))}

        {/* Measurement fields — shown on measurement days */}
        {isMeasureDay&&(
          <div style={{background:C.purpleDim,border:`1px solid ${C.purple}33`,borderRadius:16,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:12,color:C.purple,fontWeight:500,marginBottom:12}}>📏 День замеров — внесите обмеры тела</div>
            {[{key:"waist",label:t("measure.waist"),ph:t("measure.waist.ph")},{key:"neck",label:t("measure.neck"),ph:t("measure.neck.ph")},{key:"hips",label:"Бёдра",ph:"напр. 96"}].map(mf=>(
              <div key={mf.key} style={{marginBottom:10}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:0.9,marginBottom:6}}>{mf.label}</div>
                <div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:12,border:`1.5px solid ${C.border}`,overflow:"hidden"}} onFocusCapture={e=>e.currentTarget.style.borderColor=C.purple} onBlurCapture={e=>e.currentTarget.style.borderColor=C.border}>
                  <input type="number" value={vals[mf.key]} placeholder={mf.ph} onChange={e=>set(mf.key,e.target.value)} step="0.5" style={{flex:1,background:"none",border:"none",outline:"none",padding:"11px 14px",color:C.text,fontSize:15,fontFamily:"'Inter',system-ui,sans-serif"}}/>
                  <span style={{padding:"0 12px 0 0",color:C.muted,fontSize:12,fontWeight:600}}>см</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSave} style={{width:"100%",background:C.accent,color:C.bg,border:"none",borderRadius:15,padding:"15px",fontSize:15,fontWeight:500,fontFamily:"'Inter',system-ui,sans-serif",cursor:"pointer",marginTop:10}}>{t("log.save")}</button>
      </div>
    </div>
  );
}
