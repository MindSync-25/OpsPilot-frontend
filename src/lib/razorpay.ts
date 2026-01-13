/**
 * Razorpay Utility Functions
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

/**
 * Dynamically load Razorpay checkout script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve(true)
      return
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true))
      existingScript.addEventListener('error', () => resolve(false))
      return
    }

    // Create and load script
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Poll subscription status until it becomes ACTIVE or timeout
 * @param getSubscriptionFn Function to fetch subscription
 * @param maxAttempts Maximum polling attempts (default: 15)
 * @param intervalMs Interval between polls in ms (default: 2000)
 */
export const pollSubscriptionStatus = async (
  getSubscriptionFn: () => Promise<{ status: string }>,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<{ status: string; success: boolean }> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    
    try {
      const subscription = await getSubscriptionFn()
      if (subscription.status === 'ACTIVE') {
        return { status: subscription.status, success: true }
      }
    } catch (error) {
      console.error('Error polling subscription:', error)
    }
  }
  
  return { status: 'UNKNOWN', success: false }
}
