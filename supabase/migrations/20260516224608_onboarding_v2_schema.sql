-- Onboarding v2 schema additions.
-- Adds identity, safety-screen, and reminder fields to `profiles`,
-- and a `daily_reflections` table for Days 4–14 identity prompts.
-- All new columns are nullable so existing users continue to work unchanged.

ALTER TABLE profiles
  ADD COLUMN previous_attempts text CHECK (previous_attempts IN ('never','1_2','3_5','many')),
  ADD COLUMN initial_why text,
  ADD COLUMN scoff_score integer CHECK (scoff_score >= 0 AND scoff_score <= 5),
  ADD COLUMN scoff_completed_at timestamptz,
  ADD COLUMN scoff_acknowledged_risk boolean DEFAULT false,
  ADD COLUMN medical_conditions text[],
  ADD COLUMN onboarding_version integer DEFAULT 1,
  ADD COLUMN keystone_habit text,
  ADD COLUMN morning_reminder_time text DEFAULT '07:00',
  ADD COLUMN evening_reminder_time text DEFAULT '21:00';

-- Mark all existing users as v1 so the routing logic can keep them on the old flow
UPDATE profiles SET onboarding_version = 1 WHERE onboarding_version IS NULL;

CREATE TABLE IF NOT EXISTS daily_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number BETWEEN 4 AND 14),
  prompt_key text NOT NULL,
  response text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_number)
);

CREATE INDEX idx_daily_reflections_user ON daily_reflections(user_id);
