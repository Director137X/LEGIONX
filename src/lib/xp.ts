import { RANK_THRESHOLDS, STREAK_TIERS, PROFICIENCY_THRESHOLDS } from '../types'
import type { FTag, UserData } from '../types'

export function calculateXPAndRank(userData: UserData) {
  const displayXP = userData.xp + userData.streak * 20

  let rank = RANK_THRESHOLDS[0]
  for (const r of RANK_THRESHOLDS) {
    if (displayXP >= r.xp) rank = r
  }

  const currentIdx = RANK_THRESHOLDS.indexOf(rank)
  const nextRank = RANK_THRESHOLDS[currentIdx + 1] ?? null
  const xpIntoRank = displayXP - rank.xp
  const xpNeeded = nextRank ? nextRank.xp - rank.xp : 1
  const progress = nextRank ? Math.min(100, (xpIntoRank / xpNeeded) * 100) : 100

  return { displayXP, rank, nextRank, xpIntoRank, xpNeeded, progress }
}

export function getStreakTier(streak: number) {
  let tier = STREAK_TIERS[0]
  for (const t of STREAK_TIERS) {
    if (streak >= t.days) tier = t
  }
  return tier
}

export function getProficiencyLevel(points: number) {
  let level = 1
  for (let i = 0; i < PROFICIENCY_THRESHOLDS.length; i++) {
    if (points >= PROFICIENCY_THRESHOLDS[i]) level = i + 1
  }
  return level
}

export function getBlockXP(streak: number): number {
  const tier = getStreakTier(streak)
  const base = Math.floor(Math.random() * 11) + 15
  return Math.round(base * tier.multiplier)
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function completionPct(tasks: Record<string, boolean>, schedule: { id: string }[]): number {
  if (schedule.length === 0) return 0
  return Math.round((Object.keys(tasks).length / schedule.length) * 100)
}

export function getDayCompletion(date: string, habitHistory: Record<string, Record<string, boolean>>, schedule: { id: string }[]): number {
  const dayData = habitHistory[date]
  if (!dayData) return -1
  return completionPct(dayData, schedule)
}

export function getPillarColor(tag: FTag): string {
  const map: Record<FTag, string> = {
    finance: '#10b981',
    fitness: '#ef4444',
    family: '#3b82f6',
    faith: '#fbbf24',
    friends: '#ec4899',
  }
  return map[tag]
}
