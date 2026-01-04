import { useState, useEffect } from 'react'
import { X, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingTooltipProps {
  stepId: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  show?: boolean
  onDismiss?: () => void
}

export default function OnboardingTooltip({
  stepId,
  title,
  description,
  position = 'bottom',
  show = true,
  onDismiss,
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if this tooltip was already dismissed
    const dismissedTooltips = JSON.parse(localStorage.getItem('dismissedTooltips') || '[]')
    if (dismissedTooltips.includes(stepId)) {
      setDismissed(true)
      return
    }

    // Show with a slight delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [stepId])

  const handleDismiss = () => {
    setIsVisible(false)
    setDismissed(true)
    
    // Store dismissed state
    const dismissedTooltips = JSON.parse(localStorage.getItem('dismissedTooltips') || '[]')
    localStorage.setItem('dismissedTooltips', JSON.stringify([...dismissedTooltips, stepId]))
    
    onDismiss?.()
  }

  if (!show || dismissed || !isVisible) {
    return null
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }

  return (
    <div
      className={cn(
        "absolute z-50 w-64 animate-in fade-in slide-in-from-top-2",
        positionClasses[position]
      )}
    >
      <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="flex items-start gap-2 mb-2">
          <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <h4 className="font-semibold text-sm pr-6">{title}</h4>
        </div>

        <p className="text-xs opacity-90">{description}</p>

        {/* Arrow */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 transform rotate-45",
            position === 'bottom' && "top-0 left-4 -translate-y-1/2",
            position === 'top' && "bottom-0 left-4 translate-y-1/2",
            position === 'right' && "left-0 top-4 -translate-x-1/2",
            position === 'left' && "right-0 top-4 translate-x-1/2"
          )}
        />
      </div>
    </div>
  )
}
