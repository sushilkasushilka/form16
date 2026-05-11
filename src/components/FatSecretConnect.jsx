// FatSecret OOB (PIN) OAuth flow — opens FatSecret in a new tab, asks the
// user to paste the 6-digit PIN, then exchanges it for a permanent token via
// /api/fs-verify-pin. See README for the full flow.
import { useState } from "react";
import { C } from "../theme.js";

export function FatSecretConnect({ profile, setProfile, userId }) {
  const [step, setStep] = useState("idle"); // idle | loading | pin | success | error
  const [fsToken, setFsToken] = useState(null);
  const [fsTokenSecret, setFsTokenSecret] = useState(null);
  const [authorizeUrl, setAuthorizeUrl] = useState(null);
  const [pin, setPin] = useState("");
  const [errMsg, setErrMsg] = useState("");

  async function startConnect() {
    setStep("loading");
    try {
      const res = await fetch(`/api/fs-request-token?userId=${userId}`);
      const data = await res.json();
      if (!data.oauth_token) { setErrMsg(data.error||"Ошибка"); setStep("error"); return; }
      setFsToken(data.oauth_token);
      setFsTokenSecret(data.oauth_token_secret);
      setAuthorizeUrl(data.authorize_url);
      setStep("pin");
      // Open FatSecret auth page in new tab
      window.open(data.authorize_url, "_blank");
    } catch(e) { setErrMsg(e.message); setStep("error"); }
  }

  async function verifyPin() {
    if (!pin.trim()) return;
    setStep("loading");
    try {
      const res = await fetch("/api/fs-verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, oauth_token: fsToken, oauth_token_secret: fsTokenSecret, pin }),
      });
      const data = await res.json();
      if (!data.ok) { setErrMsg(data.error||"Неверный PIN"); setStep("pin"); return; }
      setProfile(p => ({ ...p, fatsecretConnected: true }));
      setStep("success");
    } catch(e) { setErrMsg(e.message); setStep("pin"); }
  }

  if (profile.fatsecretConnected) {
    return (
      <div style={{background:C.accentDim,border:`1px solid ${C.accent}55`,borderRadius:20,padding:"14px 18px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:11,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🥗</div>
          <div><div style={{fontWeight:500,fontSize:13}}>FatSecret</div><div style={{fontSize:11,color:C.accent}}>Подключён — синхронизация активна</div></div>
        </div>
        <span style={{fontSize:12,color:C.accent,fontWeight:500}}>✓</span>
      </div>
    );
  }

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"16px 18px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:36,height:36,borderRadius:11,background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🥗</div>
        <div><div style={{fontWeight:500,fontSize:13}}>FatSecret</div><div style={{fontSize:11,color:C.muted}}>Дневник питания · 2.3 млн российских продуктов</div></div>
      </div>

      {step==="idle"&&(
        <>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.7,marginBottom:12}}>
            Логируй еду в приложении FatSecret и синхронизируй с FORM16 одним нажатием.
          </div>
          <button onClick={startConnect} style={{width:"100%",background:C.accent,color:C.bg,border:"none",borderRadius:14,padding:"11px",fontSize:13,fontWeight:500,fontFamily:"'Inter',system-ui,sans-serif",cursor:"pointer"}}>
            Подключить FatSecret →
          </button>
        </>
      )}

      {step==="loading"&&(
        <div style={{textAlign:"center",padding:"12px 0",fontSize:13,color:C.muted}}>Подключаемся…</div>
      )}

      {step==="pin"&&(
        <>
          <div style={{background:C.surface,borderRadius:14,padding:"12px 14px",marginBottom:12,fontSize:12,color:C.muted,lineHeight:1.7}}>
            <b style={{color:C.text}}>Шаг 1.</b> В открывшейся вкладке войди в FatSecret и нажми «Разрешить»<br/>
            <b style={{color:C.text}}>Шаг 2.</b> FatSecret покажет PIN-код — введи его ниже<br/>
            <button onClick={()=>window.open(authorizeUrl,"_blank")} style={{marginTop:8,background:"none",border:`1px solid ${C.accent}`,borderRadius:10,padding:"5px 12px",fontSize:11,color:C.accent,cursor:"pointer",fontFamily:"'Inter',system-ui,sans-serif"}}>
              Открыть FatSecret снова →
            </button>
          </div>
          <input
            value={pin} onChange={e=>setPin(e.target.value)}
            placeholder="Введи PIN-код из FatSecret"
            style={{width:"100%",boxSizing:"border-box",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 14px",color:C.text,fontSize:15,fontFamily:"'Inter',system-ui,sans-serif",outline:"none",marginBottom:10,textAlign:"center",letterSpacing:4}}
          />
          {errMsg&&<div style={{fontSize:12,color:C.red,marginBottom:8}}>{errMsg}</div>}
          <button onClick={verifyPin} disabled={!pin.trim()} style={{width:"100%",background:pin.trim()?C.accent:C.dim,color:pin.trim()?C.bg:C.muted,border:"none",borderRadius:14,padding:"11px",fontSize:13,fontWeight:500,fontFamily:"'Inter',system-ui,sans-serif",cursor:pin.trim()?"pointer":"default"}}>
            Подтвердить
          </button>
        </>
      )}

      {step==="success"&&(
        <div style={{textAlign:"center",padding:"12px 0"}}>
          <div style={{fontSize:32,marginBottom:8}}>✅</div>
          <div style={{fontSize:14,fontWeight:500,color:C.accent}}>FatSecret подключён!</div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>Теперь можно синхронизировать питание</div>
        </div>
      )}

      {step==="error"&&(
        <div>
          <div style={{fontSize:12,color:C.red,marginBottom:10}}>{errMsg}</div>
          <button onClick={()=>setStep("idle")} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 16px",fontSize:12,color:C.muted,cursor:"pointer",fontFamily:"'Inter',system-ui,sans-serif"}}>Попробовать снова</button>
        </div>
      )}
    </div>
  );
}
