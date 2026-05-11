// Landing screen — shown to unauthenticated users.
import { C } from "../theme.js";
import { Btn } from "../components/ui.jsx";

export function Splash({onStart,onCoach}){
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-100,right:-80,width:360,height:360,borderRadius:"50%",background:`radial-gradient(circle,${C.accent}14 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:120,left:-100,width:280,height:280,borderRadius:"50%",background:`radial-gradient(circle,${C.blue}14 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"64px 32px 32px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"8px 16px",marginBottom:44,width:"fit-content"}}>
          <div style={{width:26,height:26,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.text,letterSpacing:1}}>FORM16</span>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:44,fontWeight:800,lineHeight:1.1,color:C.text,marginBottom:18}}>16 weeks.<br/><span style={{color:C.accent}}>Transform</span><br/>for good.</div>
        <div style={{fontSize:15,color:C.muted,lineHeight:1.75,marginBottom:44}}>Science-backed program with daily habits, nutrition tracking, and real results.</div>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {[{icon:"📅",label:"Real daily tasks from a 16-week program"},{icon:"🍎",label:"FatSecret food diary sync"},{icon:"📊",label:"Training, nutrition & mindset per week"},{icon:"🔥",label:"Daily streaks to keep you consistent"},{icon:"👨‍💼",label:"Coach dashboard for trainers"}].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,animation:`slideUp 0.45s ${0.08+i*0.07}s both`}}>
              <div style={{width:36,height:36,borderRadius:11,background:C.card,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{f.icon}</div>
              <span style={{fontSize:13,color:C.muted}}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 32px 52px",display:"flex",flexDirection:"column",gap:10}}>
        <Btn onClick={onStart}>Start my transformation →</Btn>
        <Btn variant="outline" onClick={onCoach}>Coach / Trainer login</Btn>
        <Btn variant="ghost" onClick={onStart}>I already have an account</Btn>
      </div>
    </div>
  );
}
