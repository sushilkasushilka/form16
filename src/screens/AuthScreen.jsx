// Login / signup screen — wraps Supabase email auth.
import { useState } from "react";
import { supabase } from "../supabase.js";
import { C } from "../theme.js";
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
    width:"100%", background:C.card, border:`1.5px solid ${focused===name?C.accent:C.border}`,
    borderRadius:14, padding:"14px 16px", color:C.text, fontSize:15,
    fontFamily:"'DM Sans',sans-serif", outline:"none", marginBottom:12,
  });

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"32px 28px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"8px 16px",marginBottom:24}}>
          <div style={{width:26,height:26,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.text,letterSpacing:1}}>FORM16</span>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.text,marginBottom:8}}>
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

      {error && <div style={{fontSize:13,color:C.red,marginBottom:12,background:C.redDim,borderRadius:10,padding:"8px 12px"}}>{error}</div>}
      {message && <div style={{fontSize:13,color:C.accent,marginBottom:12,background:C.accentDim,borderRadius:10,padding:"8px 12px"}}>{message}</div>}

      <button onClick={handleEmail} disabled={loading} style={{width:"100%",background:loading?C.dim:C.accent,color:loading?C.muted:C.bg,border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:loading?"default":"pointer",marginBottom:16}}>
        {loading?t("auth.loading"):mode==="login"?t("auth.signin_btn"):t("auth.signup_btn")}
      </button>

      <div style={{textAlign:"center",fontSize:14,color:C.muted}}>
        {mode==="login"?t("auth.no_account"):t("auth.has_account")}
        <span onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("");}} style={{color:C.accent,cursor:"pointer",fontWeight:700}}>
          {mode==="login"?t("auth.signup_link"):t("auth.signin_link")}
        </span>
      </div>
    </div>
  );
}
