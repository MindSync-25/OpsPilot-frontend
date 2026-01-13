import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/app/store'
import { getPlans, getSubscription, createCheckout } from '@/services/billingService'
import { loadRazorpayScript, pollSubscriptionStatus } from '@/lib/razorpay'
import type { Plan, Subscription } from '@/types/billing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, AlertCircle, Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

export default function Billing() {
  const { user } = useAuthStore()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [loading, setLoading] = useState(true)
  const [processingCheckout, setProcessingCheckout] = useState(false)

  const canManageBilling = user?.role === 'TOP_USER' || user?.role === 'SUPER_USER' || user?.role === 'ADMIN'

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [subscriptionData, plansData] = await Promise.all([
        getSubscription(),
        getPlans()
      ])
      setSubscription(subscriptionData)
      setPlans(plansData)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])



  const handleUpgrade = async (planCode: string) => {
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
            await loadData()
          } else {
            toast.info('Payment received. Waiting for confirmation...')
            // Refresh data anyway
            setTimeout(loadData, 5000)
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
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIVE: 'default',
      TRIALING: 'secondary',
      PAST_DUE: 'destructive',
      CANCELED: 'outline'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing settings</p>
      </div>

      {/* Past Due Alert */}
      {subscription?.status === 'PAST_DUE' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Payment failed. Update payment to restore access.</span>
            {canManageBilling && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpgrade(subscription.planCode)}
                disabled={processingCheckout}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Retry Payment
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <p className="text-2xl font-bold">{subscription.planName}</p>
                <p className="text-sm text-muted-foreground">{subscription.billingCycle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Period</p>
                <p className="text-sm">{formatDate(subscription.currentPeriodStart)}</p>
                <p className="text-sm text-muted-foreground">to {formatDate(subscription.currentPeriodEnd)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Renewal</p>
                <p className="text-sm">
                  {subscription.cancelAtPeriodEnd 
                    ? 'Cancels at period end' 
                    : formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>

            {/* Usage Meters */}
            <div className="space-y-4">
              <h3 className="font-semibold">Usage</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Users</span>
                  <span className="font-medium">
                    {subscription.currentUsers} / {subscription.maxUsers}
                  </span>
                </div>
                <Progress 
                  value={(subscription.currentUsers / subscription.maxUsers) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Projects</span>
                  <span className="font-medium">
                    {subscription.currentProjects} / {subscription.maxProjects === 9999 ? '∞' : subscription.maxProjects}
                  </span>
                </div>
                <Progress 
                  value={subscription.maxProjects === 9999 ? 0 : (subscription.currentProjects / subscription.maxProjects) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Available Plans</h2>
            <p className="text-muted-foreground">Choose the plan that fits your needs</p>
          </div>
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'MONTHLY' | 'YEARLY')}>
            <TabsList>
              <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
              <TabsTrigger value="YEARLY">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = billingCycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly
            const isCurrentPlan = subscription?.planCode === plan.code
            const features = Object.entries(plan.featureFlags || {})
              .filter(([, enabled]) => enabled)
              .map(([feature]) => feature.replace(/_/g, ' '))

            return (
              <Card key={plan.id} className={isCurrentPlan ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrentPlan && <Badge>Current</Badge>}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">
                      {formatPrice(price, plan.currencyCode)}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{plan.maxUsers} users</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{plan.maxProjects === 9999 ? 'Unlimited' : plan.maxProjects} projects</span>
                    </div>
                    {features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm capitalize">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {canManageBilling && (
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={isCurrentPlan || processingCheckout || !plan.isActive}
                      onClick={() => handleUpgrade(plan.code)}
                    >
                      {processingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isCurrentPlan ? 'Current Plan' : price === 0 ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {!canManageBilling && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only administrators can manage billing and subscriptions. Contact your admin to upgrade your plan.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
