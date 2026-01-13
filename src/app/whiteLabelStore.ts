import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WhiteLabelBranding {
  companyName: string
  logoUrl: string
  primaryColor: string
  accentColor: string
  customDomain: string
  footerText: string
}

interface WhiteLabelStore {
  branding: WhiteLabelBranding
  setBranding: (branding: Partial<WhiteLabelBranding>) => void
  resetBranding: () => void
  applyBranding: () => void
}

const defaultBranding: WhiteLabelBranding = {
  companyName: 'OpsPilot',
  logoUrl: '',
  primaryColor: '#6fa89a',
  accentColor: '#8fc1b5',
  customDomain: '',
  footerText: 'Powered by OpsPilot'
}

export const useWhiteLabelStore = create<WhiteLabelStore>()(
  persist(
    (set, get) => ({
      branding: defaultBranding,
      
      setBranding: (newBranding) => {
        set((state) => ({
          branding: { ...state.branding, ...newBranding }
        }))
        // Apply immediately after setting
        setTimeout(() => get().applyBranding(), 0)
      },
      
      resetBranding: () => {
        set({ branding: defaultBranding })
        get().applyBranding()
      },
      
      applyBranding: () => {
        const { branding } = get()
        const root = document.documentElement
        
        // Convert hex to HSL for CSS variables
        const hexToHSL = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
          if (!result) return '0 0% 0%'
          
          const r = parseInt(result[1], 16) / 255
          const g = parseInt(result[2], 16) / 255
          const b = parseInt(result[3], 16) / 255
          
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          let h = 0, s = 0, l = (max + min) / 2
          
          if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            
            switch (max) {
              case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
              case g: h = ((b - r) / d + 2) / 6; break
              case b: h = ((r - g) / d + 4) / 6; break
            }
          }
          
          h = Math.round(h * 360)
          s = Math.round(s * 100)
          l = Math.round(l * 100)
          
          return `${h} ${s}% ${l}%`
        }
        
        // Apply primary color
        if (branding.primaryColor) {
          const primaryHSL = hexToHSL(branding.primaryColor)
          root.style.setProperty('--primary', primaryHSL)
        }
        
        // Apply accent color (use for accent/secondary elements)
        if (branding.accentColor) {
          const accentHSL = hexToHSL(branding.accentColor)
          root.style.setProperty('--accent', accentHSL)
        }
        
        // Update document title if company name is set
        if (branding.companyName && branding.companyName !== 'OpsPilot') {
          document.title = `${branding.companyName} - IT Operations Management Platform`
        }
      }
    }),
    {
      name: 'opspilot-whitelabel-storage',
      onRehydrateStorage: () => (state) => {
        // Apply branding after rehydration
        if (state) {
          state.applyBranding()
        }
      }
    }
  )
)
