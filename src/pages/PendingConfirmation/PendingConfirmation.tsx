import { useLocation, Link } from 'react-router'
import { Clock, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const PendingConfirmation = () => {
  const location = useLocation()
  const email = location.state?.email || 'your email'

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

      {/* Confirmation Card */}
      <div className="relative z-10 w-full max-w-md bg-surface rounded-2xl shadow-2xl p-12">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="flex justify-center mb-6">
          <div className="bg-warning/10 border border-warning/20 rounded-full p-4">
            <Clock className="w-8 h-8 text-warning animate-pulse" />
          </div>
        </div>

        <h1 className="text-center text-3xl font-bold text-primary mb-2">
          Awaiting Confirmation
        </h1>
        <p className="text-center text-sm text-muted mb-6">
          Your registration is under review
        </p>

        <div className="bg-muted/5 border border-border rounded-lg p-6 space-y-4 mb-6">
          <div>
            <p className="text-sm text-muted mb-2">Registered Email:</p>
            <p className="text-base font-medium text-foreground break-all">{email}</p>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted mb-3">What happens next:</p>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                <span>An administrator will review your registration request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                <span>Once approved, you'll be able to log in with your credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                <span>Check back soon for confirmation</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-4 px-4 bg-info/10 border border-info/20 rounded-lg text-xs text-info">
          <p>
            If you don't receive confirmation within 24 hours, please contact the system administrator.
          </p>
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className={cn(
              'block w-full py-3.5 px-4 text-center rounded-lg text-base font-semibold',
              'bg-primary text-white',
              'transition-all duration-200',
              'hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-xl',
              'active:translate-y-0'
            )}
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PendingConfirmation
