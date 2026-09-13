import { Anchor, Container, Group, Text } from '@mantine/core'
import { IconCalendarClock } from '@tabler/icons-react'
import { Link } from 'react-router'
import { brand } from '../theme'

export function Header() {
  return (
    <header className="site-header">
      <Container size="lg" py={18}>
        <Group justify="space-between">
          <Group gap="xs">
            <IconCalendarClock size={20} color={brand[6]} />
            <Text fw={700} size="md">
              Calendar
            </Text>
          </Group>
          <Group gap="xl">
            <Anchor component={Link} to="/book" c="dimmed" fw={500} fz={13}>
              Записаться
            </Anchor>
            <Anchor component={Link} to="/events" c="dimmed" fw={500} fz={13}>
              Предстоящие события
            </Anchor>
          </Group>
        </Group>
      </Container>
    </header>
  )
}
