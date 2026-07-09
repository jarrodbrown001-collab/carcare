# CarCare — Vehicle Maintenance Tracker

A local-first web app that makes owning a car less frustrating: track maintenance,
get reminded before things are overdue, see what you're spending, and learn to do
the easy jobs yourself.

**Live app:** https://jarrodbrown001-collab.github.io/carcare/ — installable on
phones via "Add to Home Screen". Data stays in each device's browser; move it
between devices with Export/Import in the footer.

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
- **DIY guides** — 10 built-in step-by-step tutorials rated Easy → Advanced, with
  tools, time, savings, and safety notes. Reminder rows link straight to the
  matching guide.
- **Local & private** — everything lives in your browser's localStorage. Export /
  import a JSON backup from the footer.

## Running it

```sh
npm install
npm run dev       # development server at http://localhost:5173
npm run build     # production build in dist/
```

## Code map

| Path | What it is |
|---|---|
| `src/lib/store.js` | localStorage persistence, actions, due-status logic |
| `src/lib/forecast.js` | 12-month cost projection & driving-rate estimation |
| `src/lib/recommendations.js` | cost/savings math for recommended repairs |
| `src/lib/serviceTypes.js` | catalog of service types + default intervals |
| `src/data/guides.js` | the DIY tutorial content |
| `src/components/` | Dashboard, Vehicles, VehicleDetail, Costs, Budget, Recommendations, Guides, ServiceForm |

Data is stored under the `carcare-data-v1` key as
`{ vehicles, services, schedules, recommendations }`.
