import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContentSectionProps {
  children: ReactNode
  className?: string
}

export default function ContentSection({ children, className }: ContentSectionProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>
}
