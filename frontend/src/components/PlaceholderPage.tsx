import { Anchor, Container, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main>
      <Container size="sm" py={80}>
        <Stack gap="md" align="center">
          <Title order={1}>{title}</Title>
          <Text c="dimmed">Скоро</Text>
          <Anchor component={Link} to="/" underline="never">
            На главную
          </Anchor>
        </Stack>
      </Container>
    </main>
  )
}
