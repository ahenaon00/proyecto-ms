import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from "./components/Login"
import Home from "./components/Home"
import RegisterForm from "./components/RegisterForm"
import ServiceDetail from "./components/ServiceDetail"
import Cart from "./components/Cart"
import CreateService from "./components/CreateService"
import AuthProvider, { useAuth } from "./contexts/AuthContext"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function AppContent() {
  const { token, isLoading } = useAuth()
  const [view, setView] = useState<'login' | 'register'>('login')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return view === 'login' ? <Login onSwitchToRegister={() => setView('register')} /> : <RegisterForm onSwitchToLogin={() => setView('login')} />
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/service/:id" element={<ServiceDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/create-service" element={<CreateService />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
