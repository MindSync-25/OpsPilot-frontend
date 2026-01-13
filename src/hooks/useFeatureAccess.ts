import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

interface Plan {
  id: string
  code: string
  name: string
  priceMonthly: number
  priceYearly: number
  currencyCode: string
  maxUsers: number
  maxProjects: number
  featureFlags: Record<string, boolean>
  isActive: boolean
}

interface Subscription {
  id: string
  companyId: string
  plan: Plan
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export function useFeatureAccess() {
  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await api.get('/billing/subscription')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  })

  const hasFeature = (featureName: string): boolean => {
    if (!subscription?.plan?.featureFlags) {
      return false
    }
    return subscription.plan.featureFlags[featureName] === true
  }

  const isPlan = (planCode: string): boolean => {
    return subscription?.plan?.code === planCode
  }

  const isFree = isPlan('FREE')
  const isStarter = isPlan('STARTER')
  const isGrowth = isPlan('GROWTH')
  const isAgency = isPlan('AGENCY')

  return {
    subscription,
    isLoading,
    hasFeature,
    isPlan,
    isFree,
    isStarter,
    isGrowth,
    isAgency,
    // Specific feature checks
    hasKanban: hasFeature('kanban'),
    hasTimeTracking: hasFeature('time_tracking'),
    hasInvoicing: hasFeature('invoicing'),
    hasReports: hasFeature('reports'),
    hasAdvancedAnalytics: hasFeature('advanced_analytics'),
    hasWhiteLabel: hasFeature('white_label'),
  }
}
