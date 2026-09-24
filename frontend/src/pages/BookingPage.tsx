import { Alert, Button, Container, Grid, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { createBooking, getAvailability } from '../api/generated/sdk.gen'
import type { Availability, AvailabilityDate, Event, Slot } from '../api/generated/types.gen'
import { dateLabel, interval, timeLabel } from './calendarTime'

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function monthDays(month: string) {
  const [year, number] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year, number - 1, 1))
  const mondayOffset = (first.getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(Date.UTC(year, number - 1, index - mondayOffset + 1))
    return { date: day.toISOString().slice(0, 10), day: day.getUTCDate(), otherMonth: day.getUTCMonth() !== number - 1 }
  })
}

function changeMonth(month: string, offset: number) {
  const [year, number] = month.split('-').map(Number)
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7)
}

function BookingSummary({ date, slot, free, durationMinutes }: { date: string | null, slot: Slot | null, free: number, durationMinutes: number | null }) {
  const facts = [
    ['Выбранная дата', date ? new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00+03:00`)) : 'Дата не выбрана'],
    ['Выбранное время', slot ? `${timeLabel(slot.startAt)} – ${timeLabel(slot.endAt)} (Москва)` : 'Время не выбрано'],
    ['Свободно', String(free)],
    ['Длительность в дне', date && durationMinutes ? `${durationMinutes} мин` : 'Нет слотов на этот день'],
  ]
  return <Paper withBorder radius="lg" p="lg" h="100%" className="booking-card booking-summary">
    <Title order={2}>Информация</Title>
    <Stack gap={12} mt="md">
      {facts.map(([label, value]) => <div className="booking-fact" key={label}>
        <Text size="sm" c="dimmed">{label}</Text>
        <Text size="sm" fw={600}>{value}</Text>
      </div>)}
    </Stack>
  </Paper>
}

function CalendarGrid({ dates, selected, month, onSelect, onMonth }: {
  dates: AvailabilityDate[], selected: string | null, month: string,
  onSelect: (date: string) => void, onMonth: (month: string) => void,
}) {
  const firstMonth = dates[0].date.slice(0, 7)
  const lastMonth = dates[dates.length - 1].date.slice(0, 7)
  const byDate = new Map(dates.map((item) => [item.date, item]))
  const [year, number] = month.split('-').map(Number)
  const title = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, number - 1, 1)))

  return <Paper withBorder radius="lg" p="lg" h="100%" className="booking-card booking-calendar">
    <Group justify="space-between" align="center" mb="lg">
      <Title order={2}>Календарь</Title>
      <Group gap="xs">
        <Button variant="default" className="month-arrow" aria-label="Предыдущий месяц" disabled={month <= firstMonth} onClick={() => onMonth(changeMonth(month, -1))}>←</Button>
        <Button variant="default" className="month-arrow" aria-label="Следующий месяц" disabled={month >= lastMonth} onClick={() => onMonth(changeMonth(month, 1))}>→</Button>
      </Group>
    </Group>
    <Text size="sm" fw={600} mb="md">{title}</Text>
    <div className="calendar-grid">
      {weekdays.map((day) => <Text className="calendar-weekday" size="xs" fw={600} key={day}>{day}</Text>)}
      {monthDays(month).map((day) => {
        const entry = byDate.get(day.date)
        const free = entry?.slots.filter((item) => item.status === 'available').length ?? 0
        return <button key={day.date} type="button" className={`calendar-day${day.otherMonth ? ' calendar-day-outside' : ''}${selected === day.date ? ' calendar-day-selected' : ''}`}
          aria-label={`${dateLabel(day.date)}${entry ? ` — ${free} св.` : ''}`} aria-pressed={selected === day.date}
          disabled={!free} onClick={() => onSelect(day.date)}>
          <span>{day.day}</span>{free > 0 && <small>{free} св.</small>}
        </button>
      })}
    </div>
  </Paper>
}

export function BookingPage() {
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [month, setMonth] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'form' | 'success'>('select')
  const [event, setEvent] = useState<Event | null>(null)
  const [bookedFree, setBookedFree] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (active: () => boolean = () => true) => {
    setLoading(true)
    setAvailability(null)
    try {
      const response = await getAvailability()
      if (!active()) return
      if (response.data) setAvailability(response.data)
      else setNotice('Не удалось загрузить доступность. Попробуйте ещё раз.')
    } catch {
      if (active()) setNotice('Не удалось загрузить доступность. Попробуйте ещё раз.')
    } finally {
      if (active()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) void refresh(() => active) })
    return () => { active = false }
  }, [refresh])

  const chosenDate = availability?.dates.find((item) => item.date === date)
  const free = chosenDate?.slots.filter((item) => item.status === 'available').length ?? 0
  const hasFree = availability?.dates.some((item) => item.slots.some((entry) => entry.status === 'available'))
  const firstMonth = availability?.dates[0]?.date.slice(0, 7)
  const lastMonth = availability?.dates[availability.dates.length - 1]?.date.slice(0, 7)
  const displayedMonth = firstMonth && lastMonth && month && month >= firstMonth && month <= lastMonth
    ? month : firstMonth

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!slot || sending) return
    const fieldErrors: Record<string, string> = {}
    if (!name.trim() || name.trim().length > 255) fieldErrors.name = 'Введите имя (до 255 символов)'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fieldErrors.email = 'Введите корректный email'
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) return
    setSending(true)
    setNotice('')
    try {
      const response = await createBooking({ body: { startAt: slot.startAt, name: name.trim(), email } })
      if (response.data) {
        setBookedFree(Math.max(free - 1, 0))
        setEvent(response.data)
        setStep('success')
      } else if (response.response?.status === 409 || response.error?.code === 'SLOT_UNAVAILABLE') {
        setNotice('Выбранное время больше недоступно. Выберите другой слот.')
        setSlot(null)
        setDate(null)
        setStep('select')
        await refresh()
      } else {
        if (response.error?.code === 'INVALID_REQUEST') {
          setErrors(Object.fromEntries(Object.entries(response.error.fieldErrors ?? {}).map(([key, messages]) => [key, messages.join(', ')])))
        }
        setNotice('Не удалось создать бронь. Попробуйте ещё раз.')
      }
    } catch {
      setNotice('Не удалось создать бронь. Попробуйте ещё раз.')
    } finally {
      setSending(false)
    }
  }

  const summaryDate = step === 'success' && event ? event.startAt.slice(0, 10) : date
  const summarySlot = step === 'success' && event ? { startAt: event.startAt, endAt: event.endAt, status: 'busy' as const } : slot
  const durationSlot = summarySlot ?? chosenDate?.slots[0]
  const durationMinutes = durationSlot
    ? Math.round((Date.parse(durationSlot.endAt) - Date.parse(durationSlot.startAt)) / 60_000)
    : null

  return <main className="calendar-page"><Container size="lg" py={{ base: 32, sm: 40 }}>
    <Title order={1} className="calendar-title">Запись на звонок</Title>
    {notice && <Alert color="red" role="alert" mb="md">{notice}</Alert>}
    <Grid gap="lg" align="stretch">
      <Grid.Col span={step === 'select' ? { base: 12, sm: 6, lg: 3 } : { base: 12, sm: 6 }}>
        <BookingSummary date={summaryDate} slot={summarySlot} free={step === 'success' ? bookedFree : free} durationMinutes={durationMinutes} />
      </Grid.Col>
      {step === 'select' ? <>
        {availability && displayedMonth && <Grid.Col span={{ base: 12, sm: 6, lg: 5 }}>
          <CalendarGrid dates={availability.dates} selected={date} month={displayedMonth}
            onMonth={setMonth} onSelect={(value) => { setDate(value); setSlot(null) }} />
        </Grid.Col>}
        <Grid.Col span={availability ? { base: 12, lg: 4 } : { base: 12, sm: 6, lg: 9 }}>
          <Paper withBorder radius="lg" p="lg" h="100%" className="booking-card booking-status">
          <Title order={2}>Статус слотов</Title>
          {loading && <Text className="slot-prompt" mt="md">Загрузка доступности…</Text>}
          {!loading && !availability && <Button mt="md" onClick={() => { setNotice(''); void refresh() }}>Повторить загрузку</Button>}
          {availability && !hasFree && <Text className="slot-prompt" mt="md">Свободных слотов пока нет</Text>}
          {availability && !date && hasFree && <Text className="slot-prompt" mt="md">Выберите дату в календаре.</Text>}
          {chosenDate && <div className="slot-list" aria-label="Время на выбранную дату">
            {chosenDate.slots.length === 0 && <Text className="slot-prompt">Нет слотов на этот день</Text>}
            {chosenDate.slots.map((item) => <button key={item.startAt} type="button" className={`slot-option${slot?.startAt === item.startAt ? ' slot-option-selected' : ''}`}
              disabled={item.status === 'busy'} aria-pressed={slot?.startAt === item.startAt} onClick={() => setSlot(item)}>
              <span>{timeLabel(item.startAt)}–{timeLabel(item.endAt)}</span><strong>{item.status === 'busy' ? 'Занято' : 'Свободно'}</strong>
            </button>)}
          </div>}
          <Group className="booking-actions" grow>
            <Button component={Link} to="/" variant="default">Назад</Button>
            <Button disabled={!slot} onClick={() => { setNotice(''); setStep('form') }}>Продолжить</Button>
          </Group>
          </Paper>
        </Grid.Col>
      </> : step === 'form' && slot ? <Grid.Col span={{ base: 12, sm: 6 }}><Paper withBorder radius="lg" p="lg" h="100%" className="booking-card">
        <form noValidate onSubmit={(e) => { void submit(e) }}><Stack gap="md">
          <Group justify="space-between" align="center"><Title order={2}>Подтверждение записи</Title><Button variant="default" onClick={() => setStep('select')}>Изменить</Button></Group>
          <Text size="sm" c="dimmed">{interval(slot.startAt, slot.endAt)}</Text>
          <TextInput label="Имя" placeholder="Имя" required value={name} error={errors.name} onChange={(e) => setName(e.currentTarget.value)} />
          <TextInput label="Email" placeholder="Email" required value={email} error={errors.email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <Button type="submit" loading={sending} fullWidth>Подтвердить запись</Button>
        </Stack></form>
      </Paper></Grid.Col> : event && <Grid.Col span={{ base: 12, sm: 6 }}><Paper withBorder radius="lg" p="lg" h="100%" className="booking-card booking-success"><Stack>
        <Title order={2} ta="center">Бронь подтверждена. До встречи!</Title>
        <Text ta="center">{interval(event.startAt, event.endAt)}</Text>
        <Button fullWidth onClick={() => { setName(''); setEmail(''); setSlot(null); setDate(null); setMonth(null); setErrors({}); setEvent(null); setNotice(''); setStep('select'); void refresh() }}>Забронировать еще</Button>
      </Stack></Paper></Grid.Col>}
    </Grid>
  </Container></main>
}
