# CarCare — Vehicle Maintenance Tracker

A local-first web app that makes owning a car less frustrating: track maintenance,
get reminded before things are overdue, see what you're spending, and learn to do
the easy jobs yourself.

**Live app:** https://jarrodbrown001-collab.github.io/carcare/ — installable on
phones via "Add to Home Screen", and works offline once loaded (service worker
precaches the app). By default data stays in each device's browser (move it
between devices with Export/Import in the footer); sign in to sync it to your
account instead — see [Cloud sync](#cloud-sync-optional) below. First-time
visitors can load a sample car from the welcome screen to explore before
entering their own data.

## Features

- **Multiple vehicles** — each with its own mileage, reminder schedule, and history.
  Optional VIN lookup (free NHTSA API) fills in year/make/model automatically.
- **Service log** — date, mileage, cost, notes, and a DIY flag per record. Logging a
  service automatically bumps the odometer and rebases that item's reminder.
- **Smart reminders** — every vehicle starts with a standard schedule (oil, tires,
  filters, battery, registration…). Each item tracks *miles and/or months, whichever
  comes first*, and shows **Overdue / Due soon / OK** with how far out it is.
- **Recommended repairs** — a place for shop-identified, non-interval work
  ("replace front lower control arms," an alignment, anything a mechanic flags
  that isn't on your routine schedule). Tracks total estimated cost, an optional
  target date to plan around, and a suggested monthly savings amount; "Done —
  log it" turns one into a real service record. Lives in its own **Repairs** tab
  and on each vehicle's detail page.
- **Cost tracking** — spending by month (stacked by vehicle), by category, plus
  12-month, average, all-time, and DIY-job stats.
- **Budget forecast** — projects the next 12 months of scheduled maintenance per
  vehicle (using your driving rate and your actual logged costs, falling back to
  typical shop prices) and suggests a monthly sinking-fund amount.
- **Quote check (upsell protection)** — enter what a shop quoted; the app flags
  anything that isn't actually due per your log and compares the price to your
  history / typical ranges.
- **Fuel & MPG log** — record fill-ups (odometer, gallons, cost); MPG per tank,
  running average, and price-per-gallon are computed automatically.
- **Owner's manual on file** — per-vehicle VIN entry, step-by-step instructions
  for downloading the manual from the manufacturer's owner portal, and PDF
  storage in the browser. Parts specs sourced from the manual link straight to
  the right page of the stored PDF.
- **Parts & shopping** — spec + OEM part number per maintenance item (marked
  when sourced from the actual owner's manual), with live links to price
  comparison, retailers, and YouTube DIY video searches. A dashboard
  "Shop due items" view aggregates parts for everything currently due.
- **Safety recalls** — on-demand check of the official NHTSA recall database
  per vehicle.
- **DIY guides** — 13 built-in step-by-step tutorials rated Easy → Advanced, with
  tools, time, savings, and safety notes. Reminder rows link straight to the
  matching guide.
- **Reminders & nudges** — optional browser notification when the app opens
  with items due, a banner when your backup is stale, and a warning when a
  vehicle's odometer hasn't been updated in over a month.
- **Local by default, cloud sync optional** — with no setup, everything lives
  in your browser's localStorage: export/import a JSON backup from the footer,
  or move data between devices with the copy/paste "Transfer devices" flow.
  Configure Supabase (see below) and sign in with a magic-link email to sync
  vehicles, history, and owner's-manual PDFs across every device instead.

## Running it

```sh
npm install
npm run dev       # development server at http://localhost:5173
npm run build     # production build in dist/
```

## Cloud sync (optional)

Cross-device sync runs on [Supabase](https://supabase.com) (Postgres + auth +
file storage). The app works fine without it — this is purely opt-in.

1. Create a free account at [supabase.com](https://supabase.com) and a new project.
2. Open the project's **SQL Editor** and run everything in
   [`supabase/schema.sql`](supabase/schema.sql) — it creates the five data
   tables, row-level security policies (each account can only ever see its own
   rows), and a private `manuals` storage bucket for owner's-manual PDFs.
3. In **Authentication > Sign In / Providers**, confirm Email is enabled —
   this one provider covers password sign-in/sign-up, the passwordless
   magic-link option, and password-reset emails; nothing extra to turn on.
   In **Authentication > URL Configuration**, add your dev URL
   (`http://localhost:5173`) and your deployed URL to Redirect URLs so
   confirmation, magic-link, and reset emails all work from both.
4. In **Project Settings > API**, copy the **Project URL** and **anon public**
   key.
5. Locally: copy `.env.example` to `.env.local` and fill in those two values.
   Restart `npm run dev` — a sign-in screen should appear.
6. For the deployed GitHub Pages build: in the GitHub repo, go to
   **Settings > Secrets and variables > Actions > Variables** and add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the anon key is safe to
   expose publicly — row-level security is what actually protects the data).
   The next push to `main` will build with cloud sync enabled.

Signing in the first time on a device that already has local vehicle data
prompts a one-time "upload to my account" migration; nothing is deleted from
localStorage in the process.

The sign-in screen supports **email + password** (create an account once,
then sign in with the same password on every device — no waiting on an
email each time), a **passwordless sign-in link** as an alternative, and
**forgot-password** reset. By default Supabase requires confirming a new
account's email before its password can be used to sign in (Authentication
> Providers > Email > "Confirm email") — leave that on; it only affects the
very first sign-up, not later sign-ins from other devices.

## Code map

| Path | What it is |
|---|---|
| `src/lib/store.js` | data persistence (localStorage and/or Supabase), actions, due-status logic |
| `src/lib/supabaseClient.js` | Supabase client + `cloudEnabled` flag (env-driven) |
| `src/lib/auth.jsx` | auth context — session state, magic-link sign-in/out |
| `src/components/Auth.jsx` | sign-in screen |
| `src/lib/manualStore.js` | owner's-manual PDF storage (IndexedDB locally, Supabase Storage in the cloud) |
| `supabase/schema.sql` | tables, row-level security, storage bucket — run once per Supabase project |
| `src/lib/forecast.js` | 12-month cost projection & driving-rate estimation |
| `src/lib/recommendations.js` | cost/savings math for recommended repairs |
| `src/lib/serviceTypes.js` | catalog of service types + default intervals |
| `src/data/guides.js` | the DIY tutorial content |
| `src/components/` | Dashboard, Vehicles, VehicleDetail, Costs, Budget, Recommendations, Guides, ServiceForm |

Locally, data is cached under the `carcare-data-v1` localStorage key as
`{ vehicles, services, schedules, recommendations, fillups }` — when signed in
this is a read cache of Supabase, not the source of truth. Owner's-manual PDFs
live separately (IndexedDB locally, a private Supabase Storage bucket in the
cloud) and are not part of the JSON backup either way.
