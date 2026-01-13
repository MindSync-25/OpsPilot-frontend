import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { getPlans, createCheckout } from '@/services/billingService'
import { loadRazorpayScript, pollSubscriptionStatus } from '@/lib/razorpay'
import { getSubscription } from '@/services/billingService'
import type { Plan } from '@/types/billing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import MarketingLayout from '@/components/marketing/MarketingLayout'

export default function Pricing() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [loading, setLoading] = useState(true)
  const [processingCheckout, setProcessingCheckout] = useState(false)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const plansData = await getPlans()
      setPlans(plansData)
    } catch {
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handlePlanAction = useCallback(async (planCode: string) => {
    if (!isAuthenticated()) {
      // Redirect to signup with plan preselected
      navigate(`/signup?plan=${planCode}&cycle=${billingCycle}`)
      return
    }

    // User is authenticated, start checkout flow
    const canManageBilling = user?.role === 'TOP_USER' || user?.role === 'SUPER_USER' || user?.role === 'ADMIN'
    
    if (!canManageBilling) {
      toast.error('Only admins can upgrade plans')
      return
    }

    setProcessingCheckout(true)

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay checkout')
      }

      // Create checkout session
      const checkoutData = await createCheckout({
        planCode,
        billingCycle
      })

      // Open Razorpay checkout
      const options = {
        key: checkoutData.keyId,
        subscription_id: checkoutData.subscriptionId,
        name: checkoutData.companyName,
        description: `${checkoutData.planCode} - ${checkoutData.billingCycle}`,
        prefill: {
          name: checkoutData.userName,
          email: checkoutData.userEmail
        },
        handler: async () => {
          toast.info('Payment initiated. Activating your subscription...')

          // Poll subscription status
          const result = await pollSubscriptionStatus(getSubscription, 15, 2000)

          if (result.success) {
            toast.success('Your subscription is now active!')
            navigate('/app/billing')
          } else {
            toast.info('Payment received. Redirecting to billing page...')
            navigate('/app/billing')
          }

          setProcessingCheckout(false)
        },
        modal: {
          ondismiss: () => {
            setProcessingCheckout(false)
            toast.info('Payment cancelled')
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      setProcessingCheckout(false)
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err.response?.data?.message || err.message || 'Failed to initiate checkout')
    }
  }, [isAuthenticated, user, billingCycle, navigate])

  useEffect(() => {
    // Handle deep link from marketing site
    const plan = searchParams.get('plan')
    const cycle = searchParams.get('cycle')
    
    if (plan && cycle && isAuthenticated()) {
      setBillingCycle(cycle as 'MONTHLY' | 'YEARLY')
      // Auto-trigger checkout if user is authenticated
      setTimeout(() => {
        handlePlanAction(plan)
      }, 500)
    }
  }, [searchParams, isAuthenticated, handlePlanAction])

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent pricing that grows with you. Try any plan free for 14 days.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center">
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'MONTHLY' | 'YEARLY')}>
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
              <TabsTrigger value="YEARLY">
                Yearly
                <Badge variant="secondary" className="ml-2">Save 17%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const price = billingCycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly
            const features = Object.entries(plan.featureFlags || {})
              .filter(([, enabled]) => enabled)
              .map(([feature]) => feature.replace(/_/g, ' '))
            const isPopular = plan.code === 'GROWTH'

            return (
              <Card 
                key={plan.id} 
                className={`relative ${isPopular ? 'border-primary shadow-lg shadow-primary/20' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        {formatPrice(price, plan.currencyCode)}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingCycle === 'MONTHLY' ? 'month' : 'year'}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>{plan.maxUsers}</strong> team members
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>{plan.maxProjects === 9999 ? 'Unlimited' : plan.maxProjects}</strong> projects
                      </span>
                    </div>
                    {features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm capitalize">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handlePlanAction(plan.code)}
                    disabled={processingCheckout || !plan.isActive}
                  >
                    {processingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAuthenticated() 
                      ? (price === 0 ? 'Downgrade to Free' : 'Upgrade Now')
                      : (price === 0 ? 'Start Free' : 'Start Free Trial')
                    }
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center text-muted-foreground max-w-2xl mx-auto">
          <p>All plans include a 14-day free trial. No credit card required for the free plan.</p>
          <p className="mt-2">Need help choosing? Contact our sales team.</p>
        </div>
      </div>
    </MarketingLayout>
  )
}
