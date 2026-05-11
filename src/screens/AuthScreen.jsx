// Login / signup screen — wraps Supabase email auth.
import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, F, BRAND } from "../theme.js";
import { t } from "../i18n.js";

export function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState("");

  async function handleEmail() {
    if (!email || !password) { setError(t("auth.fill_fields")); return; }
    setLoading(true); setError(""); setMessage("");
    if (mode === "signup") {
      const { error: e } = await supabase.auth.signUp({ email, password });
      if (e) setError(e.message);
      else setMessage(t("auth.check_email"));
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) setError(e.message);
    }
    setLoading(false);
  }

  const inputStyle = (name) => ({
    width:"100%", background:C.surface, border:`1.5px solid ${focused===name?C.accent:C.border}`,
    borderRadius:12, padding:"14px 16px", color:C.text, fontSize:15,
    fontFamily:F.sans, outline:"none", marginBottom:10,
  });

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"32px 28px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:28}}>
          <div style={{width:32,height:32,borderRadius:8,background:C.text,color:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.serif,fontWeight:600,fontSize:18,letterSpacing:"-0.02em"}}>S</div>
          <div style={{textAlign:"left"}}>
            <div style={{fontFamily:F.serif,fontSize:17,fontWeight:500,color:C.text,letterSpacing:"-0.015em",lineHeight:1}}>{BRAND.name}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:3}}>{BRAND.tagline}</div>
          </div>
        </div>
        <div style={{fontFamily:F.serif,fontSize:30,fontWeight:400,color:C.text,marginBottom:8,letterSpacing:"-0.02em",lineHeight:1.15}}>
          {mode==="login"?t("auth.welcome_back"):t("auth.create_account")}
        </div>
        <div style={{fontSize:14,color:C.muted}}>
          {mode==="login"?t("auth.signin_subtitle"):t("auth.signup_subtitle")}
        </div>
      </div>

      <input type="email" placeholder={t("auth.email")} value={email} onChange={e=>setEmail(e.target.value)}
        style={inputStyle("email")} onFocus={()=>setFocused("email")} onBlur={()=>setFocused("")}
      />
      <input type="password" placeholder={t("auth.password")} value={password} onChange={e=>setPassword(e.target.value)}
        style={inputStyle("password")} onFocus={()=>setFocused("password")} onBlur={()=>setFocused("")}
        onKeyDown={e=>e.key==="Enter"&&handleEmail()}
      />

      {error && <div style={{fontSize:13,color:C.red,marginBottom:12,background:C.redDim,borderRadius:10,padding:"10px 12px"}}>{error}</div>}
      {message && <div style={{fontSize:13,color:C.accent,marginBottom:12,background:C.accentDim,borderRadius:10,padding:"10px 12px"}}>{message}</div>}

      <button onClick={handleEmail} disabled={loading} style={{width:"100%",background:loading?C.dim:C.text,color:loading?C.muted:C.bg,border:"none",borderRadius:14,padding:"15px",fontSize:15,fontWeight:600,fontFamily:F.sans,cursor:loading?"default":"pointer",marginBottom:18,marginTop:6,letterSpacing:"0.01em"}}>
        {loading?t("auth.loading"):mode==="login"?t("auth.signin_btn"):t("auth.signup_btn")}
      </button>

      <div style={{textAlign:"center",fontSize:14,color:C.muted}}>
        {mode==="login"?t("auth.no_account"):t("auth.has_account")}
        <span onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("");}} style={{color:C.accent,cursor:"pointer",fontWeight:600,marginLeft:4}}>
          {mode==="login"?t("auth.signup_link"):t("auth.signin_link")}
        </span>
      </div>
    </div>
  );
}
