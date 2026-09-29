export function resolveWhen(choice, customDate, customTime, now = new Date()) {
  if (choice === 'tomorrow' || choice === 'in2') {
    const date = new Date(now)
    date.setDate(date.getDate() + (choice === 'tomorrow' ? 1 : 2))
    date.setSeconds(0, 0)
    return date
  }
  if (choice === 'custom') {
    if (!customDate || !customTime) return null
    const date = new Date(`${customDate}T${customTime}`)
    if (Number.isNaN(date.getTime())) return null
    return date
  }
  return null
}

export function isFuture(date, now = new Date()) {
  return date instanceof Date && !Number.isNaN(date.getTime()) && date.getTime() > now.getTime() - 60_000
}

export function formatWhen(date) {
  return new Intl.DateTimeFormat('fi-FI', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function toDateInput(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toTimeInput(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function googleCalendarUrl(date) {
  const end = new Date(date.getTime() + 5 * 60 * 1000)
  const stamp = (value) => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Epäsanat 3 min',
    dates: `${stamp(date)}/${stamp(end)}`,
    details: 'Lyhyt harjoitus epäsanojen lukemiseen.',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

export function icsContent(date) {
  const end = new Date(date.getTime() + 5 * 60 * 1000)
  const stamp = (value) => {
    const pad = (part) => String(part).padStart(2, '0')
    return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}T${pad(value.getHours())}${pad(value.getMinutes())}${pad(value.getSeconds())}`
  }
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Epäsanat//FI',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${stamp(date)}`,
    `DTEND:${stamp(end)}`,
    'SUMMARY:Epäsanat 3 min',
    'DESCRIPTION:Lyhyt harjoitus epäsanojen lukemiseen.',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
