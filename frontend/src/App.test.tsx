import { MantineProvider } from '@mantine/core'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'
import { theme } from './theme'

function renderApp(route = '/') {
  return render(
    <MantineProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )
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
  })
})

describe('placeholder pages', () => {
  it('opens the booking page from the call to action', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await user.click(within(screen.getByRole('main')).getByRole('link', { name: /Записаться/ }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Записаться на звонок' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Скоро')).toBeInTheDocument()
  })

  it('shows the upcoming events placeholder', () => {
    renderApp('/events')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Предстоящие события' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Скоро')).toBeInTheDocument()
  })

  it('redirects unknown routes to the landing page', () => {
    renderApp('/unknown')

    expect(screen.getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument()
  })
})
