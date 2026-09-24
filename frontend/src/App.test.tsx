import { MantineProvider } from '@mantine/core'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { theme } from './theme'

const api = vi.hoisted(() => ({ getAvailability: vi.fn(), createBooking: vi.fn(), listEvents: vi.fn() }))
vi.mock('./api/generated/sdk.gen', () => api)

beforeEach(() => {
  api.getAvailability.mockReset().mockResolvedValue({ data: { timezone: 'Europe/Moscow', dates: [
    { date: '2026-09-24', slots: [{ startAt: '2026-09-24T10:00:00+03:00', endAt: '2026-09-24T10:30:00+03:00', status: 'available' }, { startAt: '2026-09-24T10:30:00+03:00', endAt: '2026-09-24T11:00:00+03:00', status: 'busy' }] },
    { date: '2026-09-25', slots: [] },
  ] } })
  api.createBooking.mockReset().mockResolvedValue({ data: { id: '1', name: 'Guest', email: 'guest@example.com', startAt: '2026-09-24T10:00:00+03:00', endAt: '2026-09-24T10:30:00+03:00', createdAt: '2026-09-23T10:00:00+03:00' } })
  api.listEvents.mockReset().mockResolvedValue({ data: { items: [], page: 1, pageSize: 20, total: 0, nextPage: null } })
})

afterEach(() => vi.unstubAllGlobals())

function renderApp(route = '/') {
  return render(
    <MantineProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )
}

function observeEventsEnteringViewport() {
  let enterViewport = () => {}
  const observe = vi.fn()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) {
      enterViewport = () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
    observe = observe
    disconnect = vi.fn()
  })
  return { observe, enterViewport: () => act(() => enterViewport()) }
}

describe('landing page', () => {
  it('presents the service and the slots available for booking', () => {
    renderApp('/')

    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument()
    expect(within(main).getByText('Что доступно прямо сейчас')).toBeInTheDocument()
    expect(
      within(main).getByText('Фиксированные 30-минутные слоты с 09:00 до 18:00.'),
    ).toBeInTheDocument()
    expect(within(main).getByText('Проверка конфликта при бронировании.')).toBeInTheDocument()
    expect(
      within(main).getByText('Просмотр предстоящих событий в отдельном разделе.'),
    ).toBeInTheDocument()
  })

  it('links the call to action to the booking page', () => {
    renderApp('/')

    const main = screen.getByRole('main')
    expect(within(main).getByRole('link', { name: /Записаться/ })).toHaveAttribute('href', '/book')
  })

  it('links the navigation to the booking and upcoming pages', () => {
    renderApp('/')

    const header = screen.getByRole('banner')
    expect(within(header).getByRole('link', { name: /Записаться/ })).toHaveAttribute(
      'href',
      '/book',
    )
    expect(within(header).getByRole('link', { name: 'Предстоящие события' })).toHaveAttribute(
      'href',
      '/events',
    )
    expect(within(header).getByRole('link', { name: 'Calendar' })).toHaveAttribute('href', '/')
  })

  it('returns to the landing page when the logo is clicked', async () => {
    const user = userEvent.setup()
    renderApp('/events')

    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Calendar' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument()
  })
})

describe('calendar pages', () => {
  it('opens the booking page from the call to action', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await user.click(within(screen.getByRole('main')).getByRole('link', { name: /Записаться/ }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на звонок' }),
    ).toBeInTheDocument()
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Записаться' })).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByText('Выберите дату в календаре.')).toBeInTheDocument()
  })

  it('books an available slot, preserving fields when changing the selection', async () => {
    const user = userEvent.setup()
    renderApp('/book')
    await user.click(await screen.findByRole('button', { name: /24 сентября/ }))
    expect(screen.getByRole('button', { name: /10:30.*Занято/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /10:00.*Свободно/ }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    await user.type(screen.getByRole('textbox', { name: 'Имя' }), 'Guest')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'guest@example.com')
    await user.click(screen.getByRole('button', { name: 'Изменить' }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    expect(screen.getByRole('textbox', { name: 'Имя' })).toHaveValue('Guest')
    await user.click(screen.getByRole('button', { name: 'Подтвердить запись' }))
    expect(await screen.findByText('Бронь подтверждена. До встречи!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Забронировать еще' }))
    expect(await screen.findByText('Выберите дату в календаре.')).toBeInTheDocument()
  })

  it('shows required field errors beside the form without losing entered data', async () => {
    const user = userEvent.setup()
    renderApp('/book')
    await user.click(await screen.findByRole('button', { name: /24 сентября/ }))
    await user.click(screen.getByRole('button', { name: /10:00.*Свободно/ }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    await user.type(screen.getByRole('textbox', { name: 'Имя' }), '  ')
    await user.click(screen.getByRole('button', { name: 'Подтвердить запись' }))
    expect(screen.getByText('Введите имя (до 255 символов)')).toBeInTheDocument()
    expect(screen.getByText('Введите корректный email')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Имя' })).toHaveValue('  ')
    expect(api.createBooking).not.toHaveBeenCalled()
  })

  it('shows a monthly calendar, selection summary and only allows dates inside the booking window', async () => {
    const user = userEvent.setup()
    renderApp('/book')
    expect(await screen.findByText('сентябрь 2026 г.')).toBeInTheDocument()
    expect(screen.getByText('Дата не выбрана')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Предыдущий месяц' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /23 сентября/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /24 сентября/ }))
    expect(screen.getByRole('button', { name: /10:00.*Свободно/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /10:00.*Свободно/ }))
    expect(screen.getByText('30 мин')).toBeInTheDocument()
  })

  it('moves between months within the booking window', async () => {
    api.getAvailability.mockResolvedValueOnce({ data: { timezone: 'Europe/Moscow', dates: [
      { date: '2026-09-30', slots: [] },
      { date: '2026-10-01', slots: [{ startAt: '2026-10-01T09:00:00+03:00', endAt: '2026-10-01T09:30:00+03:00', status: 'available' }] },
    ] } })
    const user = userEvent.setup()
    renderApp('/book')
    await user.click(await screen.findByRole('button', { name: 'Следующий месяц' }))
    expect(screen.getByText('октябрь 2026 г.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Следующий месяц' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /^1 октября —/ }))
    expect(screen.getByRole('button', { name: /09:00.*Свободно/ })).toBeInTheDocument()
  })

  it('shows the new booking month after a conflict refresh crosses a month boundary', async () => {
    api.getAvailability.mockResolvedValueOnce({ data: { timezone: 'Europe/Moscow', dates: [
      { date: '2026-09-30', slots: [] },
      { date: '2026-10-31', slots: [{ startAt: '2026-10-31T09:00:00+03:00', endAt: '2026-10-31T09:30:00+03:00', status: 'available' }] },
    ] } }).mockResolvedValueOnce({ data: { timezone: 'Europe/Moscow', dates: [
      { date: '2026-11-01', slots: [{ startAt: '2026-11-01T09:00:00+03:00', endAt: '2026-11-01T09:30:00+03:00', status: 'available' }] },
    ] } })
    api.createBooking.mockResolvedValueOnce({ response: { status: 409 }, error: { code: 'SLOT_UNAVAILABLE' } })
    const user = userEvent.setup()
    renderApp('/book')
    await user.click(await screen.findByRole('button', { name: 'Следующий месяц' }))
    await user.click(await screen.findByRole('button', { name: /31 октября/ }))
    await user.click(screen.getByRole('button', { name: /09:00.*Свободно/ }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    await user.type(screen.getByRole('textbox', { name: 'Имя' }), 'Guest')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'guest@example.com')
    await user.click(screen.getByRole('button', { name: 'Подтвердить запись' }))
    expect(await screen.findByRole('button', { name: /^1 ноября —/ })).toBeEnabled()
    expect(screen.getByText('ноябрь 2026 г.')).toBeInTheDocument()
  })

  it('shows an empty availability state without enabling booking', async () => {
    api.getAvailability.mockResolvedValueOnce({ data: { timezone: 'Europe/Moscow', dates: [
      { date: '2026-09-24', slots: [] },
    ] } })
    renderApp('/book')
    expect(await screen.findByText('Свободных слотов пока нет')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
  })

  it('shows upcoming events empty state', async () => {
    renderApp('/events')

    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Предстоящие события' })).toHaveAttribute('aria-current', 'page')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Предстоящие события' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Предстоящих событий пока нет')).toBeInTheDocument()
  })

  it('lets visitors retry when upcoming events fail to load', async () => {
    api.listEvents.mockRejectedValueOnce(new Error('network'))
    const user = userEvent.setup()
    renderApp('/events')
    expect(await screen.findByText('Не удалось загрузить события')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByText('Предстоящих событий пока нет')).toBeInTheDocument()
  })

  it('recovers from a slot conflict with the guest fields intact', async () => {
    api.createBooking.mockResolvedValueOnce({ response: { status: 409 }, error: { code: 'SLOT_UNAVAILABLE' } })
    const user = userEvent.setup()
    renderApp('/book')
    await user.click(await screen.findByRole('button', { name: /24 сентября/ }))
    await user.click(screen.getByRole('button', { name: /10:00.*Свободно/ }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    await user.type(screen.getByRole('textbox', { name: 'Имя' }), 'Guest')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'guest@example.com')
    await user.click(screen.getByRole('button', { name: 'Подтвердить запись' }))
    expect(await screen.findByText(/больше недоступно/)).toBeInTheDocument()
    expect(api.getAvailability).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: /24 сентября/ }))
    await user.click(screen.getByRole('button', { name: /10:00.*Свободно/ }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    expect(screen.getByRole('textbox', { name: 'Имя' })).toHaveValue('Guest')
  })

  it('loads more events as they scroll into view without replacing existing cards', async () => {
    const firstEvent = { id: '1', name: 'First Guest', email: 'first@example.com', startAt: '2026-09-24T10:00:00+03:00', endAt: '2026-09-24T10:30:00+03:00', createdAt: '2026-09-23T09:00:00+03:00' }
    const secondEvent = { ...firstEvent, id: '2', name: 'Second Guest', email: 'second@example.com' }
    api.listEvents.mockResolvedValueOnce({ data: { items: [firstEvent], page: 1, pageSize: 20, total: 21, nextPage: 2 } })
      .mockResolvedValueOnce({ data: { items: [secondEvent], page: 2, pageSize: 20, total: 21, nextPage: null } })
    const { observe, enterViewport } = observeEventsEnteringViewport()
    renderApp('/events')
    expect(await screen.findByText('first@example.com')).toBeInTheDocument()
    expect(screen.getByText(/Создано: 23 сентября/)).toBeInTheDocument()
    await waitFor(() => expect(observe).toHaveBeenCalled())
    enterViewport()
    expect(await screen.findByText('second@example.com')).toBeInTheDocument()
    expect(screen.getByText('first@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Далее' })).not.toBeInTheDocument()
    expect(api.listEvents).toHaveBeenCalledWith({ query: { page: 2 } })
    expect(api.listEvents).toHaveBeenCalledTimes(2)
  })

  it('preserves loaded cards and retries the failed lazy load', async () => {
    const firstEvent = { id: '1', name: 'First Guest', email: 'first@example.com', startAt: '2026-09-24T10:00:00+03:00', endAt: '2026-09-24T10:30:00+03:00', createdAt: '2026-09-23T09:00:00+03:00' }
    api.listEvents.mockResolvedValueOnce({ data: { items: [firstEvent], page: 1, pageSize: 20, total: 21, nextPage: 2 } })
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: { items: [{ ...firstEvent, id: '2', name: 'Second Guest', email: 'second@example.com' }], page: 2, pageSize: 20, total: 21, nextPage: null } })
    const { observe, enterViewport } = observeEventsEnteringViewport()
    const user = userEvent.setup()
    renderApp('/events')
    await waitFor(() => expect(observe).toHaveBeenCalled())
    enterViewport()
    expect(await screen.findByText('Не удалось загрузить события')).toBeInTheDocument()
    expect(screen.getByText('first@example.com')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByText('second@example.com')).toBeInTheDocument()
    expect(screen.getByText('first@example.com')).toBeInTheDocument()
    expect(api.listEvents).toHaveBeenNthCalledWith(3, { query: { page: 2 } })
  })

  it('loads more automatically when IntersectionObserver is unavailable', async () => {
    const firstEvent = { id: '1', name: 'First Guest', email: 'first@example.com', startAt: '2026-09-24T10:00:00+03:00', endAt: '2026-09-24T10:30:00+03:00', createdAt: '2026-09-23T09:00:00+03:00' }
    api.listEvents.mockResolvedValueOnce({ data: { items: [firstEvent], page: 1, pageSize: 20, total: 21, nextPage: 2 } })
      .mockResolvedValueOnce({ data: { items: [{ ...firstEvent, id: '2', email: 'second@example.com' }], page: 2, pageSize: 20, total: 21, nextPage: null } })
    vi.stubGlobal('IntersectionObserver', undefined)
    renderApp('/events')
    expect(await screen.findByText('first@example.com')).toBeInTheDocument()
    act(() => window.dispatchEvent(new Event('scroll')))
    expect(await screen.findByText('second@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Загрузить ещё' })).not.toBeInTheDocument()
  })

  it('keeps the form and fields after a failed submission for retry', async () => {
    api.createBooking.mockRejectedValueOnce(new Error('network'))
    const user = userEvent.setup()
    renderApp('/book')
    await user.click(await screen.findByRole('button', { name: /24 сентября/ }))
    await user.click(screen.getByRole('button', { name: /10:00.*Свободно/ }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    await user.type(screen.getByRole('textbox', { name: 'Имя' }), 'Guest')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'guest@example.com')
    await user.click(screen.getByRole('button', { name: 'Подтвердить запись' }))
    expect(await screen.findByText(/Не удалось создать бронь/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('guest@example.com')
    await user.click(screen.getByRole('button', { name: 'Подтвердить запись' }))
    expect(await screen.findByText('Бронь подтверждена. До встречи!')).toBeInTheDocument()
  })

  it('hides stale slots after a conflict until availability can be reloaded', async () => {
    api.createBooking.mockResolvedValueOnce({ response: { status: 409 }, error: { code: 'SLOT_UNAVAILABLE' } })
    const user = userEvent.setup()
    renderApp('/book')
    await user.click(await screen.findByRole('button', { name: /24 сентября/ }))
    await user.click(screen.getByRole('button', { name: /10:00.*Свободно/ }))
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))
    await user.type(screen.getByRole('textbox', { name: 'Имя' }), 'Guest')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'guest@example.com')
    api.getAvailability.mockRejectedValueOnce(new Error('network'))
    await user.click(screen.getByRole('button', { name: 'Подтвердить запись' }))
    expect(await screen.findByRole('button', { name: 'Повторить загрузку' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /10:00.*Свободно/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }))
    expect(await screen.findByRole('button', { name: /24 сентября/ })).toBeInTheDocument()
  })

  it('redirects unknown routes to the landing page', () => {
    renderApp('/unknown')

    expect(screen.getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument()
  })
})
