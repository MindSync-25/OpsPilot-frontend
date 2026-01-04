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
    let dateObj: Date
    if (typeof date === 'string') {
      // Handle ISO date strings (YYYY-MM-DD) without time component
      // Parse as local date to avoid timezone issues
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number)
        dateObj = new Date(year, month - 1, day)
      } else {
        dateObj = new Date(date)
      }
    } else {
      dateObj = date
    }
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
