import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { createPendingUser } from '@/services/userActivationService'
import { cn } from '@/lib/utils'
import { Lightbulb, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'

const Register = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validation
    if (!username || !password || !confirmPassword || !email) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      if (!isSupabaseConfigured() || !supabase) {
        setError('Supabase is not configured. Registration is not available.')
        setIsLoading(false)
        return
      }

      const normalizedEmail = email.toLowerCase().trim()

      // Create Supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            username,
            display_name: username,
            full_name: username,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.user) {
        // Create pending user record for admin confirmation
        const result = await createPendingUser(username, normalizedEmail)

        if (!result.success) {
          setError(result.error || 'Failed to register user for activation')
          setIsLoading(false)
          return
        }

        // Registration successful
        setSuccess('Registration successful! Awaiting admin confirmation...')
        setTimeout(() => {
          navigate('/pending-confirmation', { state: { email: normalizedEmail } })
        }, 2000)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during registration'
      setError(message)
    }

    setIsLoading(false)
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

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-md bg-surface rounded-2xl shadow-2xl p-12">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <h1 className="text-center text-3xl font-bold text-primary mb-2">
          Create Account
        </h1>
        <p className="text-center text-sm text-muted mb-6">
          Join the Animal Farm System
        </p>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className={cn(
                'w-full px-4 py-3.5 border border-border rounded-lg text-sm',
                'bg-surface text-foreground placeholder:text-muted',
                'transition-all duration-200',
                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
              )}
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

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
              placeholder="Create a password (min 8 characters)"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              className={cn(
                'w-full px-4 py-3.5 border border-border rounded-lg text-sm',
                'bg-surface text-foreground placeholder:text-muted',
                'transition-all duration-200',
                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
              )}
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3 text-sm text-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="px-4 py-3 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3 text-sm text-success">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-background rounded-lg border border-border">
          <div className="flex items-center gap-2 font-semibold text-sm text-primary mb-2">
            <Lightbulb className="w-4 h-4" />
            <span>Requirements:</span>
          </div>
          <ul className="text-sm text-muted leading-relaxed list-disc list-inside space-y-1">
            <li>Email must be unique</li>
            <li>Username must be unique</li>
            <li>Password must be at least 8 characters</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
