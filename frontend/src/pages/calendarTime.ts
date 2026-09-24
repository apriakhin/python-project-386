const zone = 'Europe/Moscow'

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: zone, day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00+03:00`))
}

export function timeLabel(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function interval(start: string, end: string) {
  return `${dateLabel(start.slice(0, 10))}, ${timeLabel(start)}–${timeLabel(end)} (Москва)`
}
