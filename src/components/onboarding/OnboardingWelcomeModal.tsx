import { useState, useEffect } from 'react'
import { Rocket, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/contexts/OnboardingContext'

export default function OnboardingWelcomeModal() {
  const { onboardingStarted, startOnboarding, dismissOnboarding } = useOnboarding()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Show modal only if onboarding hasn't started yet
    // Small delay to let the app initialize
    const timer = setTimeout(() => {
      if (!onboardingStarted) {
        setIsOpen(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [onboardingStarted])

  const handleGetStarted = () => {
    startOnboarding()
    setIsOpen(false)
  }

  const handleSkip = () => {
    dismissOnboarding()
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to OpsFlow 👋
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Run projects, track time, and bill clients — all in one place.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Build your team</p>
                <p className="text-xs text-muted-foreground">Add team members and assign roles</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Create projects</p>
                <p className="text-xs text-muted-foreground">Set up your first client project</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Track time</p>
                <p className="text-xs text-muted-foreground">Log hours on your projects</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleGetStarted} className="w-full">
              Get Started
            </Button>
            <Button onClick={handleSkip} variant="ghost" className="w-full">
              Skip for now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
