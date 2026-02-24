import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(val: string): string {
  const digits = val.replace(/[^0-9.]/g, '')
  const parts = digits.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (parts[1]) parts[1] = parts[1].substring(0, 2)
  return parts.join('.')
}

export function formatMoney(amount: number, currency: string = 'DOP'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}
