import { Navigate, Route, Routes } from 'react-router'
import './App.css'
import { Header } from './components/Header'
import { BookingPage } from './pages/BookingPage'
import { EventsPage } from './pages/EventsPage'
import { LandingPage } from './pages/LandingPage'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
