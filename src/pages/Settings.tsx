import { useState } from 'react'
import { Save, User, Bell, Shield, CreditCard, Palette } from 'lucide-react'
import { useThemeStore } from '../app/themeStore'

export default function Settings() {
  const { theme, setTheme } = useThemeStore()
  const [formData, setFormData] = useState({
    companyName: 'IT Ops SaaS',
    email: 'admin@itops.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business St, Suite 100',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    emailNotifications: true,
    projectUpdates: true,
    invoiceReminders: true,
    weeklyReports: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Dummy save - would normally call API
    alert('Settings saved successfully!')
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-background dark:text-foreground sm:text-sm"
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
                className="px-4 py-2 border border-gray-300 dark:border-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-foreground bg-white dark:bg-background hover:bg-gray-50 dark:hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
