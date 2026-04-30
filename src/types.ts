export type FTag = 'finance' | 'fitness' | 'family' | 'faith' | 'friends'

export type LogType = 'WIN' | 'FIX' | 'NOTE' | 'DEBRIEF' | 'PERSONAL' | 'INTEL' | 'BRIEFING' | 'GOAL'

export interface LogEntry {
  id: string
  type: LogType
  text: string
  timestamp: number
  date: string
  timeStr: string
  fTag?: FTag
  fTags?: FTag[]
  xp_award?: number
}

export interface OracleMessage {
  role: 'user' | 'assistant'
  content: string
  xp_award?: number
  log_entry?: string | null
  insight?: string | null
  timestamp: number
}

export interface Goal {
  id: string
  text: string
  state: 'STANDBY' | 'COMPLETED' | 'FAILED'
  priority: 1 | 2 | 3
  fTag: FTag
  deadline?: string
  createdAt: number
}

export interface Book {
  id: string
  title: string
  type: 'Pages' | 'Chapters' | 'Modules'
  total: number
  current: number
  completed: boolean
}

export interface ScheduleBlock {
  id: string
  time: string
  phase: string
  desc: string
  f_tags: FTag[]
}

export interface UserData {
  tasks: Record<string, boolean>
  taskXp: Record<string, number>
  habitHistory: Record<string, Record<string, boolean>>
  history: LogEntry[]
  oracleHistory: OracleMessage[]
  goals: Goal[]
  books: Book[]
  schedule: ScheduleBlock[]
  proficiency: Record<FTag, number>
  streak: number
  xp: number
  xpFloor: number
  currentRank: string
  lastLogin: string
  animaRules: string[]
  animaMemories: string[]
  whyProtocol: {
    identity: string
    scene: string
    refusal: string
  }
}

export interface AnimaResponse {
  message: string
  xp_award: number
  log_entry: string | null
  insight: string | null
  new_rule: string | null
}

export const FTAG_COLORS: Record<FTag, string> = {
  finance: '#10b981',
  fitness: '#ef4444',
  family: '#3b82f6',
  faith: '#fbbf24',
  friends: '#ec4899',
}

export const FTAG_LABELS: Record<FTag, string> = {
  finance: 'FINANCE',
  fitness: 'FITNESS',
  family: 'FAMILY',
  faith: 'FAITH',
  friends: 'FRIENDS',
}

export const RANK_THRESHOLDS: { name: string; xp: number; color: string }[] = [
  { name: 'RECRUIT',    xp: 0,      color: '#64748b' },
  { name: 'LEGIONARY',  xp: 100,    color: '#22c55e' },
  { name: 'CENTURION',  xp: 300,    color: '#eab308' },
  { name: 'OPTIO',      xp: 700,    color: '#a855f7' },
  { name: 'PRAETORIAN', xp: 1500,   color: '#f97316' },
  { name: 'TRIBUNE',    xp: 3000,   color: '#06b6d4' },
  { name: 'LEGATE',     xp: 5500,   color: '#ef4444' },
  { name: 'PROCONSUL',  xp: 9500,   color: '#8b5cf6' },
  { name: 'CONSUL',     xp: 16000,  color: '#f43f5e' },
  { name: 'AUGUSTUS',   xp: 26000,  color: '#fbbf24' },
]

export const STREAK_TIERS: { days: number; multiplier: number; label: string }[] = [
  { days: 0,  multiplier: 1.0, label: 'TIRO' },
  { days: 7,  multiplier: 1.5, label: 'PRINCEPS' },
  { days: 14, multiplier: 2.0, label: 'TRIARIUS' },
  { days: 21, multiplier: 2.5, label: 'EVOCATUS' },
  { days: 28, multiplier: 3.0, label: 'AQUILIFER' },
  { days: 35, multiplier: 3.5, label: 'PRIMIPILUS' },
  { days: 42, multiplier: 4.0, label: 'IMPERATOR' },
]

export const PROFICIENCY_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]

export const WHY_PULSE_LINES = [
  'Aquí está tu casa.',
  'Their sacrifice was not in vain.',
  'The father who never broke.',
  'Rose from absolute nothing.',
  'Every humiliation became power.',
  'Not the man who chose comfort.',
  'Legacy echoing for generations.',
  'Tu mamá. Tu papá. Execute.',
]

export const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  { id: 'p1', time: '05:30', phase: 'THE AWAKENING',   desc: 'Morning protocol activation', f_tags: ['fitness'] },
  { id: 'p2', time: '06:00', phase: 'DEEP RESEARCH',   desc: 'Study, learn, acquire intel',  f_tags: ['finance'] },
  { id: 'p3', time: '07:30', phase: 'PHYSICAL PRIME',  desc: 'Training and conditioning',     f_tags: ['fitness'] },
  { id: 'p4', time: '09:00', phase: 'DEEP WORK BLOCK', desc: 'High-output execution window',  f_tags: ['finance'] },
  { id: 'p5', time: '13:00', phase: 'FIELD COMMAND',   desc: 'Client and business execution', f_tags: ['finance'] },
  { id: 'p6', time: '18:00', phase: 'DECOMPRESS',      desc: 'Family and recovery time',      f_tags: ['family'] },
  { id: 'p7', time: '20:30', phase: 'THE ARCHITECT',   desc: 'Planning and faith reflection',  f_tags: ['finance', 'faith'] },
]

export const DEFAULT_USER_DATA: UserData = {
  tasks: {},
  taskXp: {},
  habitHistory: {},
  history: [],
  oracleHistory: [],
  goals: [],
  books: [],
  schedule: DEFAULT_SCHEDULE,
  proficiency: { finance: 0, fitness: 0, family: 0, faith: 0, friends: 0 },
  streak: 0,
  xp: 0,
  xpFloor: 0,
  currentRank: 'RECRUIT',
  lastLogin: '',
  animaRules: [],
  animaMemories: [],
  whyProtocol: {
    identity: "I am the man who rose from absolute nothing, turned every humiliation and pain into unbreakable power, and built a legacy of massive wealth, resilience, and inspiration that will echo for generations — proving to my parents, my children, and the world exactly what is possible.",
    scene: "My parents' faces the exact moment I hand them the keys to their new house and tell them 'Aquí está tu casa' — the tears in my mother's eyes, the pride in my father's, knowing their sacrifice was not in vain. Then my own children looking at me as the father who never broke.",
    refusal: "I refuse to be the man who stayed small, accepted average, let his parents' blood and sacrifice be wasted, watched his family suffer while he chose comfort, and died ordinary — the man whose children learn that even his father surrendered.",
  },
}
