/**
 * Utilitaires communs
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine les classes Tailwind avec gestion des conflits
 * Utilisé partout dans les composants pour merger les classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
