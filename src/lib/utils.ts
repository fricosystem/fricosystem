// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names using clsx and tailwind-merge
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Brazilian Real currency
 * @param value - Number to format
 * @returns Formatted currency string (e.g., "R$ 1.000,00")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Parses a currency string to a number
 * @param value - Currency string to parse (e.g., "1.000,00")
 * @returns Parsed number (e.g., 1000)
 */
export function parseCurrency(value: string): number {
  if (!value) return 0
  const cleanValue = value
    .replace(/[^\d,-]/g, '') // Remove non-numeric except , and -
    .replace(',', '.')       // Replace comma with dot
    .replace(/[^0-9.-]/g, '') // Remove any remaining non-numeric
  
  return parseFloat(cleanValue) || 0
}

/**
 * Checks if the device supports touch events
 * @returns Boolean indicating touch support
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  )
}

/**
 * Formats a date string to Brazilian format
 * @param dateString - Date string to format
 * @returns Formatted date string (e.g., "01/01/2023")
 */
export function formatDateBr(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

/**
 * Calculates days between two dates
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Number of days between dates
 */
export function daysBetweenDates(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Validates a CNPJ number
 * @param cnpj - CNPJ string to validate
 * @returns Boolean indicating valid CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, '')
  
  if (cnpj.length !== 14) return false
  
  // Elimina CNPJs invalidos conhecidos
  if (/^(\d)\1+$/.test(cnpj)) return false
  
  // Valida DVs
  let tamanho = cnpj.length - 2
  let numeros = cnpj.substring(0, tamanho)
  const digitos = cnpj.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11
  if (resultado !== parseInt(digitos.charAt(0))) return false
  
  tamanho = tamanho + 1
  numeros = cnpj.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11
  if (resultado !== parseInt(digitos.charAt(1))) return false
  
  return true
}