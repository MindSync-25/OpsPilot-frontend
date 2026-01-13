import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Save, Eye, Palette, RotateCcw } from 'lucide-react'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useWhiteLabelStore } from '@/app/whiteLabelStore'

export default function WhiteLabel() {
  const { hasWhiteLabel, isLoading } = useFeatureAccess()
  const navigate = useNavigate()
  const { branding, setBranding: updateBranding, resetBranding, applyBranding } = useWhiteLabelStore()

  useEffect(() => {
    if (!isLoading && !hasWhiteLabel) {
      navigate('/app/billing')
    }
  }, [hasWhiteLabel, isLoading, navigate])

  useEffect(() => {
    // Apply branding when component mounts
    applyBranding()
  }, [applyBranding])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasWhiteLabel) {
    return null
  }

  const handleSave = () => {
    applyBranding()
    toast.success('Branding settings saved and applied!', {
      description: 'Your changes are now visible across the application.'
    })
  }

  const handleReset = () => {
    resetBranding()
    toast.success('Branding reset to defaults')
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      updateBranding({ logoUrl: url })
      toast.success('Logo uploaded successfully!')
    }
  }

  const handleBrandingChange = (field: string, value: string) => {
    updateBranding({ [field]: value })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">White Label Branding</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
          Customize the application with your own branding
        </p>
      </div>

      {/* Logo & Company Name */}
      <Card>
        <CardHeader>
          <CardTitle>Company Identity</CardTitle>
          <CardDescription>Upload your logo and set your company name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={branding.companyName}
              onChange={(e) => handleBrandingChange('companyName', e.target.value)}
              placeholder="Your Company Name"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Company Logo</Label>
            <div className="mt-2 flex items-center gap-4">
              {branding.logoUrl ? (
                <div className="w-32 h-32 border-2 border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src={branding.logoUrl} alt="Company Logo" className="max-w-full max-h-full" />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload">
                  <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: 512x512px, PNG or SVG
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Scheme
          </CardTitle>
          <CardDescription>Customize your brand colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="primaryColor"
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  placeholder="#6fa89a"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used for buttons, links, and primary UI elements
              </p>
            </div>

            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="accentColor"
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={branding.accentColor}
                  onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                  placeholder="#8fc1b5"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used for highlights and secondary accents
              </p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-4 p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-sm font-medium mb-3">Preview</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <div 
                  className="h-20 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Primary Color
                </div>
              </div>
              <div className="flex-1">
                <div 
                  className="h-20 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: branding.accentColor }}
                >
                  Accent Color
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>Use your own domain for the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="customDomain">Domain Name</Label>
            <Input
              id="customDomain"
              value={branding.customDomain}
              onChange={(e) => handleBrandingChange('customDomain', e.target.value)}
              placeholder="app.yourcompany.com"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Configure your DNS settings to point to our servers. Contact support for setup instructions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Text */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Customization</CardTitle>
          <CardDescription>Customize the footer text</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="footerText">Footer Text</Label>
          <Input
            id="footerText"
            value={branding.footerText}
            onChange={(e) => handleBrandingChange('footerText', e.target.value)}
            placeholder="Powered by Your Company"
            className="mt-1"
          />
        </CardContent>
      </Card>

      {/* Live Preview Banner */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Live Preview
          </CardTitle>
          <CardDescription>
            Changes are applied in real-time. You can see them throughout the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Sample Button (Primary Color)</p>
                <Button>Click Me</Button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Sample Badge (Accent Color)</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" 
                     style={{ backgroundColor: branding.accentColor, color: 'white' }}>
                  New Feature
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Navigate to any page to see your branding in action. Colors update immediately!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save & Apply
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
