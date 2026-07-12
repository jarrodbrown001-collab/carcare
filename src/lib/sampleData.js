import { uid, todayStr, addMonths } from './store'
import { DEFAULT_SCHEDULE_TYPES, serviceType } from './serviceTypes'

// One example vehicle with enough history that every screen has something to
// show: an overdue item, a due-soon item, real costs, fill-ups for MPG, and a
// shop-recommended repair. Dates are relative to today so the demo never goes
// stale. Deleting the vehicle removes all of it.
export function buildSampleData() {
  const vehicleId = uid()
  const monthsAgo = (n) => addMonths(todayStr(), -n)
  const daysAgo = (n) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return {
    vehicles: [
      {
        id: vehicleId,
        createdAt: monthsAgo(14),
        year: '2019',
        make: 'Toyota',
        model: 'Camry',
        nickname: 'Sample car',
        startMileage: 52000,
        currentMileage: 63800,
        mileageUpdatedAt: daysAgo(3),
      },
    ],
    schedules: DEFAULT_SCHEDULE_TYPES.map((typeId) => {
      const t = serviceType(typeId)
      return { id: uid(), vehicleId, type: typeId, intervalMiles: t.miles, intervalMonths: t.months }
    }),
    services: [
      { id: uid(), vehicleId, type: 'oil-change', date: monthsAgo(7), mileage: 55600, cost: 62, diy: false, notes: 'Quick-lube shop, full synthetic' },
      { id: uid(), vehicleId, type: 'tire-rotation', date: monthsAgo(7), mileage: 55600, cost: 20, diy: false },
      { id: uid(), vehicleId, type: 'registration', date: monthsAgo(11), mileage: null, cost: 86, diy: false },
      { id: uid(), vehicleId, type: 'wiper-blades', date: monthsAgo(5), mileage: 58900, cost: 31.5, diy: true, notes: 'First DIY job — 10 minutes' },
      { id: uid(), vehicleId, type: 'oil-change', date: monthsAgo(1), mileage: 62900, cost: 54.2, diy: true, notes: '0W-16 + OEM filter, saved ~$40' },
    ],
    recommendations: [
      {
        id: uid(),
        vehicleId,
        status: 'open',
        resolvedServiceId: null,
        resolvedDate: null,
        title: 'Front brake pads getting thin',
        estLow: 220,
        estHigh: 320,
        dateIdentified: monthsAgo(2),
        targetDate: addMonths(todayStr(), 3),
        notes: 'Shop measured 4mm at the last oil change — not urgent yet',
      },
    ],
    fillups: [
      { id: uid(), vehicleId, date: daysAgo(22), mileage: 63050, gallons: 11.8, cost: 39.5 },
      { id: uid(), vehicleId, date: daysAgo(10), mileage: 63420, gallons: 11.2, cost: 37.9 },
      { id: uid(), vehicleId, date: daysAgo(3), mileage: 63800, gallons: 12.0, cost: 40.7 },
    ],
  }
}
