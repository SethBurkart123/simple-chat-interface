import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const RECENT_MODELS_KEY = "recentModels"
const MAX_RECENT_MODELS = 5

export function addRecentModel(modelKey: string): void {
  if (typeof window === "undefined" || !modelKey) return

  try {
    const stored = localStorage.getItem(RECENT_MODELS_KEY)
    const recent: string[] = stored ? JSON.parse(stored) : []

    const updated = [
      modelKey,
      ...recent.filter(key => key !== modelKey)
    ].slice(0, MAX_RECENT_MODELS)

    localStorage.setItem(RECENT_MODELS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Failed to save recent model:", error)
  }
}

export function getRecentModels(): string[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(RECENT_MODELS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Failed to read recent models:", error)
    return []
  }
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for non-secure contexts (HTTP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
