// Design tokens — "Lab" direction. Single accent (botanical green) + ink
// on paper. Categorical colors (orange/blue/purple/red/green/yellow) are
// kept as keys so legacy inline styles still resolve, but they all map
// to ink, accent, or quiet warn/amber so the UI reads as one system.

// ─── Colors ────────────────────────────────────────────────────────
export const C = {
  // Surfaces
  bg:      "#FAFAF7",  // paper
  surface: "#FFFFFF",  // pure white card
  card:    "#FFFFFF",  // alias of surface in Lab
  border:  "#ECEAE2",  // hairline
  dim:     "#D9D5C7",  // stronger hairline / disabled fill

  // Text
  text:    "#0E1117",  // ink
  muted:   "#6B6F76",  // captions

  // Primary accent (single)
  accent:    "#0F4F3A",
  accentDim: "rgba(15,79,58,0.07)",

  // Categorical legacy keys — all collapse to ink or accent so the UI
  // reads as one system. Use sparingly; prefer `text` / `accent` directly.
  orange:    "#0E1117", orangeDim: "rgba(14,17,23,0.06)",  // was training/streak/calories
  blue:      "#0E1117", blueDim:   "rgba(14,17,23,0.06)",  // was weight/active recovery
  purple:    "#0F4F3A", purpleDim: "rgba(15,79,58,0.07)",  // was BFP/protein/mindset
  green:     "#0F4F3A", greenDim:  "rgba(15,79,58,0.07)",
  red:       "#B91C1C", redDim:    "rgba(185,28,28,0.08)", // destructive only
  yellow:    "#A16207", yellowDim: "rgba(161,98,7,0.08)",  // caution / amber
};

// ─── Typography ───────────────────────────────────────────────────
// Fraunces — display serif (numbers, headlines)
// Onest    — UI sans (Cyrillic-first geometric grotesk; reads lighter than Inter)
// JetBrains Mono — numerics where precision matters
export const F = {
  serif: "'Fraunces', Georgia, serif",
  sans:  "'Onest', 'Inter', system-ui, sans-serif",
  mono:  "'JetBrains Mono', ui-monospace, monospace",
};

// ─── Brand ────────────────────────────────────────────────────────
export const BRAND = {
  name:    "Sciencebody",
  tagline: "тело по науке",
};
