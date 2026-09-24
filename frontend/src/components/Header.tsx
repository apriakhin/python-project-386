import { Anchor, Container, Group, Text } from '@mantine/core'
import { IconCalendarClock } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router'
import { brand } from '../theme'

export function Header() {
  const { pathname } = useLocation()
  return (
    <header className="site-header">
      <Container size="lg" py={12}>
        <Group justify="space-between">
          <Link to="/" className="site-brand">
            <IconCalendarClock size={20} color={brand[6]} />
            <Text fw={700} size="md">
              Calendar
            </Text>
          </Link>
          <Group gap="xs">
            <Anchor component={Link} to="/book" underline="never" className={`site-nav-link${pathname === '/book' ? ' site-nav-active' : ''}`} aria-current={pathname === '/book' ? 'page' : undefined} fw={500} fz={13}>
              Записаться
            </Anchor>
            <Anchor component={Link} to="/events" underline="never" className={`site-nav-link${pathname === '/events' ? ' site-nav-active' : ''}`} aria-current={pathname === '/events' ? 'page' : undefined} fw={500} fz={13}>
              Предстоящие события
            </Anchor>
          </Group>
        </Group>
      </Container>
    </header>
  )
}
