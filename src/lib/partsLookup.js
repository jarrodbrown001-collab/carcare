// Builds live search links into real retailers rather than hardcoding prices
// (which go stale immediately) — their own search/fitment engines confirm
// the details and give current prices. Google Shopping gives a cross-store
// price comparison in one click; the others are direct-to-retailer.
export function shopLinks(vehicle, query) {
  const vehicleDesc = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
  const fullQuery = [query, vehicleDesc].filter(Boolean).join(' ')
  const q = encodeURIComponent(fullQuery)
  return [
    { name: 'Compare prices (Google Shopping)', url: `https://www.google.com/search?tbm=shop&q=${q}` },
    { name: 'Amazon', url: `https://www.amazon.com/s?k=${q}` },
    { name: 'AutoZone', url: `https://www.autozone.com/searchresult?searchText=${encodeURIComponent(query)}` },
    { name: 'RockAuto', url: 'https://www.rockauto.com/en/partsearch/' },
  ]
}

// A search link, not a specific video — specific video URLs go dead or get
// deleted constantly, and guessing exact ones from memory isn't reliable.
// A search guarantees current, real results.
export function youtubeSearchLink(vehicle, serviceLabel) {
  const vehicleDesc = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
  const query = [vehicleDesc, serviceLabel, 'how to DIY'].filter(Boolean).join(' ')
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
