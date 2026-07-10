// Known part specs for specific vehicles, keyed by "year-make-model"
// (lowercased, spaces to hyphens). Fluid types/capacities/spark plugs marked
// "source: owner's manual" were pulled directly from each vehicle's actual
// manual (matched by VIN) — those are as authoritative as it gets. Entries
// without a source are general reference and should be confirmed with the
// shop links below before ordering.
function key(year, make, model) {
  return `${year}-${make}-${model}`.toLowerCase().replace(/\s+/g, '-')
}

const MANUAL = "owner's manual"

export const VEHICLE_PROFILES = {
  [key(2019, 'Honda', 'Odyssey')]: {
    engine: '3.5L V6 (J35Y7)',
    parts: {
      'oil-change': {
        name: 'Engine oil + filter',
        spec: '0W-20 full synthetic (API Certification Seal required) — 5.7 qt (5.4 L) with filter, 5.4 qt without',
        partNumber: 'Honda OEM filter 15400-PLM-A02 (or equivalent: Fram XG7317, Mobil 1 M1-110A)',
        source: MANUAL,
      },
      coolant: {
        name: 'Coolant',
        spec: 'Honda Long-Life Antifreeze/Coolant Type 2, pre-mixed 50/50 with distilled water',
        source: MANUAL,
      },
      'spark-plugs': {
        name: 'Spark plugs',
        partNumber: 'NGK DILZKR7B11G',
        source: MANUAL,
      },
      'transmission-fluid': {
        name: 'Transmission fluid',
        spec: 'Honda ATF-Type 2 or ATF-Type 3.1 (or higher) depending on transmission — the two must never be mixed; confirm the correct one on the dipstick/fill cap or with a Honda dealer before buying',
        source: MANUAL,
      },
      'engine-air-filter': { name: 'Engine air filter', partNumber: 'Honda OEM 17220-5MR-A00' },
      'cabin-air-filter': { name: 'Cabin air filter', partNumber: 'Honda OEM 80292-TZ5-A41' },
      'wiper-blades': { name: 'Wiper blades', spec: 'Size varies by trim — not listed in the owner\'s manual; check the driver\'s door jamb sticker or your current blades' },
      battery: { name: 'Battery', spec: 'Group size 51R — confirm on the label of your current battery' },
    },
  },
  [key(2016, 'Toyota', 'Camry')]: {
    engine: '2.5L I4 (2AR-FE)',
    parts: {
      'oil-change': {
        name: 'Engine oil + filter',
        spec: 'ILSAC GF-5 multigrade, SAE 0W-20 (5W-20 acceptable as a temporary substitute) — 4.6 qt (4.4 L) with filter, 4.2 qt without',
        partNumber: 'Toyota OEM filter 90915-YZZD4',
        source: MANUAL,
      },
      coolant: {
        name: 'Coolant',
        spec: 'Toyota Super Long Life Coolant (or equivalent long-life hybrid organic acid technology coolant) — 7.7 qt (7.3 L) capacity',
        source: MANUAL,
      },
      'spark-plugs': {
        name: 'Spark plugs',
        partNumber: 'DENSO SK16HR11',
        spec: 'Gap 0.043 in (1.1 mm) — iridium-tipped only, do not re-gap',
        source: MANUAL,
      },
      'transmission-fluid': {
        name: 'Transmission fluid',
        spec: 'Toyota Genuine ATF WS — 6.9 qt (6.5 L) capacity',
        source: MANUAL,
      },
      'brake-fluid': {
        name: 'Brake fluid',
        spec: 'SAE J1703 or FMVSS No. 116 DOT 3',
        source: MANUAL,
      },
      'engine-air-filter': { name: 'Engine air filter', partNumber: 'Toyota OEM 17801-0V010' },
      'cabin-air-filter': { name: 'Cabin air filter', partNumber: 'Toyota OEM 87139-06070' },
      'wiper-blades': { name: 'Wiper blades', spec: 'Driver 26", passenger 19" (confirm on box/current blades — varies slightly by trim)' },
      battery: { name: 'Battery', spec: 'Group size 35 — confirm on the label of your current battery' },
    },
  },
  [key(2008, 'Lexus', 'GX470')]: {
    engine: '4.7L V8 (2UZ-FE)',
    parts: {
      'oil-change': {
        name: 'Engine oil + filter',
        spec: 'ILSAC multigrade, SAE 5W-30 (10W-30 acceptable as a temporary substitute) — 6.5 qt (6.2 L) with filter, 6.0 qt without',
        partNumber: 'Toyota/Lexus OEM filter 90915-YZZD4',
        source: MANUAL,
      },
      coolant: {
        name: 'Coolant',
        spec: 'Toyota Super Long Life Coolant (or equivalent long-life hybrid organic acid technology coolant) — 13.6 qt (12.9 L) capacity',
        source: MANUAL,
      },
      'spark-plugs': {
        name: 'Spark plugs',
        partNumber: 'DENSO SK20R11 or NGK IFR6A11',
        spec: 'Gap 0.043 in (1.1 mm) — iridium-tipped only, do not re-gap',
        source: MANUAL,
      },
      'differential-fluid': {
        name: 'Differential fluid',
        spec: 'Front 1.5 qt (1.4 L), rear 3.3 qt (3.1 L) — Toyota Genuine Differential Gear Oil LT 75W-85 GL-5 or equivalent',
        source: MANUAL,
      },
      'transmission-fluid': {
        name: 'Transfer case fluid',
        spec: 'Hypoid gear oil API GL-5, SAE 75W-90 — 1.5 qt (1.4 L) capacity. (Automatic transmission fluid itself is dealer-check-only per the manual.)',
        source: MANUAL,
      },
      'engine-air-filter': { name: 'Engine air filter', partNumber: 'Toyota/Lexus OEM 17801-50060' },
      'cabin-air-filter': { name: 'Cabin air filter', partNumber: 'Toyota/Lexus OEM 87139-YZZ08' },
      'wiper-blades': { name: 'Wiper blades', spec: 'Driver 22", passenger 20" (confirm on box/current blades)' },
      battery: { name: 'Battery', spec: 'Group size 27F — confirm on the label of your current battery' },
    },
  },
}

export function vehicleProfile(vehicle) {
  if (!vehicle) return null
  return VEHICLE_PROFILES[key(vehicle.year, vehicle.make, vehicle.model)] ?? null
}

export function partInfoFor(vehicle, serviceTypeId) {
  const profile = vehicleProfile(vehicle)
  return profile?.parts?.[serviceTypeId] ?? null
}
