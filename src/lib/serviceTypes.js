// Catalog of common maintenance items with typical intervals and shop-price
// ranges (USD, national ballpark — the app prefers the user's own logged costs).
// Intervals are conservative defaults; users can edit per vehicle.
export const SERVICE_TYPES = [
  { id: 'oil-change', label: 'Oil & filter change', miles: 5000, months: 6, est: [65, 125], guideId: 'oil-change' },
  { id: 'tire-rotation', label: 'Tire rotation', miles: 7500, months: 6, est: [20, 50], guideId: 'tire-rotation' },
  { id: 'tire-pressure', label: 'Tire pressure check', miles: null, months: 1, est: [0, 5], guideId: 'tire-pressure' },
  { id: 'safety-check', label: 'Walk-around safety check', miles: null, months: 1, est: [0, 0], guideId: 'safety-check' },
  { id: 'engine-air-filter', label: 'Engine air filter', miles: 15000, months: 12, est: [30, 60], guideId: 'engine-air-filter' },
  { id: 'cabin-air-filter', label: 'Cabin air filter', miles: 15000, months: 12, est: [40, 85], guideId: 'cabin-air-filter' },
  { id: 'wiper-blades', label: 'Wiper blades', miles: null, months: 12, est: [25, 50], guideId: 'wiper-blades' },
  { id: 'brake-inspection', label: 'Brake inspection', miles: 10000, months: 12, est: [0, 50] },
  { id: 'brake-pads', label: 'Brake pads', miles: 40000, months: null, est: [150, 350], guideId: 'brake-pads' },
  { id: 'battery', label: 'Battery test / replace', miles: null, months: 36, est: [150, 280], guideId: 'battery' },
  { id: 'coolant', label: 'Coolant flush', miles: 30000, months: 36, est: [100, 200], guideId: 'coolant-flush' },
  { id: 'transmission-fluid', label: 'Transmission fluid', miles: 60000, months: null, est: [150, 300] },
  { id: 'differential-fluid', label: 'Differential fluid', miles: 30000, months: null, est: [80, 180], guideId: 'differential-fluid' },
  { id: 'brake-fluid', label: 'Brake fluid change', miles: null, months: 36, est: [80, 150] },
  { id: 'timing-belt', label: 'Timing belt', miles: 90000, months: null, est: [600, 1600] },
  { id: 'spark-plugs', label: 'Spark plugs', miles: 60000, months: null, est: [200, 500], guideId: 'spark-plugs' },
  { id: 'tires', label: 'New tires', miles: 50000, months: 72, est: [500, 1200] },
  { id: 'alignment', label: 'Wheel alignment', miles: 20000, months: 24, est: [90, 180] },
  { id: 'registration', label: 'Registration renewal', miles: null, months: 12, est: [50, 120] },
  { id: 'inspection', label: 'State inspection', miles: null, months: 12, est: [15, 45] },
  { id: 'headlight', label: 'Headlight / bulb', miles: null, months: null, est: [20, 120], guideId: 'headlight' },
  { id: 'repair', label: 'Repair / diagnosis', miles: null, months: null },
  { id: 'mod', label: 'Modification / upgrade', miles: null, months: null },
  { id: 'other', label: 'Other', miles: null, months: null },
]

// Items every new vehicle starts with a reminder schedule for.
export const DEFAULT_SCHEDULE_TYPES = [
  'oil-change',
  'tire-rotation',
  'engine-air-filter',
  'cabin-air-filter',
  'wiper-blades',
  'brake-inspection',
  'battery',
  'registration',
]

export function serviceType(id) {
  return SERVICE_TYPES.find((t) => t.id === id)
}

export function serviceLabel(id) {
  return serviceType(id)?.label ?? id
}
