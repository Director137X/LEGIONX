import { supabase } from './supabase'
import { DEFAULT_USER_DATA } from '../types'
import type { UserData, LogEntry } from '../types'

function profileKey(uid: string) { return `lgx_v2_${uid}_profile` }
function historyKey(uid: string) { return `lgx_v2_${uid}_history` }

export function loadLocalProfile(uid: string): UserData | null {
  try {
    const raw = localStorage.getItem(profileKey(uid))
    if (!raw) return null
    return { ...DEFAULT_USER_DATA, ...JSON.parse(raw) }
  } catch { return null }
}

export function saveLocalProfile(uid: string, data: UserData) {
  const { history: _h, ...profile } = data
  localStorage.setItem(profileKey(uid), JSON.stringify(profile))
}

export function loadLocalHistory(uid: string): LogEntry[] {
  try {
    const raw = localStorage.getItem(historyKey(uid))
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

export function saveLocalHistory(uid: string, history: LogEntry[]) {
  localStorage.setItem(historyKey(uid), JSON.stringify(history.slice(0, 500)))
}

export async function cloudSave(uid: string, data: UserData): Promise<void> {
  await supabase
    .from('profiles')
    .upsert({ id: uid, data, updated_at: new Date().toISOString() })
}

export async function cloudLoad(uid: string): Promise<UserData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('data')
    .eq('id', uid)
    .single()
  if (error || !data) return null
  return { ...DEFAULT_USER_DATA, ...(data.data as UserData) }
}

export async function checkUplink(): Promise<boolean> {
  const { error } = await supabase.from('profiles').select('id').limit(1)
  return !error
}
