import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const { setToken } = useAuth()

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const endpoint = isRegister ? '/users/register' : '/auth/login'
      const response = await api.post(endpoint, { email, password })
      const { accessToken, user } = response.data
      setToken(accessToken, user)
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid credentials")
      } else if (err.response?.status === 409) {
        setError("User already exists")
      } else {
        setError(isRegister ? "Registration failed" : "Login failed")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          {isRegister ? "Register" : "Login"}
        </h1>
        
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Processing..." : (isRegister ? "Register" : "Login")}
          </Button>
          
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          
          <Button 
            onClick={() => {
              setIsRegister(!isRegister)
              setError("")
            }} 
            variant="outline" 
            className="w-full"
            disabled={loading}
          >
            {isRegister ? "Already have an account? Login" : "Need an account? Register"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Login