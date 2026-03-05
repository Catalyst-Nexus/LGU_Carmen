import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuthStore } from '@/store'
import { cn } from '@/lib/utils'
import { Lightbulb, AlertCircle } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email || !password) {
      setError('Please enter both email and password')
      setIsLoading(false)
      return
    }

    const success = await login(email, password)
    setIsLoading(false)

    if (success) {
      navigate('/dashboard')
    } else {
      // Error is already set in the store, just display a default message
      setError('Invalid email or password. Please try again.')
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-primary overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-surface rounded-2xl shadow-2xl p-12">
        <h1 className="text-center text-3xl font-bold text-primary mb-2">
          Animal Farm System
        </h1>

        <form className="flex flex-col gap-6 mt-8" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className={cn(
                'w-full px-4 py-3.5 border border-border rounded-lg text-sm',
                'bg-surface text-foreground placeholder:text-muted',
                'transition-all duration-200',
                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
              )}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className={cn(
                'w-full px-4 py-3.5 border border-border rounded-lg text-sm',
                'bg-surface text-foreground placeholder:text-muted',
                'transition-all duration-200',
                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
              )}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3 text-sm text-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            className={cn(
              'w-full py-3.5 mt-2 rounded-lg text-base font-semibold',
              'bg-primary text-white',
              'transition-all duration-200',
              'hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-xl',
              'active:translate-y-0',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'
            )}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-background rounded-lg border border-border">
          <div className="flex items-center gap-2 font-semibold text-sm text-primary mb-2">
            <Lightbulb className="w-4 h-4" />
            <span>Getting Started:</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Use your Supabase account credentials to login. If you don't have an account, contact your administrator.
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Need help?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Request an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
