// Known part specs for specific vehicles, keyed by "year-make-model"
// (lowercased, spaces to hyphens). This is reference info, not a live parts
// database — always confirm exact fitment with the shop links before
// ordering, since trim/engine options can change some of these.
function key(year, make, model) {
  return `${year}-${make}-${model}`.toLowerCase().replace(/\s+/g, '-')
}

export const VEHICLE_PROFILES = {
  [key(2019, 'Honda', 'Odyssey')]: {
    engine: '3.5L V6 (J35Y6)',
    parts: {
      'oil-change': { name: 'Engine oil + filter', spec: '0W-20 full synthetic, ~5.8 qt with filter', partNumber: 'Honda OEM filter 15400-PLM-A02 (or equivalent: Fram XG7317, Mobil 1 M1-110A)' },
      'engine-air-filter': { name: 'Engine air filter', partNumber: 'Honda OEM 17220-5MR-A00' },
      'cabin-air-filter': { name: 'Cabin air filter', partNumber: 'Honda OEM 80292-TZ5-A41' },
      'wiper-blades': { name: 'Wiper blades', spec: 'Driver 26", passenger 16" (confirm on box/current blades)' },
      battery: { name: 'Battery', spec: 'Group size 51R — confirm on the label of your current battery' },
    },
  },
  [key(2016, 'Toyota', 'Camry')]: {
    engine: '2.5L I4 (2AR-FE)',
    parts: {
      'oil-change': { name: 'Engine oil + filter', spec: '0W-20 full synthetic, ~4.6 qt with filter', partNumber: 'Toyota OEM filter 90915-YZZD4' },
      'engine-air-filter': { name: 'Engine air filter', partNumber: 'Toyota OEM 17801-0V010' },
      'cabin-air-filter': { name: 'Cabin air filter', partNumber: 'Toyota OEM 87139-06070' },
      'wiper-blades': { name: 'Wiper blades', spec: 'Driver 26", passenger 19" (confirm on box/current blades)' },
      battery: { name: 'Battery', spec: 'Group size 35 — confirm on the label of your current battery' },
    },
  },
  [key(2008, 'Lexus', 'GX470')]: {
    engine: '4.7L V8 (2UZ-FE)',
    parts: {
      'oil-change': { name: 'Engine oil + filter', spec: '5W-30 (synthetic recommended), ~6.4 qt with filter', partNumber: 'Toyota/Lexus OEM filter 90915-YZZD4' },
      'engine-air-filter': { name: 'Engine air filter', partNumber: 'Toyota/Lexus OEM 17801-50060' },
      'cabin-air-filter': { name: 'Cabin air filter', partNumber: 'Toyota/Lexus OEM 87139-YZZ08' },
      'wiper-blades': { name: 'Wiper blades', spec: 'Driver 22", passenger 20" (confirm on box/current blades)' },
      battery: { name: 'Battery', spec: 'Group size 27F — confirm on the label of your current battery' },
      'differential-fluid': { name: 'Differential fluid', spec: 'Toyota Genuine Gear Oil (front & rear diff), consult manual for exact grade by production date' },
      'transmission-fluid': { name: 'Transmission fluid', spec: 'Toyota WS or Type IV ATF depending on production date — confirm before buying' },
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
