import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import GamePage from '@/pages/GamePage'
import { useEffect, useState } from 'react'

function App() {
  const [appLoading, setAppLoading] = useState(true)
  useAuth()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Проверяем demo-сессию в localStorage (общий	state между компонентами)
    const stored = localStorage.getItem('logosai_demo_session')
    if (stored) {
      try {
        setSession(JSON.parse(stored))
      } catch {
        // ignore
      }
    }
    setAppLoading(false)
  }, [])

  const isAuthenticated = !!session

  if (appLoading) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/game/:lessonId"
          element={
            isAuthenticated ? <GamePage /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
