// Multi-step onboarding form (4 steps) — collects profile data,
// computes BMI/TDEE, then calls onComplete with the new profile object.
import { useState } from "react";
import { C } from "../theme.js";
import { todayStr, calcBMI, calcTDEE } from "../utils.js";
import { t } from "../i18n.js";
import { ProgressDots, TextInput, NumberInput, PillSelect, CardSelect, ScaleSelect, Btn } from "../components/ui.jsx";
import { Avatar, AVATAR_OPTIONS } from "../components/icons.jsx";

const STEP_META=[
  {title:()=>t("step.1.title"),sub:()=>"1 / 4"},
  {title:()=>t("step.3.title"),sub:()=>"2 / 4"},
  {title:()=>t("step.5.title"),sub:()=>"3 / 4"},
  {title:()=>t("step.6.title"),sub:()=>"4 / 4"},
];
const AVATARS = AVATAR_OPTIONS;

export function SignUpV1({onComplete,onBack}){
  const [step,setStep]=useState(0);
  const [f,setF]=useState({avatar:"fox",name:"",email:"",password:"",gender:"male",age:"",height:"",weight:"",goal:"fat_loss",stress:3,sleep:3,dietQuality:3,training:"none",trainingExp:"",activity:"moderate"});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const wNum=parseFloat(f.weight),hNum=parseFloat(f.height);
  const bmi=wNum&&hNum?calcBMI(wNum,hNum):null;
  const tdee=calcTDEE(wNum,hNum,parseFloat(f.age),f.gender,f.activity);
  const needsExp=f.training==="1_2x_week"||f.training==="3plus_week";
  // canNext per step: 0=profile+body, 1=goal, 2=lifestyle, 3=activity
  const canNext=[
    f.name.trim()&&f.age&&f.height&&f.weight,
    !!f.goal,
    f.stress&&f.sleep&&f.dietQuality&&f.training&&(!needsExp||f.trainingExp),
    f.activity,
  ][step];
  function next(){step<3?setStep(s=>s+1):finish();}
  function back(){step>0?setStep(s=>s-1):onBack();}
  function finish(){
    onComplete({id:"u_"+Date.now(),...f,age:parseFloat(f.age),height:parseFloat(f.height),weight:parseFloat(f.weight),waist:null,neck:null,thigh:null,targetWeight:null,bmi:bmi?parseFloat(bmi):null,bfp:null,tdee,currentWeek:1,streak:0,totalXP:0,fatsecretConnected:false,joinedAt:todayStr(),notes:"",logs:[],foodLog:[],dailyTargets:{calories:f.goal==="fat_loss"?tdee-400:tdee,protein:Math.round(parseFloat(f.weight||80)*1.8),steps:10000}});
  }
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"52px 22px 16px",display:"flex",alignItems:"center",gap:14}}>
        <button onClick={back} style={{width:40,height:40,borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>←</button>
        <div style={{flex:1}}><ProgressDots total={4} current={step}/></div>
      </div>
      <div style={{padding:"0 22px 6px"}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:500,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>{STEP_META[step].sub()}</div>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:26,fontWeight:600,color:C.text,lineHeight:1.2}}>{STEP_META[step].title()}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 22px 0"}}>
        {/* Step 0: Avatar + Name + Gender + Age + Height + Weight */}
        {step===0&&<div style={{animation:"slideUp 0.3s both"}}>
          <div style={{display:"flex",gap:9,flexWrap:"wrap",marginBottom:22}}>{AVATARS.map(a=><button key={a} type="button" onClick={()=>set("avatar",a)} style={{width:50,height:50,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:f.avatar===a?C.accentDim:C.surface,border:`1.5px solid ${f.avatar===a?C.accent:C.border}`,color:f.avatar===a?C.accent:C.text,cursor:"pointer",transition:"all 0.15s",padding:0}}><Avatar value={a} size={28} strokeWidth={f.avatar===a?1.75:1.5} /></button>)}</div>
          <TextInput label={t("field.name")} value={f.name} onChange={v=>set("name",v)} placeholder={t("field.name.ph")}/>
          <PillSelect label={t("field.gender")} value={f.gender} onChange={v=>set("gender",v)} options={[{value:"male",label:t("field.gender.male")},{value:"female",label:t("field.gender.female")}]}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <NumberInput label={t("field.age")} value={f.age} onChange={v=>set("age",v)} unit={t("field.age.unit")} placeholder={t("field.age.ph")} step="1"/>
            <NumberInput label={t("field.height")} value={f.height} onChange={v=>set("height",v)} unit="cm" placeholder={t("field.height.ph")} step="1"/>
          </div>
          <NumberInput label={t("field.weight")} value={f.weight} onChange={v=>set("weight",v)} unit="kg" placeholder={t("field.weight.ph")}/>
          {bmi&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"14px 18px",display:"flex",gap:28,marginTop:4}}><div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>BMI</div><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:22,fontWeight:600,color:C.accent}}>{bmi}</div><div style={{fontSize:11,color:C.muted}}>{+bmi<18.5?t("bmi.underweight"):+bmi<25?t("bmi.normal"):+bmi<30?t("bmi.overweight"):t("bmi.obese")}</div></div>{tdee>0&&<div><div style={{fontSize:11,color:C.muted,marginBottom:4}}>TDEE</div><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:22,fontWeight:600,color:C.blue}}>{tdee}</div><div style={{fontSize:11,color:C.muted}}>{t("stats.tdee")}</div></div>}</div>}
        </div>}
        {/* Step 1: Goal */}
        {step===1&&<div style={{animation:"slideUp 0.3s both"}}>
          <CardSelect label={t("goal.label")} value={f.goal} onChange={v=>set("goal",v)} options={[{value:"fat_loss",icon:"🔥",label:t("goal.fat_loss"),desc:t("goal.fat_loss.desc")},{value:"recomp",icon:"⚖️",label:t("goal.recomp"),desc:t("goal.recomp.desc")},{value:"health",icon:"💚",label:t("goal.health"),desc:t("goal.health.desc")}]}/>
        </div>}
        {/* Step 2: Lifestyle */}
        {step===2&&<div style={{animation:"slideUp 0.3s both"}}>
          <ScaleSelect label={t("lifestyle.stress")} value={f.stress} onChange={v=>set("stress",v)} icons={["😌","🙂","😐","😤","😰"]} low={t("lifestyle.stress.low")} high={t("lifestyle.stress.high")}/>
          <ScaleSelect label={t("lifestyle.sleep")} value={f.sleep} onChange={v=>set("sleep",v)} icons={["😴","🛌","😑","😟","😵"]} low={t("lifestyle.sleep.low")} high={t("lifestyle.sleep.high")}/>
          <ScaleSelect label={t("lifestyle.diet")} value={f.dietQuality} onChange={v=>set("dietQuality",v)} icons={["🥗","🍱","🍜","🍔","🍕"]} low={t("lifestyle.diet.low")} high={t("lifestyle.diet.high")}/>
          <CardSelect label={t("lifestyle.training")} value={f.training} onChange={v=>{set("training",v);set("trainingExp","");}} options={[{value:"none",icon:"🛋️",label:t("training.none"),desc:t("training.none.desc")},{value:"1_2x_week",icon:"🏃",label:t("training.1_2x"),desc:t("training.1_2x.desc")},{value:"3plus_week",icon:"💪",label:t("training.3plus"),desc:t("training.3plus.desc")}]}/>
          {needsExp&&<div style={{animation:"slideUp 0.25s both"}}><CardSelect label={t("experience.label")} value={f.trainingExp} onChange={v=>set("trainingExp",v)} options={[{value:"beginner",icon:"🌱",label:t("experience.beginner"),desc:t("experience.beginner.desc")},{value:"intermediate",icon:"📈",label:t("experience.intermediate"),desc:t("experience.intermediate.desc")},{value:"advanced",icon:"⚡",label:t("experience.advanced"),desc:t("experience.advanced.desc")}]}/></div>}
        </div>}
        {/* Step 3: Activity level */}
        {step===3&&<div style={{animation:"slideUp 0.3s both"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 16px",marginBottom:22,fontSize:13,color:C.muted,lineHeight:1.65}}>ℹ️ {t("activity.note")}</div>
          <CardSelect value={f.activity} onChange={v=>set("activity",v)} options={[{value:"sedentary",icon:"🛋️",label:t("activity.sedentary"),desc:t("activity.sedentary.desc")},{value:"light",icon:"🚶",label:t("activity.light"),desc:t("activity.light.desc")},{value:"moderate",icon:"🚴",label:t("activity.moderate"),desc:t("activity.moderate.desc")},{value:"active",icon:"⚡",label:t("activity.active"),desc:t("activity.active.desc")},{value:"veryActive",icon:"🏔️",label:t("activity.veryActive"),desc:t("activity.veryActive.desc")}]}/>
        </div>}
      </div>
      <div style={{padding:"18px 22px 48px"}}><Btn onClick={next} disabled={!canNext}>{step===3?t("onboarding.finish"):t("onboarding.continue")}</Btn></div>
    </div>
  );
}
