import { apiClient } from '@/lib/api'
import type { Plan, Subscription, CheckoutRequest, CheckoutResponse } from '@/types/billing'

/**
 * Billing API Service
 */

// Fetch all active plans (public endpoint)
export const getPlans = async (): Promise<Plan[]> => {
  const response = await apiClient.get('/public/plans')
  return response.data
}

// Get current company subscription (authenticated)
export const getSubscription = async (): Promise<Subscription> => {
  const response = await apiClient.get('/billing/subscription')
  return response.data
}

// Create checkout session (authenticated, admin only)
export const createCheckout = async (request: CheckoutRequest): Promise<CheckoutResponse> => {
  const response = await apiClient.post('/billing/checkout', request)
  return response.data
}
