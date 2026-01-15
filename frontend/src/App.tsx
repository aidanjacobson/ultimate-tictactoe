declare global {
    interface Window {
      __BASE_URL__?: string;
    }
}

import { useEffect } from 'react'
import { useLocation, useNavigate, BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import AppLayout from './Components/shared/AppLayout/AppLayout'
import ApiService from './services/ApiService'
import './App.css'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if on public pages (login or invite join)
    const isPublicPage = location.pathname === '/login' || location.pathname.startsWith('/j')
    
    if (!isPublicPage) {
      // Validate token on protected pages
      const validateToken = async () => {
        try {
          await ApiService.validate()
        } catch (error) {
          // Token invalid or expired, redirect to login
          ApiService.logout()
          navigate('/login')
        }
      }
      
      validateToken()
    }
  }, [location.pathname, navigate])

  return <AppRoutes />
}

function App() {
  const BASE_URL = window.__BASE_URL__ || '/';

  return (
    <BrowserRouter basename={BASE_URL}>
      <AppLayout>
        <AppContent />
      </AppLayout>
    </BrowserRouter>
  )
}

export default App;