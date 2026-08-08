import type { Category } from '../types'

export function calcTotal(scores: Record<string, number>, categories: Category[]): number {
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0)
  if (totalWeight === 0) return 0
  const weighted = categories.reduce((s, c) => {
    const score = scores[c.id] ?? 0
    return s + score * (c.weight / totalWeight)
  }, 0)
  return Math.round(weighted * 10) / 10
}

export function scoreColor(score: number): string {
  if (score >= 8.5) return '#22C55E'
  if (score >= 7) return '#84CC16'
  if (score >= 5.5) return '#F59E0B'
  if (score >= 4) return '#F97316'
  return '#EF4444'
}

export function scoreLabel(score: number): string {
  if (score >= 9) return 'Legendär'
  if (score >= 8) return 'Exzellent'
  if (score >= 7) return 'Sehr gut'
  if (score >= 6) return 'Gut'
  if (score >= 5) return 'Mittel'
  if (score >= 4) return 'Mäßig'
  return 'Schlecht'
}
