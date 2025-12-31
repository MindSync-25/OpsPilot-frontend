import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-8 mb-8 border-b border-border/60">
      <div className="flex-1">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground/70">{subtitle}</p>}
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="flex items-center gap-3">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  )
}
