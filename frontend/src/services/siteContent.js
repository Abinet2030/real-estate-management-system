const STORAGE_KEY = 'relstate:site-page-copy'

export const defaultPageCopy = {
  home: { kicker: 'A clearer way to find home', title: 'Find a place that feels right.', description: 'Explore trusted homes, apartments, land, and commercial spaces—all in one considered marketplace.', heroImage: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&w=2200&q=90' },
  about: { kicker: 'About Relstate', title: 'A more considered way to move property forward.', description: 'Relstate brings buyers and property owners together through a simpler, clearer marketplace experience.' },
  contact: { kicker: 'Relstate support', title: 'We’re here to make your next move easier.', description: 'Questions about a listing, your account, or using the platform? Send us a note and we’ll point you in the right direction.' },
}

export function getPageCopy(page) {
  try { return { ...defaultPageCopy[page], ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[page] || {}) } } catch { return defaultPageCopy[page] }
}

export function savePageCopy(page, copy) {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, [page]: copy }))
}
