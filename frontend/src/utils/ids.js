// Utility to produce a display code for a user as <PREFIX><6 digits>
// Prefixes: Owner -> OW, Admin -> AD, Buyer -> BU
// We derive a stable 6-digit number from a string seed (e.g., ObjectId, email)
export function formatUserCode(role, seed) {
  const prefixes = { owner: 'OW', admin: 'AD', buyer: 'BU' }
  const prefix = prefixes[String(role || '').toLowerCase()] || 'ID'
  const n = hashTo6Digits(String(seed || 'unknown'))
  return `${prefix}${n}`
}

function hashTo6Digits(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  const six = (h % 1000000).toString().padStart(6, '0')
  return six
}
