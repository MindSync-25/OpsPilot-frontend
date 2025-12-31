import { apiClient } from '@/lib/api'

export interface SignupRequest {
  name: string
  email: string
  password: string
  companyName: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: {
    id: string
    name: string
    email: string
    role: string
    companyId: string
  }
}

export const authService = {
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data)
    return response.data
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    })
    return response.data
  },
}
