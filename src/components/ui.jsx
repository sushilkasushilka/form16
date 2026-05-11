// Shared UI primitives: form inputs, selectors, charts, and the generic Btn.
// Imported by every screen and modal in the app.
import { useState } from "react";
import { C } from "../theme.js";
import { fmtDate, pct } from "../utils.js";

export function ProgressDots({total,current}){
  return <div style={{display:"flex",gap:6,justifyContent:"center"}}>{Array.from({length:total},(_,i)=><div key={i} style={{height:4,width:i===current?28:8,borderRadius:2,background:i===current?C.accent:i<current?C.accent+"55":C.dim,transition:"all 0.35s cubic-bezier(.16,1,.3,1)"}}/>)}</div>;
}

export function TextInput({label,value,onChange,type="text",placeholder}){
  const [f,sf]=useState(false);
  return <div style={{marginBottom:18}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>{label}</div>}<div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:14,border:`1.5px solid ${f?C.accent:C.border}`,transition:"border-color 0.2s",overflow:"hidden"}}><input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{flex:1,background:"none",border:"none",outline:"none",padding:"14px 16px",color:C.text,fontSize:15,fontFamily:"'DM Sans',sans-serif"}}/></div></div>;
}

export function NumberInput({label,value,onChange,unit,placeholder,hint,step="0.1"}){
  const [f,sf]=useState(false);
  return <div style={{marginBottom:18}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>{label}</div>}<div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:14,border:`1.5px solid ${f?C.accent:C.border}`,transition:"border-color 0.2s",overflow:"hidden"}}><input type="number" value={value} placeholder={placeholder} step={step} onChange={e=>onChange(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{flex:1,background:"none",border:"none",outline:"none",padding:"14px 16px",color:C.text,fontSize:16,fontFamily:"'DM Sans',sans-serif"}}/>{unit&&<div style={{padding:"0 14px 0 0",color:C.muted,fontSize:13,fontWeight:600,flexShrink:0}}>{unit}</div>}</div>{hint&&<div style={{fontSize:12,color:C.muted,marginTop:6,paddingLeft:2}}>{hint}</div>}</div>;
}

export function PillSelect({label,value,onChange,options}){
  return <div style={{marginBottom:20}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>{label}</div>}<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{options.map(o=><div key={o.value} onClick={()=>onChange(o.value)} style={{padding:"10px 16px",borderRadius:22,cursor:"pointer",background:value===o.value?C.accent:C.card,border:`1.5px solid ${value===o.value?C.accent:C.border}`,color:value===o.value?C.bg:C.muted,fontSize:13,fontWeight:600,transition:"all 0.15s"}}>{o.label}</div>)}</div></div>;
}

export function CardSelect({label,value,onChange,options}){
  return <div style={{marginBottom:22}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>{label}</div>}<div style={{display:"flex",flexDirection:"column",gap:10}}>{options.map(o=>{const sel=value===o.value;return <div key={o.value} onClick={()=>onChange(o.value)} style={{background:sel?C.accentDim:C.card,border:`1.5px solid ${sel?C.accent:C.border}`,borderRadius:18,padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:14,transition:"all 0.18s"}}><div style={{width:42,height:42,borderRadius:13,flexShrink:0,background:sel?C.accent+"33":C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{o.icon}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:sel?C.accent:C.text,marginBottom:3}}>{o.label}</div>{o.desc&&<div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>{o.desc}</div>}</div>{sel&&<div style={{width:22,height:22,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><span style={{fontSize:12,color:C.bg,fontWeight:800}}>✓</span></div>}</div>;})}</div></div>;
}

export function ScaleSelect({label,value,onChange,icons,low,high}){
  return <div style={{marginBottom:22}}>{label&&<div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:12}}>{label}</div>}<div style={{display:"flex",gap:8}}>{icons.map((ic,i)=>{const v=i+1,sel=value===v;return <div key={v} onClick={()=>onChange(v)} style={{flex:1,background:sel?C.accentDim:C.card,border:`1.5px solid ${sel?C.accent:C.border}`,borderRadius:16,padding:"12px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.15s"}}><span style={{fontSize:22}}>{ic}</span>{sel&&<div style={{width:6,height:6,borderRadius:"50%",background:C.accent}}/>}</div>})}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:11,color:C.muted}}>{low}</span><span style={{fontSize:11,color:C.muted}}>{high}</span></div></div>;
}

export function MetricBar({label,value,target,unit,color,icon}){
  const p=pct(value,target);
  return <div style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:C.muted,display:"flex",gap:5,alignItems:"center"}}><span>{icon}</span>{label}</span><span style={{fontSize:13,fontWeight:700,color:p>=100?color:C.text}}>{value??'—'} <span style={{color:C.muted,fontWeight:400}}>/ {target} {unit}</span></span></div><div style={{height:5,borderRadius:3,background:C.dim,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,borderRadius:3,background:`${color}CC`,transition:"width 0.9s cubic-bezier(.16,1,.3,1)"}}/></div></div>;
}

export function WeightChart({logs,compact}){
  if(!logs||logs.length<2)return <div style={{textAlign:"center",padding:"18px 0",color:C.muted,fontSize:13}}>Log more days to see your trend</div>;
  const weights=logs.map(l=>l.weight);
  const mn=Math.min(...weights)-0.8,mx=Math.max(...weights)+0.8;
  const H=compact?80:110,W=340;
  const px=i=>(i/(weights.length-1))*(W-24)+12;
  const py=v=>H-14-((v-mn)/(mx-mn))*(H-28);
  const pts=weights.map((w,i)=>`${px(i)},${py(w)}`).join(" ");
  const area=`M${px(0)},${py(weights[0])} `+weights.map((w,i)=>`L${px(i)},${py(w)}`).join(" ")+` L${px(weights.length-1)},${H} L${px(0)},${H} Z`;
  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity="0.2"/><stop offset="100%" stopColor={C.accent} stopOpacity="0"/></linearGradient></defs><path d={area} fill="url(#wg)"/><polyline points={pts} fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/><circle cx={px(weights.length-1)} cy={py(weights.at(-1))} r={5} fill={C.accent}/>{!compact&&<><text x={12} y={H+12} fontSize={10} fill={C.muted}>{fmtDate(logs[0].date)}</text><text x={W-12} y={H+12} fontSize={10} fill={C.muted} textAnchor="end">{fmtDate(logs.at(-1).date)}</text></>}</svg>;
}

export function Btn({children,onClick,variant="primary",disabled,small}){
  return <button onClick={onClick} disabled={disabled} style={{width:small?"auto":"100%",border:"none",borderRadius:small?20:16,padding:small?"9px 18px":"16px 24px",fontSize:small?13:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:disabled?"default":"pointer",background:variant==="primary"?(disabled?C.dim:C.accent):variant==="ghost"?"transparent":variant==="danger"?C.red:C.card,color:variant==="primary"?(disabled?C.muted:C.bg):variant==="danger"?"#fff":variant==="ghost"?C.muted:C.text,border:variant==="outline"?`1.5px solid ${C.border}`:"none",opacity:disabled?0.55:1,transition:"all 0.15s"}}>{children}</button>;
}
