import type { LogEntry, LogType, UserData, AnimaResponse } from '../types'
import { calculateXPAndRank, getStreakTier, completionPct, todayString, getDayCompletion } from './xp'

const ANIMA_ENDPOINT = import.meta.env.VITE_ANIMA_API_URL ?? '/api/anima/chat'

const INTERCEPT_ODDS: Partial<Record<LogType, number>> = {
  WIN: 0.45, FIX: 1.0, DEBRIEF: 0.5, NOTE: 0.20, PERSONAL: 0.15,
}

let lastIntercept = 0
const COOLDOWN_MS = 45 * 60 * 1000

export function buildAnimaContext(userData: UserData): string {
  const today = todayString()
  const { displayXP, rank, nextRank } = calculateXPAndRank(userData)
  const tier = getStreakTier(userData.streak)
  const pct = completionPct(userData.tasks, userData.schedule)

  const recent30 = userData.history.slice(0, 30)
  const pillarCounts: Record<string, number> = {}
  recent30.forEach(e => { if (e.fTag) pillarCounts[e.fTag] = (pillarCounts[e.fTag] ?? 0) + 1 })

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  }).reverse()

  const sections: string[] = []

  sections.push(`WHY PROTOCOL:
Identity: ${userData.whyProtocol.identity}
Scene: ${userData.whyProtocol.scene}
Refusal: ${userData.whyProtocol.refusal}`)

  sections.push(`OPERATOR DOSSIER:
Date: ${today}
Rank: ${rank.name} (${displayXP} XP)${nextRank ? ` → next: ${nextRank.name} at ${nextRank.xp} XP` : ' (MAX RANK)'}
Streak: ${userData.streak} days | ${tier.label} (${tier.multiplier}×)`)

  sections.push(`TODAY'S PROTOCOL — ${pct}% complete (${Object.keys(userData.tasks).length}/${userData.schedule.length} blocks):
${userData.schedule.map(b => `  [${userData.tasks[b.id] ? 'DONE' : 'MISS'}] ${b.time} ${b.phase}`).join('\n')}`)

  sections.push(`7-DAY PATTERN:
${last7.map(date => {
    const pct = getDayCompletion(date, userData.habitHistory, userData.schedule)
    return `  ${date}: ${pct === -1 ? 'NO DATA' : `${pct}%`}`
  }).join('\n')}`)

  sections.push(`5F PILLAR ACTIVITY (last 30 logs):
${Object.entries(pillarCounts).map(([k, v]) => `  ${k}: ${v}`).join('\n') || '  None logged'}`)

  if (userData.goals.filter(g => g.state === 'STANDBY').length > 0) {
    sections.push(`ACTIVE DIRECTIVES:
${userData.goals.filter(g => g.state === 'STANDBY').map(g => `  [P${g.priority}][${g.fTag}] ${g.text}${g.deadline ? ` (due: ${g.deadline})` : ''}`).join('\n')}`)
  }

  if (userData.animaRules.length > 0) {
    sections.push(`ACCOUNTABILITY RULES:\n${userData.animaRules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}`)
  }

  sections.push(`RECENT FIELD LOGS (last 20):
${userData.history.slice(0, 20).map(e => `  [${e.type}]${e.fTag ? `[${e.fTag}]` : ''} ${e.text}`).join('\n')}`)

  return sections.join('\n\n')
}

export async function callAnima(messages: { role: string; content: string }[], context: string): Promise<AnimaResponse> {
  const fallbacks: AnimaResponse[] = [
    { message: "Uplink restored. The mission did not pause. What did you execute?", xp_award: 0, log_entry: null, insight: null, new_rule: null },
    { message: "Signal re-acquired. Gaps in the log have been noted. Report your status now.", xp_award: 0, log_entry: null, insight: null, new_rule: null },
    { message: "ANIMA online. Protocol review in progress. What are you executing right now?", xp_award: 0, log_entry: null, insight: null, new_rule: null },
  ]

  let attempt = 0
  while (attempt < 3) {
    try {
      const res = await fetch(ANIMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
      attempt++
    }
  }
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

export function fireAnimaIntercept(type: LogType, entry: LogEntry, userData: UserData) {
  const odds = INTERCEPT_ODDS[type] ?? 0
  if (Math.random() > odds) return
  const now = Date.now()
  if (now - lastIntercept < COOLDOWN_MS && type !== 'FIX') return
  lastIntercept = now

  const context = buildAnimaContext(userData)
  const messages = [{ role: 'user', content: `[${type} LOG]: ${entry.text}` }]

  callAnima(messages, context).then(resp => {
    if (!resp.message) return
    const event = new CustomEvent('anima:intercept', { detail: resp })
    window.dispatchEvent(event)
    if (resp.xp_award && resp.xp_award > 0) {
      const applyXp = (window as unknown as Record<string, unknown>).__lgx_applyXp as ((id: string, xp: number) => void) | undefined
      applyXp?.(entry.id, resp.xp_award)
    }
  })
}
