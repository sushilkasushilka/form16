# FORM16

A 16-week personal fitness and nutrition program delivered as a Progressive Web App.
Members get a daily task, an AI coach, body measurement tracking, and FatSecret diary
sync. A separate coach dashboard lets human coaches review athletes' progress.

## Stack

- **Frontend**: React 19 + Vite, no router (single-page state machine in `src/App.jsx`)
- **Backend**: Vercel serverless functions in [api/](api/)
- **Database & auth**: Supabase (`profiles`, `messages`, `push_subscriptions` tables)
- **AI coach**: Anthropic Claude API (`api/chat.js`)
- **Food diary**: FatSecret REST API via OAuth 1.0 (`api/fs-*.js`)
- **Push notifications**: web-push + Vercel Cron (`api/notify.js`, `public/sw.js`)
- **Languages**: Russian (default) and English, see [src/lang.js](src/lang.js)

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

The app expects these environment variables (set in Vercel for production, in
`.env.local` for dev):

```
# Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...        # server only

# AI coach
ANTHROPIC_API_KEY=...

# FatSecret OAuth
FATSECRET_CLIENT_ID=...
FATSECRET_CLIENT_SECRET=...

# Push notifications
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
CRON_SECRET=...                 # protects /api/notify
VITE_APP_URL=https://...        # used for OAuth redirect back to app
```

## Repository layout

```
api/                    Vercel serverless functions
  chat.js               POST /api/chat — calls Claude, enforces daily limit
  fs-request-token.js   GET  — start FatSecret OAuth (PIN flow)
  fs-verify-pin.js      POST — exchange PIN for permanent token
  fs-callback.js        GET  — legacy redirect-based OAuth callback
  fs-sync.js            POST — pull today's FatSecret diary totals
  subscribe.js          POST — store a web-push subscription
  notify.js             POST/GET — send morning + evening push reminders (cron)
public/
  sw.js                 Service worker — handles push events and notification clicks
src/
  App.jsx               Root, auth flow, member/coach routing
  program.js            16-week program data + day-of-program helpers
  utils.js              BMI/BFP/TDEE math + date helpers
  theme.js              Color tokens
  components/           UI primitives + feature components (Chat, FatSecret, log modals)
  screens/              Top-level screens (Splash, Auth, SignUp, Day0, Coach)
  LangContext.jsx       Provider for the i18n language picker
  lang.js               Translation strings + helper
  supabase.js           Supabase client
  main.jsx              Entry point
vercel.json             Routes + cron configuration
```

## How the FatSecret PIN flow works

FatSecret only supports OAuth 1.0a, and our flow uses the "out of band" (PIN)
variant so we don't need a registered redirect URL:

1. Client calls `/api/fs-request-token` → server signs a request and returns a
   temporary token plus an authorize URL.
2. Client opens the authorize URL in a new tab. The user logs in to FatSecret,
   approves access, and FatSecret displays a 6-digit PIN.
3. User pastes the PIN back into the app. Client calls `/api/fs-verify-pin`,
   which exchanges the PIN + temporary token for a permanent access token and
   stores it in `profiles.fs_oauth_token`.
4. From then on, `/api/fs-sync` signs requests with that token to pull the
   user's daily diary totals.

`api/fs-callback.js` is the older redirect-based callback and is kept for
compatibility with existing FatSecret app configurations.

## How push notifications work

Twice a day at fixed times (07:00 and 21:00 Moscow time, configured as cron in
`vercel.json`), Vercel calls `/api/notify` with the `CRON_SECRET`. The handler:

1. Picks a morning or evening payload based on the current UTC hour.
2. Loads every row from `push_subscriptions`.
3. Sends the notification via `web-push`. Subscriptions returning HTTP 404/410
   are deleted automatically.

Tapping the notification opens the app at `/?action=morning` or `?action=evening`,
and the root component opens the matching log modal (see `App` in `src/App.jsx`).

## Daily message limits

The AI coach enforces per-user daily limits in `api/chat.js`:

- Free users: **3 messages/day**
- Subscribed users (`profiles.is_subscribed = true`): **10 messages/day**

Limits reset based on `profiles.daily_ai_date` (the date of the last counted
message) — there is no scheduled reset job.
