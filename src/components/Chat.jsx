// AI coach chat — InlineChatBar (preview on the today tab) and ChatModal
// (full-screen conversation). Both call /api/chat. The full modal handles
// the daily-message paywall (Week 3+ for free users).
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C } from "../theme.js";
import { getUserGlobalDay } from "../program.js";

export function InlineChatBar({ profile, onOpen }) {
  const [lastMsg, setLastMsg] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(()=>{
    supabase.from("messages").select("*").eq("user_id",profile.id)
      .order("created_at",{ascending:false}).limit(1)
      .then(({data})=>{ if(data?.[0]) setLastMsg(data[0]); });
  },[]);

  async function quickSend(){
    if(!chatInput.trim()||chatLoading) return;
    const text=chatInput.trim();
    setChatInput(""); setChatLoading(true);
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:profile.id,message:text})});
      const data=await res.json();
      if(data.reply) setLastMsg({role:"assistant",content:data.reply,created_at:new Date().toISOString()});
      if(data.error==="limit_reached") onOpen();
    }catch{}
    setChatLoading(false);
  }

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,marginBottom:14,overflow:"hidden"}}>
      <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🏋️</div>
          <div><div style={{fontSize:12,fontWeight:700}}>Персональный тренер</div><div style={{fontSize:10,color:C.accent}}>ИИ · отвечает мгновенно</div></div>
        </div>
        <button onClick={onOpen} style={{fontSize:11,color:C.accent,background:C.accentDim,border:"none",borderRadius:14,padding:"4px 10px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>Открыть →</button>
      </div>
      {lastMsg&&(
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{lastMsg.role==="assistant"?"🏋️ Тренер":"👤 Ты"}</div>
          <div style={{fontSize:12,color:C.text,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lastMsg.content}</div>
        </div>
      )}
      <div style={{padding:"10px 12px",display:"flex",gap:8,alignItems:"center"}}>
        <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();quickSend();}}} placeholder="Спроси тренера…" style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        <button onClick={quickSend} disabled={!chatInput.trim()||chatLoading} style={{width:34,height:34,borderRadius:"50%",background:chatInput.trim()&&!chatLoading?C.accent:C.dim,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.bg,flexShrink:0}}>↑</button>
      </div>
    </div>
  );
}

export function ChatModal({ profile, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const bottomRef = useRef(null);
  const userGlobalDay = getUserGlobalDay(profile);
  const isWeek3Plus = userGlobalDay >= 14;

  useEffect(()=>{
    supabase.from("messages")
      .select("*").eq("user_id",profile.id)
      .order("created_at",{ascending:true}).limit(50)
      .then(({data})=>{
        if(data) setMessages(data);
        supabase.from("messages").update({read_by_user:true})
          .eq("user_id",profile.id).eq("is_coach",true).eq("read_by_user",false);
      });
  },[]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);
  useEffect(()=>{ if(isWeek3Plus&&!profile.is_subscribed) setShowPaywall(true); },[]);

  async function sendMessage(){
    if(!input.trim()||loading) return;
    const text=input.trim(); setInput(""); setLoading(true);
    const tempId=Date.now();
    setMessages(prev=>[...prev,{id:tempId,role:"user",content:text,created_at:new Date().toISOString()}]);
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:profile.id,message:text})});
      const data=await res.json();
      if(data.error==="limit_reached"){setLimitReached(true);setShowPaywall(true);setMessages(prev=>prev.filter(m=>m.id!==tempId));setLoading(false);return;}
      setRemaining(data.remaining);
      setMessages(prev=>[...prev.filter(m=>m.id!==tempId),{id:tempId-1,role:"user",content:text,created_at:new Date().toISOString()},{id:tempId,role:"assistant",content:data.reply,created_at:new Date().toISOString()}]);
    }catch(e){setMessages(prev=>prev.filter(m=>m.id!==tempId));}
    setLoading(false);
  }

  async function subscribe(){
    await supabase.from("profiles").update({is_subscribed:true,subscribed_at:new Date().toISOString()}).eq("id",profile.id);
    setShowPaywall(false); setLimitReached(false);
  }

  const limit=profile.is_subscribed?10:3;

  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"52px 20px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,padding:0}}>←</button>
        <div style={{width:40,height:40,borderRadius:12,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏋️</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>Персональный тренер</div><div style={{fontSize:11,color:C.accent}}>ИИ · отвечает мгновенно</div></div>
        {remaining!==null&&<div style={{fontSize:11,color:C.muted,background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 10px"}}>{remaining}/{limit}</div>}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        {messages.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:16}}>💪</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>Привет, {profile.name?.split(" ")[0]}!</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:20}}>Я твой персональный тренер. Спроси меня про питание, тренировки или прогресс.</div>
            {["Почему мой вес не снижается?","Сколько белка мне нужно?","Что делать если нет мотивации?"].map(q=>(
              <button key={q} onClick={()=>setInput(q)} style={{display:"block",width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"10px 14px",fontSize:12,color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left",marginBottom:8}}>{q}</button>
            ))}
          </div>
        )}
        {messages.map((msg,i)=>(
          <div key={msg.id||i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",marginBottom:12}}>
            {msg.role!=="user"&&<div style={{width:28,height:28,borderRadius:"50%",background:msg.is_coach?C.orangeDim:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginRight:8,flexShrink:0,marginTop:4}}>{msg.is_coach?"👨‍💼":"🏋️"}</div>}
            <div style={{maxWidth:"78%",background:msg.role==="user"?C.accent:C.card,color:msg.role==="user"?C.bg:C.text,borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"11px 14px",fontSize:13,lineHeight:1.65}}>
              {msg.content}
              {msg.is_coach&&<div style={{fontSize:10,color:C.orange,marginTop:4,fontWeight:700}}>от тренера</div>}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",justifyContent:"flex-start",marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginRight:8,flexShrink:0}}>🏋️</div>
            <div style={{background:C.card,borderRadius:"18px 18px 18px 4px",padding:"11px 14px",display:"flex",gap:4,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,opacity:0.5}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {showPaywall&&(
        <div style={{background:C.surface,borderTop:`1px solid ${C.border}`,padding:"16px 20px"}}>
          <div style={{background:C.accentDim,border:`1.5px solid ${C.accent}44`,borderRadius:18,padding:"16px 18px"}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{limitReached?`Лимит ${limit} сообщений исчерпан`:"Неделя 3 — время апгрейда"}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:14}}>{limitReached?"С подпиской — до 10 сообщений в день и доступ к живому тренеру.":"Ты прошёл 2 недели! Подпишись чтобы получить 10 сообщений в день и живого тренера."}</div>
            <button onClick={subscribe} style={{width:"100%",background:C.accent,color:C.bg,border:"none",borderRadius:14,padding:"13px",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",marginBottom:8}}>Подписаться →</button>
            <button onClick={()=>setShowPaywall(false)} style={{width:"100%",background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Не сейчас</button>
          </div>
        </div>
      )}

      {!limitReached&&(
        <div style={{background:C.surface,borderTop:`1px solid ${C.border}`,padding:"12px 16px 32px",display:"flex",gap:10,alignItems:"flex-end"}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Напиши вопрос тренеру…" rows={1} style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"11px 14px",color:C.text,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",lineHeight:1.5}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
          <button onClick={sendMessage} disabled={!input.trim()||loading} style={{width:44,height:44,borderRadius:"50%",background:input.trim()&&!loading?C.accent:C.dim,border:"none",cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,color:C.bg,transition:"background 0.15s"}}>↑</button>
        </div>
      )}
    </div>
  );
}
