// Billing and Subscription Types

export interface Plan {
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

export interface Subscription {
  id: string
  companyId: string
  planCode: string
  planName: string
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
  billingCycle: 'MONTHLY' | 'YEARLY'
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  maxUsers: number
  maxProjects: number
  currentUsers: number
  currentProjects: number
  rzSubscriptionId: string | null
}

export interface CheckoutRequest {
  planCode: string
  billingCycle: 'MONTHLY' | 'YEARLY'
}

export interface CheckoutResponse {
  keyId: string
  subscriptionId: string
  customerId: string
  planCode: string
  billingCycle: string
  amount: number
  currency: string
  companyName: string
  userName: string
  userEmail: string
}

export interface RazorpayOptions {
  key: string
  subscription_id: string
  name: string
  description: string
  prefill: {
    name: string
    email: string
  }
  theme?: {
    color?: string
  }
  handler: (response: RazorpayResponse) => void
  modal?: {
    ondismiss?: () => void
  }
}

export interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void
    }
  }
}
