// MPG is computed between consecutive fill-ups by odometer reading, so it
// assumes fill-to-full each time — the standard trip-average method.
export function vehicleFillups(data, vehicleId) {
  return data.fillups
    .filter((f) => f.vehicleId === vehicleId)
    .sort((a, b) => (a.mileage ?? 0) - (b.mileage ?? 0))
}

// Returns the fill-ups with an `mpg` field where computable (needs the
// previous fill-up's odometer reading and this one's gallons).
export function withMpg(fillups) {
  return fillups.map((f, i) => {
    const prev = fillups[i - 1]
    const canCompute =
      prev && f.mileage != null && prev.mileage != null && f.gallons > 0 && f.mileage > prev.mileage
    return { ...f, mpg: canCompute ? (f.mileage - prev.mileage) / f.gallons : null }
  })
}

export function fuelStats(fillups) {
  let totalMiles = 0
  let totalGallons = 0
  let lastMpg = null
  for (let i = 1; i < fillups.length; i++) {
    const prev = fillups[i - 1]
    const f = fillups[i]
    if (f.mileage != null && prev.mileage != null && f.gallons > 0 && f.mileage > prev.mileage) {
      totalMiles += f.mileage - prev.mileage
      totalGallons += f.gallons
      lastMpg = (f.mileage - prev.mileage) / f.gallons
    }
  }

  const withCost = fillups.filter((f) => f.cost != null && f.gallons > 0)
  const avgPricePerGal = withCost.length
    ? withCost.reduce((s, f) => s + f.cost / f.gallons, 0) / withCost.length
    : null
  const year = new Date().getFullYear()
  const spentThisYear = fillups
    .filter((f) => f.date.startsWith(String(year)) && f.cost != null)
    .reduce((s, f) => s + f.cost, 0)

  return {
    count: fillups.length,
    avgMpg: totalGallons > 0 ? totalMiles / totalGallons : null,
    lastMpg,
    avgPricePerGal,
    spentThisYear,
  }
}
