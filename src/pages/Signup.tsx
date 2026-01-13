import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/app/store'
import { authService } from '@/services/authService'
import { Check } from 'lucide-react'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [planCode, setPlanCode] = useState('STARTER')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword || !companyName) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.signup({
        name,
        email,
        password,
        companyName,
        planCode,
      })
      
      // Auto-login after successful signup
      login(response.accessToken, response.user)
      
      toast.success('Account created successfully!', {
        description: 'Welcome to OpsPilot',
      })
      
      navigate('/app/dashboard')
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      const errorMessage = error.response?.data?.message || 'Failed to create account. Please try again.'
      setError(errorMessage)
      toast.error('Signup failed', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-2xl">OP</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-foreground">
          Join OpsPilot
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Create your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-lg border border-border sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Full name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-foreground"
              >
                Company name
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  autoComplete="organization"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                  placeholder="Acme Inc"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Choose your plan (14 days free trial)
              </label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setPlanCode('STARTER')}
                  className={`relative flex items-start p-4 border-2 rounded-lg transition-all ${
                    planCode === 'STARTER'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Starter Plan</span>
                      <span className="text-sm text-muted-foreground">₹999/mo</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>5 users, 10 projects</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>Kanban + Reports</span>
                      </div>
                    </div>
                  </div>
                  {planCode === 'STARTER' && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPlanCode('GROWTH')}
                  className={`relative flex items-start p-4 border-2 rounded-lg transition-all ${
                    planCode === 'GROWTH'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Growth Plan</span>
                      <span className="text-sm text-muted-foreground">₹2,999/mo</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>15 users, Unlimited projects</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>Time Tracking + Invoices + Advanced Analytics</span>
                      </div>
                    </div>
                  </div>
                  {planCode === 'GROWTH' && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPlanCode('AGENCY')}
                  className={`relative flex items-start p-4 border-2 rounded-lg transition-all ${
                    planCode === 'AGENCY'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Agency Plan</span>
                      <span className="text-sm text-muted-foreground">₹7,999/mo</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>50 users, Unlimited projects</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        <span>All Growth + White Label branding</span>
                      </div>
                    </div>
                  </div>
                  {planCode === 'AGENCY' && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    Sign in
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
