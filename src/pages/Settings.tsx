import { useState, useEffect } from 'react'
import { Save, User, Bell, Shield, CreditCard, Palette, AlertTriangle } from 'lucide-react'
import { useThemeStore } from '../app/themeStore'
import { useAuthStore } from '../app/store'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../lib/api'
import axios from 'axios'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  designation: string
}

interface CompanyInfo {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
}

export default function Settings() {
  const { theme, setTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    // User fields
    userName: '',
    userEmail: '',
    userPhone: '',
    userDesignation: '',
    // Company fields
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZipCode: '',
    companyPhone: '',
    // Notification preferences (not implemented in backend yet)
    emailNotifications: true,
    projectUpdates: true,
    invoiceReminders: true,
    weeklyReports: false,
  })

  // Fetch user profile and company data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch user profile
        const userResponse = await api.get('/users/me')
        const userData: UserProfile = userResponse.data
        
        // Fetch company data
        const companyResponse = await api.get(`/companies/${user?.companyId}`)
        const companyData: CompanyInfo = companyResponse.data
        
        // Populate form with real data
        setFormData(prev => ({
          ...prev,
          userName: userData.name || '',
          userEmail: userData.email || '',
          userPhone: userData.phone || '',
          userDesignation: userData.designation || '',
          companyName: companyData.name || '',
          companyAddress: companyData.address || '',
          companyCity: companyData.city || '',
          companyState: companyData.state || '',
          companyZipCode: companyData.zipCode || '',
          companyPhone: companyData.phone || '',
        }))
      } catch (error) {
        console.error('Failed to fetch settings data:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user?.companyId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // Update user profile
      await api.put('/users/me', {
        name: formData.userName,
        email: formData.userEmail,
        phone: formData.userPhone,
        designation: formData.userDesignation,
      })
      
      // Update company info
      await api.put(`/companies/${user?.companyId}`, {
        name: formData.companyName,
        address: formData.companyAddress,
        city: formData.companyCity,
        state: formData.companyState,
        zipCode: formData.companyZipCode,
        phone: formData.companyPhone,
      })
      
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error('Failed to save settings')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    if (!user?.companyId) {
      toast.error('User not found')
      return
    }

    try {
      await api.delete(`/companies/${user.companyId}`)
      
      toast.success('Account deleted successfully')
      
      // Logout and redirect
      logout()
    } catch (error) {
      console.error('Delete account error:', error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to delete account')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
            <div className="flex items-center">
              <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                Appearance
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme Selection
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTheme('light-cream')}
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                    theme === 'light-cream'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-weak)] shadow-lg shadow-[var(--accent-primary)]/20'
                      : 'border-gray-200 dark:border-border hover:border-[var(--accent-primary)]/50 hover:shadow-md'
                  }`}
                >
                  {theme === 'light-cream' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="w-full h-24 rounded-lg mb-3 border border-gray-200 overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-[#f6f5f2] via-[#f0eee9] to-[#ffffff] flex items-center justify-center">
                      <div className="w-16 h-16 rounded-lg bg-white shadow-lg border border-[#e5e3dc] flex items-center justify-center">
                        <div className="w-8 h-1 rounded-full bg-[#6fa89a]"></div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-foreground mb-1">Light Cream</h3>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground text-center">
                    Soft, warm light theme
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark-sage')}
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                    theme === 'dark-sage'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-weak)] shadow-lg shadow-[var(--accent-primary)]/20'
                      : 'border-gray-200 dark:border-border hover:border-[var(--accent-primary)]/50 hover:shadow-md'
                  }`}
                >
                  {theme === 'dark-sage' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="w-full h-24 rounded-lg mb-3 border border-gray-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-[#1f2430] via-[#1a1f2b] to-[#252b3a] flex items-center justify-center">
                      <div className="w-16 h-16 rounded-lg bg-[#252b3a] shadow-lg border border-[#32384a] flex items-center justify-center">
                        <div className="w-8 h-1 rounded-full bg-[#7fb3a2]"></div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-foreground mb-1">Dark Sage</h3>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground text-center">
                    Calm, professional dark theme
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                Profile Information
              </h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="userName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="userName"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="userEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Email
                </label>
                <input
                  type="email"
                  id="userEmail"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="userPhone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Phone
                </label>
                <input
                  type="tel"
                  id="userPhone"
                  name="userPhone"
                  value={formData.userPhone}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="userDesignation"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Designation
                </label>
                <input
                  type="text"
                  id="userDesignation"
                  name="userDesignation"
                  value={formData.userDesignation}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                Company Information
              </h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="companyPhone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Company Phone
                </label>
                <input
                  type="tel"
                  id="companyPhone"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="companyAddress"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="companyAddress"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="companyCity"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  City
                </label>
                <input
                  type="text"
                  id="companyCity"
                  name="companyCity"
                  value={formData.companyCity}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="companyState"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    State
                  </label>
                  <input
                    type="text"
                    id="companyState"
                    name="companyState"
                    value={formData.companyState}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="companyZipCode"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="companyZipCode"
                    name="companyZipCode"
                    value={formData.companyZipCode}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                Notifications
              </h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Receive email notifications for important updates
                </p>
              </div>
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-border rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">
                  Project Updates
                </h3>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Get notified when projects are updated
                </p>
              </div>
              <input
                type="checkbox"
                name="projectUpdates"
                checked={formData.projectUpdates}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-border rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">
                  Invoice Reminders
                </h3>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Receive reminders for unpaid invoices
                </p>
              </div>
              <input
                type="checkbox"
                name="invoiceReminders"
                checked={formData.invoiceReminders}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-border rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">
                  Weekly Reports
                </h3>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Get weekly summary reports via email
                </p>
              </div>
              <input
                type="checkbox"
                name="weeklyReports"
                checked={formData.weeklyReports}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-border rounded"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Security</h2>
            </div>
          </div>
          <div className="p-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-foreground bg-white dark:bg-background hover:bg-gray-50 dark:hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Billing Settings */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                Billing & Subscription
              </h2>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                  Current Plan: Professional
                </p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">$99/month</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="px-4 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-foreground bg-white dark:bg-background hover:bg-gray-50 dark:hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-card rounded-lg shadow-sm border-2 border-red-200 dark:border-red-900">
          <div className="px-6 py-4 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-400">
                Danger Zone
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  Delete Account & Company
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
                  Permanently delete your account, company, and all associated data. This action cannot be undone.
                </p>
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                  Warning: This will delete all projects, tasks, time entries, invoices, and team members.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="ml-4 px-4 py-2 border border-red-300 dark:border-red-800 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
              >
                {showDeleteConfirm ? 'Cancel' : 'Delete Account'}
              </button>
            </div>

            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-900 dark:text-red-400 mb-2">
                    Type <span className="font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3 py-2 border border-red-300 dark:border-red-800 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 bg-white dark:bg-background text-gray-900 dark:text-foreground"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  I understand, delete my account permanently
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
