// Custom line-icon set for Sciencebody.
// 24×24 viewBox, 1.5px stroke, currentColor. Hand-drawn for the Lab look.
// Usage: <Icon name="scale" size={20} />

export function Icon({ name, size = 20, strokeWidth = 1.5, style }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const ICONS = {
  // Body scale — square base + circular dial + needle pointing NE
  scale: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M12 13 L 14.5 10.5" />
      <path d="M12 6 L 12 7.4" />
    </>
  ),

  // Crescent moon — evening
  moon: <path d="M19 13.5 A 7 7 0 1 1 11.5 5 A 5.2 5.2 0 0 0 19 13.5 Z" />,

  // Flame — streak
  flame: (
    <path d="M12 3 C 9.5 6 7 8 7 12.5 A 5 5 0 0 0 17 12.5 C 17 10.4 15.7 8.6 13.8 7.8 C 14 9.5 13.2 10.6 12 10.6 C 12 8.4 13 5.8 12 3 Z" />
  ),

  // Apple — calories / nutrition
  apple: (
    <>
      <path d="M8.5 9 C 6 9 5 11 5 13.6 C 5 16.5 7 20 9 20 C 10.2 20 11 19.3 12 19.3 C 13 19.3 13.8 20 15 20 C 17 20 19 16.5 19 13.6 C 19 11 18 9 15.5 9 C 13.7 9 13 9.8 12 9.8 C 11 9.8 10.3 9 8.5 9 Z" />
      <path d="M12 9.5 L 12 5.5" />
      <path d="M12 6.6 C 13.6 5.2 15.2 5.4 15 7.2" />
    </>
  ),

  // Footprint — steps
  footstep: (
    <>
      <ellipse cx="12" cy="15" rx="4" ry="6" />
      <circle cx="8.6" cy="7.2" r="0.6" fill="currentColor" />
      <circle cx="11" cy="5.8" r="0.7" fill="currentColor" />
      <circle cx="13.4" cy="6.2" r="0.6" fill="currentColor" />
      <circle cx="15.4" cy="7.6" r="0.5" fill="currentColor" />
    </>
  ),

  // Bone — protein
  bone: (
    <path d="M5.3 11.5 C 4.3 10.5 4.5 8.5 6.4 8.5 C 8 8.5 8 10 9.6 10 L 14.4 10 C 16 10 16 8.5 17.6 8.5 C 19.5 8.5 19.7 10.5 18.7 11.5 C 19.7 12.5 19.5 14.5 17.6 14.5 C 16 14.5 16 13 14.4 13 L 9.6 13 C 8 13 8 14.5 6.4 14.5 C 4.5 14.5 4.3 12.5 5.3 11.5 Z" />
  ),

  // Ruler — measurements (with tick marks)
  ruler: (
    <>
      <rect x="3" y="9" width="18" height="6" rx="1" />
      <path d="M7 9 L 7 11.5" />
      <path d="M11 9 L 11 12.5" />
      <path d="M15 9 L 15 11.5" />
      <path d="M19 9 L 19 12.5" />
    </>
  ),

  // Bell — notifications
  bell: (
    <>
      <path d="M5.5 16 L 18.5 16" />
      <path d="M18 16 C 18 10 16.5 6 12 6 C 7.5 6 6 10 6 16" />
      <path d="M10.5 19 L 13.5 19" />
      <circle cx="12" cy="4" r="0.6" fill="currentColor" />
    </>
  ),

  // Four-point spark — generic "AI / highlight"
  spark: (
    <>
      <path d="M12 3 L 13 10 L 20 11 L 13 12 L 12 19 L 11 12 L 4 11 L 11 10 Z" />
      <path d="M19 4.5 L 19.3 5.7 L 20.5 6 L 19.3 6.3 L 19 7.5 L 18.7 6.3 L 17.5 6 L 18.7 5.7 Z" />
    </>
  ),

  // Coach — speech bubble with a single dot. Reads as "chat with advisor".
  coach: (
    <>
      <path d="M4 7 A 2.5 2.5 0 0 1 6.5 4.5 L 17.5 4.5 A 2.5 2.5 0 0 1 20 7 L 20 14 A 2.5 2.5 0 0 1 17.5 16.5 L 12.5 16.5 L 8 20 L 8 16.5 L 6.5 16.5 A 2.5 2.5 0 0 1 4 14 Z" />
      <circle cx="12" cy="10.5" r="1.1" fill="currentColor" />
    </>
  ),

  // Grid — program calendar
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),

  // User — account
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4 20 C 4 16.5 7.8 14.5 12 14.5 C 16.2 14.5 20 16.5 20 20" />
    </>
  ),

  // Sun — today
  sun: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3.5 L 12 5.4" />
      <path d="M12 18.6 L 12 20.5" />
      <path d="M3.5 12 L 5.4 12" />
      <path d="M18.6 12 L 20.5 12" />
      <path d="M5.9 5.9 L 7.3 7.3" />
      <path d="M16.7 16.7 L 18.1 18.1" />
      <path d="M5.9 18.1 L 7.3 16.7" />
      <path d="M16.7 7.3 L 18.1 5.9" />
    </>
  ),

  // Phone — install / PWA
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <circle cx="12" cy="18" r="0.7" fill="currentColor" />
    </>
  ),

  // Target — goal
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),

  // Plus
  plus: (
    <>
      <path d="M12 5 L 12 19" />
      <path d="M5 12 L 19 12" />
    </>
  ),

  // Check
  check: <path d="M5 12 L 10 17 L 19 7" />,

  // Arrow right
  arrowRight: (
    <>
      <path d="M5 12 L 19 12" />
      <path d="M13 6 L 19 12 L 13 18" />
    </>
  ),

  // Chevron right
  chevronRight: <path d="M9 6 L 15 12 L 9 18" />,

  // Globe — language settings
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M 12 3 C 14.5 5.5 16 8.5 16 12 C 16 15.5 14.5 18.5 12 21 C 9.5 18.5 8 15.5 8 12 C 8 8.5 9.5 5.5 12 3" />
    </>
  ),

  // Pencil — edit affordance
  pencil: (
    <>
      <path d="M 14 4 L 20 10 L 9 21 L 3 21 L 3 15 Z" />
      <path d="M 13 5 L 19 11" />
    </>
  ),

  // Logout — door + arrow
  logout: (
    <>
      <path d="M 14 4 H 18 a 2 2 0 0 1 2 2 V 18 a 2 2 0 0 1 -2 2 H 14" />
      <path d="M 10 8 L 14 12 L 10 16" />
      <line x1="14" y1="12" x2="4" y2="12" />
    </>
  ),

  // Trash — delete
  trash: (
    <>
      <path d="M 4 7 H 20" />
      <path d="M 9 7 V 4 H 15 V 7" />
      <path d="M 6 7 L 7 20 H 17 L 18 7" />
    </>
  ),

  // Heart — support / about
  heart: (
    <path d="M 12 21 C 6 16 3 12.5 3 8.5 A 4.5 4.5 0 0 1 12 6 A 4.5 4.5 0 0 1 21 8.5 C 21 12.5 18 16 12 21 Z" />
  ),

  // Lock — paywall indicator
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M 8 11 V 8 a 4 4 0 0 1 8 0 V 11" />
      <circle cx="12" cy="16" r="1.1" fill="currentColor" />
    </>
  ),

  // Chart — progress / trend
  trend: (
    <>
      <path d="M3 18 L 9 12 L 13 15 L 21 6" />
      <path d="M15 6 L 21 6 L 21 11" />
    </>
  ),

  // ─── Animal avatars ────────────────────────────────────────────────
  // Fox — pointed ears, narrow muzzle
  fox: (
    <>
      <path d="M6 9 L 7 4 L 10 7.5" />
      <path d="M18 9 L 17 4 L 14 7.5" />
      <path d="M5 11 C 5 16 8 19 12 19 C 16 19 19 16 19 11" />
      <path d="M8 7.5 L 16 7.5" />
      <circle cx="9.5" cy="12.5" r="0.7" fill="currentColor" />
      <circle cx="14.5" cy="12.5" r="0.7" fill="currentColor" />
      <circle cx="12" cy="15" r="0.7" fill="currentColor" />
      <path d="M11.5 15.5 L 12 16.3 L 12.5 15.5" />
    </>
  ),

  // Bear — round face, round ears
  bear: (
    <>
      <circle cx="6.5" cy="7" r="2" />
      <circle cx="17.5" cy="7" r="2" />
      <circle cx="12" cy="13" r="6.5" />
      <circle cx="9.5" cy="12" r="0.7" fill="currentColor" />
      <circle cx="14.5" cy="12" r="0.7" fill="currentColor" />
      <ellipse cx="12" cy="15" rx="1.6" ry="1" />
      <circle cx="12" cy="14.7" r="0.5" fill="currentColor" />
    </>
  ),

  // Cat — pointed triangle ears, whiskers
  cat: (
    <>
      <path d="M6 5 L 7.5 9.5 L 10 7.5" />
      <path d="M18 5 L 16.5 9.5 L 14 7.5" />
      <path d="M5 10 C 5 15 8 19 12 19 C 16 19 19 15 19 10" />
      <circle cx="9.5" cy="12" r="0.7" fill="currentColor" />
      <circle cx="14.5" cy="12" r="0.7" fill="currentColor" />
      <path d="M12 14.5 L 12 15.5" />
      <path d="M11 15.5 Q 12 16.3 13 15.5" />
      <path d="M7.5 13.5 L 9.5 13.7" />
      <path d="M16.5 13.5 L 14.5 13.7" />
    </>
  ),

  // Rabbit — tall ears
  rabbit: (
    <>
      <path d="M9 9 C 7.5 7 7.5 4 9 3 C 10.2 4 10.2 7 10 9" />
      <path d="M15 9 C 16.5 7 16.5 4 15 3 C 13.8 4 13.8 7 14 9" />
      <circle cx="12" cy="14" r="5.5" />
      <circle cx="10" cy="13" r="0.6" fill="currentColor" />
      <circle cx="14" cy="13" r="0.6" fill="currentColor" />
      <circle cx="12" cy="15.2" r="0.6" fill="currentColor" />
      <path d="M12 15.6 L 12 16.6" />
      <path d="M11 16.6 L 13 16.6" />
    </>
  ),

  // Owl — round face, two big eyes, tufts
  owl: (
    <>
      <path d="M7.5 5.8 L 8.8 4.4" />
      <path d="M16.5 5.8 L 15.2 4.4" />
      <circle cx="12" cy="13" r="6.5" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="9" cy="12" r="0.7" fill="currentColor" />
      <circle cx="15" cy="12" r="0.7" fill="currentColor" />
      <path d="M11 16 L 12 17 L 13 16 Z" />
    </>
  ),

  // Deer — branching antlers, narrow face
  deer: (
    <>
      <path d="M9 7 L 8 3" />
      <path d="M9 7 L 7 4.5" />
      <path d="M9 7 L 10.5 5" />
      <path d="M15 7 L 16 3" />
      <path d="M15 7 L 17 4.5" />
      <path d="M15 7 L 13.5 5" />
      <path d="M8 9 C 7 13 9 19 12 19 C 15 19 17 13 16 9" />
      <circle cx="10.5" cy="12" r="0.6" fill="currentColor" />
      <circle cx="13.5" cy="12" r="0.6" fill="currentColor" />
      <ellipse cx="12" cy="16.5" rx="1" ry="0.7" />
      <circle cx="12" cy="16.3" r="0.4" fill="currentColor" />
    </>
  ),

  // Whale — side view, spouts, tail
  whale: (
    <>
      <path d="M11 8 L 11 5" />
      <path d="M13 8 L 13 5" />
      <path d="M3 14 C 3 10 7 8 12 8 C 16 8 18 10 18 14 L 21 12 L 21 16 L 18 15 C 17 17 15 18 12 18 C 7 18 3 17 3 14 Z" />
      <circle cx="7.5" cy="13" r="0.7" fill="currentColor" />
      <path d="M9 15.2 C 10 16 11 16 12 15.6" />
    </>
  ),

  // Penguin — body, belly curve, beak
  penguin: (
    <>
      <path d="M8 4 C 6 4 5 7 5 11 C 5 15 5 18 7 20 C 9 21 15 21 17 20 C 19 18 19 15 19 11 C 19 7 18 4 16 4 C 14 3 10 3 8 4 Z" />
      <path d="M9 13 C 9 17 10 20 12 20 C 14 20 15 17 15 13" />
      <circle cx="9.5" cy="9" r="0.6" fill="currentColor" />
      <circle cx="14.5" cy="9" r="0.6" fill="currentColor" />
      <path d="M11 11 L 12 12.3 L 13 11" />
    </>
  ),
};

// ─── Avatar helper ────────────────────────────────────────────────────
// Animal-icon avatars with emoji fallback for legacy/existing users.
export const AVATAR_OPTIONS = ["fox","bear","cat","rabbit","owl","deer","whale","penguin"];

export function Avatar({ value, size = 24, strokeWidth = 1.5, style }) {
  if (AVATAR_OPTIONS.includes(value)) {
    return <Icon name={value} size={size} strokeWidth={strokeWidth} style={style} />;
  }
  // Legacy emoji avatar — render as text
  return <span style={{ fontSize: Math.round(size * 0.9), lineHeight: 1, ...style }}>{value || "·"}</span>;
}
