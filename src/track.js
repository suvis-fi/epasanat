export function trackEvent(name) {
  try {
    if (!name || !analyticsAllowed()) return
    if (typeof window.gtag === 'function') {
      window.gtag('event', name)
      return
    }
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name })
  } catch {
    /* Seuranta ei saa estää harjoitusta. */
  }
}

function analyticsAllowed() {
  const layer = window.dataLayer
  const hasGtag = typeof window.gtag === 'function'
  const hasLayer = Array.isArray(layer)
  if (!hasGtag && !hasLayer) return false
  if (!hasLayer) return true
  let storage = null
  for (const entry of layer) {
    if (!entry || entry[0] !== 'consent') continue
    const command = entry[1]
    const settings = entry[2]
    if ((command !== 'default' && command !== 'update') || !settings) continue
    if (typeof settings.analytics_storage === 'string') storage = settings.analytics_storage
  }
  if (storage === null) return true
  return storage === 'granted'
}
