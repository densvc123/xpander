import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr} - ${endStr}`
}

export function calculateDaysRemaining(deadline: Date | string): number {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getProjectHealthColor(health: 'healthy' | 'at_risk' | 'critical'): string {
  switch (health) {
    case 'healthy': return 'text-emerald-500'
    case 'at_risk': return 'text-amber-500'
    case 'critical': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-800'
    case 'in_progress': return 'bg-blue-100 text-blue-800'
    case 'planning': return 'bg-purple-100 text-purple-800'
    case 'on_hold': return 'bg-amber-100 text-amber-800'
    case 'blocked': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
