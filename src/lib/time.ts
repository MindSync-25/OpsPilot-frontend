import { formatDistanceToNow, format } from 'date-fns'

export function formatRelative(date: string | Date | undefined | null): string {
  if (!date) return 'Unknown'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return 'Unknown'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'MMM d, yyyy')
  } catch {
    return 'Unknown'
  }
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return 'Unknown'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'MMM d, yyyy h:mm a')
  } catch {
    return 'Unknown'
  }
}
