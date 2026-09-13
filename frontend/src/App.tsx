import { Badge, Container, MantineProvider, Paper, Stack, Text, Title } from '@mantine/core'
import './App.css'

function App() {
  return (
    <MantineProvider>
      <main className="page">
        <Container size="sm">
          <Paper className="intro" radius="lg" p={{ base: 'xl', sm: 48 }}>
            <Stack gap="lg" align="flex-start">
              <Badge color="teal" variant="light" size="lg">
                Основа готова
              </Badge>
              <Title order={1}>Календарь звонков</Title>
              <Text size="lg" c="dimmed" maw={560}>
                Сервис для удобного выбора времени и бронирования звонков.
              </Text>
            </Stack>
          </Paper>
        </Container>
      </main>
    </MantineProvider>
  )
}

export default App
