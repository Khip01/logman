import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Menggabungkan class Tailwind dengan aman (konflik di-resolve oleh tailwind-merge).
 * Lihat AGENTS.md bagian 17.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
