import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function PaymentRequiredModal() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handlePaymentRequired = (event: CustomEvent) => {
      setMessage(event.detail.message || 'Subscription upgrade required')
      setIsOpen(true)
    }

    window.addEventListener('payment-required', handlePaymentRequired as EventListener)
    
    return () => {
      window.removeEventListener('payment-required', handlePaymentRequired as EventListener)
    }
  }, [])

  const handleUpgrade = () => {
    setIsOpen(false)
    navigate('/app/billing')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>Upgrade Required</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade}>
            Go to Billing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
