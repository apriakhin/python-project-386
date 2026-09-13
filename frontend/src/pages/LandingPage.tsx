import { Badge, Button, Card, Container, List, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { Link } from 'react-router'

const features = [
  'Фиксированные 30-минутные слоты с 09:00 до 18:00.',
  'Проверка конфликта при бронировании.',
  'Просмотр предстоящих событий в отдельном разделе.',
]

export function LandingPage() {
  return (
    <main className="landing">
      <Container size="lg" py={{ base: 32, sm: 56 }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48} verticalSpacing={32}>
          <Stack gap={24} align="flex-start" maw={560}>
            <Badge
              variant="filled"
              size="lg"
              radius="md"
              tt="uppercase"
              fw={600}
              fz={12}
              bg="#F8FAFC"
              c="#637288"
              style={{ border: '1px solid #D8DFE9' }}
            >
              Быстрая запись на звонок
            </Badge>
            <Title order={1} fz={{ base: 40, sm: 48 }} lh={1} fw={700} style={{ letterSpacing: '-2.4px' }}>
              Calendar
            </Title>
            <Text fz={17} lh={1.65} c="dimmed">
              Один экран, понятные слоты, быстрая бронь. Выберите время и запишитесь на звонок без
              лишних шагов.
            </Text>
            <Button
              component={Link}
              to="/book"
              size="lg"
              radius="md"
              h={48}
              fz={14}
              px={24}
              rightSection={<IconArrowRight size={20} />}
            >
              Записаться
            </Button>
          </Stack>
          <Card
            withBorder
            radius="lg"
            p={25}
            shadow="sm"
            bg="#FEFBF9"
            style={{ borderColor: '#D8DFE9' }}
          >
            <Title order={3} fz={20} mb="md">
              Что доступно прямо сейчас
            </Title>
            <List size="sm" spacing={14} c="dimmed" fz={13}>
              {features.map((feature) => (
                <List.Item key={feature}>{feature}</List.Item>
              ))}
            </List>
          </Card>
        </SimpleGrid>
      </Container>
    </main>
  )
}
