# CarCare — Vehicle Maintenance Tracker

A local-first web app that makes owning a car less frustrating: track maintenance,
get reminded before things are overdue, see what you're spending, and learn to do
the easy jobs yourself.

**Live app:** https://jarrodbrown001-collab.github.io/carcare/ — installable on
phones via "Add to Home Screen", and works offline once loaded (service worker
precaches the app). Data stays in each device's browser; move it between
devices with Export/Import in the footer. First-time visitors can load a
sample car from the welcome screen to explore before entering their own data.

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
- **Local & private** — everything lives in your browser's localStorage. Export /
  import a JSON backup from the footer, or move data between devices with the
  copy/paste "Transfer devices" flow.

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
`{ vehicles, services, schedules, recommendations, fillups }`. Owner's-manual
PDFs live separately in IndexedDB (`carcare-manuals`) and are not part of the
JSON backup.
