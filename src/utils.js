// Pure helpers — date formatting and body composition math
export const todayStr = () => new Date().toISOString().split("T")[0];
export const fmtDate  = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
export const pct      = (v,mx) => Math.min(100,Math.round(((v||0)/mx)*100));

export function calcBMI(w,h){return (w/((h/100)**2)).toFixed(1);}

export function calcBFP(w,h,waist,neck,gender,thigh){
  if(!waist||!neck||!h)return"—";
  try{
    if(gender==="male")return Math.max(2,495/(1.0324-0.19077*Math.log10(waist-neck)+0.15456*Math.log10(h))-450).toFixed(1);
    const hip=thigh?thigh*1.6:waist*1.1;
    return Math.max(8,495/(1.29579-0.35004*Math.log10(waist+hip-neck)+0.22100*Math.log10(h))-450).toFixed(1);
  }catch{return"—";}
}

export function calcTDEE(w,h,age,gender,activity){
  if(!w||!h||!age)return 0;
  const bmr=gender==="male"?10*w+6.25*h-5*age+5:10*w+6.25*h-5*age-161;
  return Math.round(bmr*({sedentary:1.2,light:1.375,moderate:1.55,active:1.725,veryActive:1.9}[activity]||1.55));
}

// PWA helper — converts a base64-encoded VAPID key to the byte array web-push wants
export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
