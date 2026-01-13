import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/app/store'

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: 'http://localhost:8081/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Attach JWT token to all requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle 401 and 402 errors
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    
    if (error.response?.status === 402) {
      // Payment required - trigger global event for payment modal
      window.dispatchEvent(new CustomEvent('payment-required', {
        detail: {
          message: (error.response.data as any)?.message || 'Subscription upgrade required'
        }
      }))
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
