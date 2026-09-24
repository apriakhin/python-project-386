import { Alert, Button, Container, Paper, Stack, Text, Title } from '@mantine/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { listEvents } from '../api/generated/sdk.gen'
import type { Event } from '../api/generated/types.gen'
import { dateLabel, interval, timeLabel } from './calendarTime'

export function EventsPage() {
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [items, setItems] = useState<Event[]>([])
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const requestInFlight = useRef(false)

  useEffect(() => {
    let active = true
    listEvents({ query: { page } }).then((response) => {
      if (!active) return
      const data = response.data
      if (data) {
        setItems((current) => {
          const seen = new Set(current.map((item) => item.id))
          return [...current, ...data.items.filter((item) => !seen.has(item.id))]
        })
        setNextPage(data.nextPage)
        setLoaded(true)
        setError(false)
      } else setError(true)
    }).catch(() => { if (active) setError(true) })
      .finally(() => {
        if (active) {
          setLoading(false)
          requestInFlight.current = false
        }
      })
    return () => { active = false }
  }, [page, retry])

  const loadNextPage = useCallback(() => {
    if (nextPage === null || requestInFlight.current) return
    requestInFlight.current = true
    setLoading(true)
    setPage(nextPage)
  }, [nextPage])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || loading || error) return
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) loadNextPage()
      }, { rootMargin: '240px' })
      observer.observe(target)
      return () => observer.disconnect()
    }

    const checkPosition = () => {
      if (target.getBoundingClientRect().top <= window.innerHeight + 240) loadNextPage()
    }
    window.addEventListener('scroll', checkPosition, { passive: true })
    window.addEventListener('resize', checkPosition)
    const timer = window.setTimeout(checkPosition, 0)
    return () => {
      window.removeEventListener('scroll', checkPosition)
      window.removeEventListener('resize', checkPosition)
      window.clearTimeout(timer)
    }
  }, [nextPage, loading, error, loadNextPage])

  return <main className="calendar-page"><Container size="lg" py={{ base: 32, sm: 40 }}><Stack gap="md">
    <Title order={1} className="calendar-title">Предстоящие события</Title>
    {items.map((event) => <Paper withBorder radius="lg" p="lg" className="event-card" key={event.id}><Stack gap={4}>
      <Text fw={700} size="sm">{event.name}</Text>
      <Text size="sm" c="dimmed">{event.email}</Text>
      <Text size="sm" c="dimmed">Слот: {interval(event.startAt, event.endAt)}</Text>
      <Text size="sm" c="dimmed">Создано: {dateLabel(event.createdAt.slice(0, 10))}, {timeLabel(event.createdAt)} (Москва)</Text>
    </Stack></Paper>)}
    {loaded && items.length === 0 && !error && <Text>Предстоящих событий пока нет</Text>}
    {error && <Alert color="red">Не удалось загрузить события <Button variant="light" size="xs" ml="sm" onClick={() => { requestInFlight.current = true; setLoading(true); setError(false); setRetry((current) => current + 1) }}>Повторить</Button></Alert>}
    {loading && <Text role="status" c="dimmed">Загрузка событий…</Text>}
    {nextPage !== null && !error && <div ref={loadMoreRef} aria-hidden="true" />}
  </Stack></Container></main>
}
