// Centralized feature unlock thresholds, keyed off getUserGlobalDay(profile).
// Day 0 = signup day. Day 1 = next calendar day. See program.js::getUserGlobalDay.
//
// Add a new feature here in one place, then read it via isFeatureUnlocked()
// in components — no need to scatter day-number constants across files.

export const FEATURE_UNLOCK_DAYS = {
  food_diary:     20,  // Week 3 — calorie/tracking lesson day
  step_tracker:   33,  // Week 6 — NEAT baseline action
  protein_target: 24,  // Week 4 — protein calculation
  calorie_target: 18,  // Week 3 — TDEE estimation
  greens_check:   29,  // Week 5 — fiber lesson (existing pattern in MissionStrip)
  why_editable:    3,  // Day 3 — the "5 Whys" lesson where users fill in their why
};

export function isFeatureUnlocked(featureName, currentDay) {
  const threshold = FEATURE_UNLOCK_DAYS[featureName];
  if (threshold === undefined) return true; // unknown feature defaults open
  return currentDay >= threshold;
}

export function daysUntilUnlock(featureName, currentDay) {
  const threshold = FEATURE_UNLOCK_DAYS[featureName];
  if (threshold === undefined) return 0;
  return Math.max(0, threshold - currentDay);
}

// Returns the i18n key prefix for a given locked feature, or null if open.
// Components use: t(`${getLockKey('food_diary')}.title`)
export function getLockKey(featureName) {
  const map = {
    food_diary:     "v2.locked.food",
    step_tracker:   "v2.locked.steps",
    protein_target: "v2.locked.protein",
    calorie_target: "v2.locked.calories",
  };
  return map[featureName] || null;
}
