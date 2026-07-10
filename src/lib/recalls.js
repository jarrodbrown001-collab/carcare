// NHTSA's free recalls API (same agency as the VIN decoder). Model naming
// isn't always consistent with what owners type — "GX470" vs "GX 470" — so
// try a spaced variant before giving up.
export async function fetchRecalls(vehicle) {
  const variants = [vehicle.model]
  const spaced = vehicle.model.replace(/([A-Za-z])(\d)/, '$1 $2')
  if (spaced !== vehicle.model) variants.push(spaced)

  for (const model of variants) {
    const url =
      `https://api.nhtsa.gov/recalls/recallsByVehicle` +
      `?make=${encodeURIComponent(vehicle.make)}` +
      `&model=${encodeURIComponent(model)}` +
      `&modelYear=${encodeURIComponent(vehicle.year)}`
    const res = await fetch(url)
    if (!res.ok) continue
    const json = await res.json()
    if (json.results?.length) return json.results
  }
  return []
}
