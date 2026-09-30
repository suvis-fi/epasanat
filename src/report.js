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

export function whatsAppUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
