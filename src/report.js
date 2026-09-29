export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes === 0) return `${seconds} s`
  if (seconds === 0) return `${minutes} min`
  return `${minutes} min ${seconds} s`
}

export function formatDay(date) {
  return new Intl.DateTimeFormat('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function positiveLine(calm, accurate) {
  if (calm && accurate) return 'Rauhallinen ja tarkka harjoittelu.'
  if (accurate) return 'Tarkka lukeminen.'
  if (calm) return 'Rauhallinen harjoittelu.'
  return 'Harjoitus tehty loppuun. Hyvä.'
}

export function buildReport({
  day,
  durationLabel,
  levelName,
  correct,
  total,
  pct,
  xp,
  calm,
  accurate,
  nextLabel,
}) {
  const lines = [
    `Epäsanat ${day}`,
    '',
    `Harjoitus kesti ${durationLabel}.`,
    `Taso: ${levelName}`,
    `Oikein ${correct}/${total} (${pct} %)`,
    `XP tästä harjoituksesta: +${xp}`,
    '',
    positiveLine(calm, accurate),
    '',
    'Vinkki kotiin: lukekaa yhdessä 3 epäsanaa.',
  ]
  if (nextLabel) lines.push('', `Seuraava kerta: ${nextLabel}`)
  return lines.join('\n')
}

export function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (!digits) return ''
  if (digits.startsWith('3580')) return `358${digits.slice(4)}`
  if (digits.startsWith('358')) return digits
  if (digits.startsWith('0')) return `358${digits.slice(1)}`
  return digits
}

export function whatsAppUrl(text, phone) {
  const digits = normalizePhone(phone)
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}
