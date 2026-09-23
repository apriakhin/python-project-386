import { describe, expect, it, vi } from 'vitest'
import { createBooking, getAvailability, listEvents } from './generated'
import { createClient } from './generated/client'

describe('generated Call Calendar client', () => {
  it('calls all three API paths with typed request data', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [], page: 1, pageSize: 20, total: 0, nextPage: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const client = createClient({ baseUrl: 'http://localhost:8000', fetch: fetchMock })

    await getAvailability({ client })
    await listEvents({ client, query: { page: 2 } })
    await createBooking({
      client,
      body: { startAt: '2026-09-23T10:00:00+03:00', name: 'Guest', email: 'guest@example.com' },
    })

    expect(fetchMock.mock.calls.map(([request]) => (request as Request).url)).toEqual([
      'http://localhost:8000/api/availability/',
      'http://localhost:8000/api/events/?page=2',
      'http://localhost:8000/api/bookings/',
    ])
    expect(await (fetchMock.mock.calls[2][0] as Request).text()).toContain('guest@example.com')
  })
})
