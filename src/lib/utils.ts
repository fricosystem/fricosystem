import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator as any).msMaxTouchPoints > 0);
}