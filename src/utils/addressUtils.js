// Address cleaning and deduplicating utility for Sky Fire Crackers

export function cleanAddressDisplay(rawAddress) {
  if (!rawAddress) return 'Tamil Nadu, India'
  if (typeof rawAddress !== 'string') return String(rawAddress)

  // Split by comma
  const parts = rawAddress
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  const seen = new Set()
  const cleanedParts = []
  let detectedPincode = null

  // Pre-scan for 6-digit pincode
  for (let part of parts) {
    const pinMatch = part.match(/\b\d{6}\b/)
    if (pinMatch && !detectedPincode) {
      detectedPincode = pinMatch[0]
    }
  }

  for (let part of parts) {
    // Remove duplicate trailing pincode if already captured
    let cleanPart = part
    const pinMatch = cleanPart.match(/\b\d{6}\b/)
    if (pinMatch) {
      detectedPincode = pinMatch[0]
      cleanPart = cleanPart.replace(/\s*-\s*\d{6}\b/, '').trim()
    }

    const norm = cleanPart.toLowerCase().replace(/[\s\-_]/g, '')
    if (!norm) continue

    if (seen.has(norm)) {
      continue
    }

    seen.add(norm)
    cleanedParts.push(cleanPart)
  }

  let result = cleanedParts.join(', ')

  if (detectedPincode && !result.includes(detectedPincode)) {
    result += ` - ${detectedPincode}`
  }

  // Clean any double dashes or weird formatting
  result = result.replace(/,\s*,/g, ',').replace(/\s*-\s*-\s*/g, ' - ')

  return result || rawAddress
}

export function formatStructuredAddress({ doorNumber, streetName, landmark, area, city, district, pincode, pinCode }) {
  const pin = (pincode || pinCode || '').trim()
  const dist = (district || '').trim()
  const cty = (city || '').trim()
  const lmark = (landmark || area || '').trim()
  const street = (streetName || '').trim()
  const door = (doorNumber || '').trim()

  const parts = []

  // Add door number if not already part of street
  if (door && street && !street.toLowerCase().includes(door.toLowerCase())) {
    parts.push(door)
  } else if (door && !street) {
    parts.push(door)
  }

  if (street) {
    parts.push(street)
  }

  if (lmark && !street.toLowerCase().includes(lmark.toLowerCase())) {
    parts.push(`Landmark: ${lmark}`)
  }

  if (cty && !street.toLowerCase().includes(cty.toLowerCase())) {
    parts.push(cty)
  }

  if (dist && dist.toLowerCase() !== cty.toLowerCase() && !street.toLowerCase().includes(dist.toLowerCase())) {
    parts.push(dist)
  }

  let full = parts.join(', ')
  full = cleanAddressDisplay(full)

  if (pin && !full.includes(pin)) {
    full += ` - ${pin}`
  }

  return full
}
