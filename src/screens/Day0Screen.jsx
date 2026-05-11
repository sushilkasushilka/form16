// Day 0 screen — shown the first time a new user opens the app.
// Sets up notifications, suggests adding to home screen, previews Day 1.
import { useState, useEffect } from "react";
import { C } from "../theme.js";
import { t } from "../i18n.js";
import { urlBase64ToUint8Array } from "../utils.js";

export function Day0Screen({ profile, onDone, userId }) {
  const [notifDone, setNotifDone] = useState(() =>
    "Notification" in window && Notification.permission === "granted"
  );
  const [homeDone, setHomeDone] = useState(() =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
  const [installPrompt, setInstallPrompt] = useState(null); // Android deferred prompt
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Capture Android install prompt
  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setHomeDone(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Subscribe to push notifications
  async function subscribeToPush(registration) {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub, userId }),
      });
    } catch (e) {
      console.warn("Push subscribe failed:", e);
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) { setNotifDone(true); return; }
    const result = await Notification.requestPermission();
    setNotifDone(true);
    if (result === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await subscribeToPush(reg);
    }
  }

  async function handleHomeScreen() {
    if (isStandalone) { setHomeDone(true); return; }
    if (installPrompt) {
      // Android — trigger native install dialog
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setHomeDone(true);
    } else if (isIOS) {
      // iOS — show manual instructions
      setShowIOSInstructions(v => !v);
    } else {
      setHomeDone(true);
    }
  }

  const bmiLabel = !profile.bmi ? "" :
    +profile.bmi < 18.5 ? t("bmi.underweight") :
    +profile.bmi < 25   ? t("bmi.normal") :
    +profile.bmi < 30   ? t("bmi.overweight") : t("bmi.obese");
  const bmiColor = !profile.bmi ? C.muted :
    +profile.bmi < 18.5 ? C.blue :
    +profile.bmi < 25   ? C.accent :
    +profile.bmi < 30   ? C.orange : C.red;

  const homeSubtext = isStandalone
    ? "Уже установлено — отлично!"
    : isAndroid && installPrompt
    ? "Нажми, чтобы установить приложение"
    : isIOS
    ? "Safari → Поделиться → На экран «Домой»"
    : "Добавь в закладки или на главный экран";

  const tasks = [
    { id:"profile", icon:"📋", label:"Профиль заполнен",         sub:"Анкета завершена — данные сохранены",     done:true,      action:null,                badge:"готово"  },
    { id:"notif",   icon:"🔔", label:"Включить уведомления",      sub:"7:00 — замер веса · 21:00 — итог дня",   done:notifDone, action:requestNotifications, badge:"сейчас"  },
    { id:"home",    icon:"📲", label:"Добавить на главный экран", sub:homeSubtext,                               done:homeDone,  action:handleHomeScreen,      badge:"сегодня" },
  ];
  const doneCount = tasks.filter(tk => tk.done).length;

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",overflowY:"auto"}}>

      {/* Header */}
      <div style={{padding:"52px 24px 24px",textAlign:"center",animation:"slideUp 0.4s both"}}>
        <div style={{width:64,height:64,borderRadius:20,background:C.accentDim,border:`2px solid ${C.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 20px"}}>🎉</div>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:28,fontWeight:600,marginBottom:8}}>
          Ты в программе,<br/><span style={{color:C.accent}}>{profile.name?.split(" ")[0]}!</span>
        </div>
        <div style={{fontSize:14,color:C.muted,lineHeight:1.7}}>
          16 недель начинаются завтра утром.<br/>Сегодня — подготовка.
        </div>
      </div>

      {/* Weight + BMI */}
      <div style={{padding:"0 24px 20px",animation:"slideUp 0.4s 0.08s both"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"16px"}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Текущий вес</div>
            <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:32,fontWeight:600,color:C.text,lineHeight:1}}>{profile.weight}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>кг · точка отсчёта</div>
          </div>
          <div style={{background:C.card,border:`1px solid ${bmiColor}44`,borderRadius:20,padding:"16px"}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Индекс массы тела</div>
            <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:32,fontWeight:600,color:bmiColor,lineHeight:1}}>{profile.bmi||"—"}</div>
            <div style={{fontSize:12,color:bmiColor,marginTop:4}}>{bmiLabel}</div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{padding:"0 24px 20px",animation:"slideUp 0.4s 0.14s both"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,overflow:"hidden"}}>
          <div style={{padding:"16px 18px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontWeight:500,fontSize:14}}>Сделай сегодня</div>
            <div style={{fontSize:12,color:C.accent,fontWeight:500}}>{doneCount} / {tasks.length}</div>
          </div>
          {tasks.map((task,i)=>(
            <div key={task.id}>
              <div
                onClick={()=>!task.done&&task.action&&task.action()}
                style={{display:"flex",alignItems:"center",gap:12,padding:"13px 18px",borderBottom:(i<tasks.length-1&&!showIOSInstructions)||task.id!=="home"?`1px solid ${C.border}`:"none",cursor:task.done||!task.action?"default":"pointer",transition:"background 0.15s"}}
                onMouseEnter={e=>{if(!task.done&&task.action)e.currentTarget.style.background=C.surface;}}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,background:task.done?C.accent:C.dim,border:task.done?"none":`1.5px solid ${C.border}`,color:task.done?C.bg:C.muted,transition:"all 0.2s"}}>
                  {task.done&&"✓"}
                </div>
                <div style={{width:36,height:36,borderRadius:11,background:task.done?C.accentDim:C.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>
                  {task.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:task.done?C.muted:C.text,textDecoration:task.done?"line-through":"none",marginBottom:2}}>{task.label}</div>
                  <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{task.sub}</div>
                </div>
                {!task.done&&(
                  <div style={{fontSize:10,color:task.badge==="сейчас"?C.accent:C.muted,background:task.badge==="сейчас"?C.accentDim:C.surface,padding:"3px 8px",borderRadius:20,fontWeight:600,flexShrink:0}}>
                    {task.badge}
                  </div>
                )}
              </div>
              {/* iOS install instructions — shown inline */}
              {task.id==="home"&&showIOSInstructions&&!homeDone&&(
                <div style={{background:C.surface,padding:"12px 18px",borderTop:`1px solid ${C.border}`}}>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>
                    1. Нажми <b style={{color:C.text}}>кнопку «Поделиться»</b> внизу экрана Safari<br/>
                    2. Прокрути вниз и выбери <b style={{color:C.text}}>«На экран "Домой"»</b><br/>
                    3. Нажми <b style={{color:C.text}}>«Добавить»</b>
                  </div>
                  <button
                    onClick={()=>{setHomeDone(true);setShowIOSInstructions(false);}}
                    style={{marginTop:10,background:C.accent,color:C.bg,border:"none",borderRadius:12,padding:"8px 16px",fontSize:12,fontWeight:500,fontFamily:"'Inter',system-ui,sans-serif",cursor:"pointer"}}
                  >
                    Готово ✓
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow preview */}
      <div style={{padding:"0 24px 20px",animation:"slideUp 0.4s 0.2s both"}}>
        <div style={{background:C.card,border:`1.5px solid ${C.accent}44`,borderRadius:22,overflow:"hidden"}}>
          <div style={{padding:"14px 18px 12px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.accent,fontWeight:500,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Завтра — День 1</div>
            <div style={{fontSize:13,color:C.muted}}>Вот что тебя ждёт</div>
          </div>
          {[
            {time:"07:00",icon:"⚖️",col:C.accent,label:"Встань на весы",sub:"После туалета, до завтрака. Введи вес одним нажатием"},
            {time:"Днём",icon:"🍽️",col:C.blue,label:"Записывай еду",sub:"Каждый приём пищи сразу после еды — так точнее всего"},
            {time:"21:00",icon:"🌙",col:C.purple,label:"Итог дня",sub:"Пришлём напоминание проверить и дозаписать питание"},
          ].map((item,i,arr)=>(
            <div key={item.time} style={{display:"flex",gap:14,padding:"13px 18px",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
              <div style={{width:42,textAlign:"center",flexShrink:0}}>
                <div style={{fontSize:10,color:item.col,fontWeight:500,marginBottom:6,lineHeight:1}}>{item.time}</div>
                <div style={{width:36,height:36,borderRadius:11,background:`${item.col}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto"}}>{item.icon}</div>
              </div>
              <div style={{paddingTop:2}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{item.label}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{padding:"0 24px 48px",animation:"slideUp 0.4s 0.26s both"}}>
        <button onClick={onDone} style={{width:"100%",background:C.accent,color:C.bg,border:"none",borderRadius:18,padding:"17px",fontSize:16,fontWeight:500,fontFamily:"'Inter',system-ui,sans-serif",cursor:"pointer"}}>
          Открыть приложение →
        </button>
        <div style={{textAlign:"center",marginTop:12,fontSize:12,color:C.muted}}>
          Задачи дня 0 останутся на главном экране
        </div>
      </div>

    </div>
  );
}
