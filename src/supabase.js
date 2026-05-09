import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // Persist session in localStorage — survives app close/reopen
      persistSession: true,
      // Auto-refresh token before it expires
      autoRefreshToken: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
      // Storage key
      storageKey: "form16_auth",
      // Use localStorage for maximum persistence
      storage: window.localStorage,
    },
  }
);
