// Pure helpers — date formatting and body composition math
export const todayStr = () => new Date().toISOString().split("T")[0];
export const fmtDate  = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
export const pct      = (v,mx) => Math.min(100,Math.round(((v||0)/mx)*100));

export function calcBMI(w,h){return (w/((h/100)**2)).toFixed(1);}

// Body fat percentage as the geometric mean of three estimation methods:
// Deurenberg (BMI-based), US Navy (circumferences), and YMCA (waist + weight).
// Formula transcribed from procent_fat.xlsx — same approach as a single
// Navy-method estimate, but averaging across three methods reduces the
// outlier risk any one formula carries.
//
// Required inputs in cm/kg/years. Hip is required for women only.
// Returns the rounded percentage as a string, or "—" when not enough
// data has been provided yet.
export function calcBFP({ weight, height, age, waist, neck, gender, hip }) {
  if (!weight || !height || !age || !waist || !neck) return "—";
  if (gender === "female" && !hip) return "—";

  try {
    const bmi = weight / Math.pow(height / 100, 2);
    const genderFlag = gender === "male" ? 1 : 0;

    // Deurenberg — BFP from BMI + age + gender
    const bfpBmi = 1.2 * bmi + 0.23 * age - 10.8 * genderFlag - 5.4;

    // US Navy — circumferences (constants from the xlsx, base-10 logs)
    const bfpNavy = gender === "male"
      ? 86.01  * Math.log10(waist - neck)        - 70.041 * Math.log10(height) + 30.3
      : 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 104.912;

    // YMCA — waist + weight, computed in inches/pounds internally
    const waistIn  = waist  / 2.54;
    const weightLb = weight / 0.454;
    const ymcaIntercept = gender === "male" ? -98.42 : -76.76;
    const bfpYmca = (ymcaIntercept + 4.15 * waistIn - 0.082 * weightLb) / weightLb * 100;

    // Geometric mean is undefined for non-positive operands — bail out
    // rather than produce NaN that would render as garbage.
    if (bfpBmi <= 0 || bfpNavy <= 0 || bfpYmca <= 0) return "—";
    return Math.cbrt(bfpBmi * bfpNavy * bfpYmca).toFixed(1);
  } catch { return "—"; }
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
