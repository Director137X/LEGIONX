import { DEFAULT_USER_DATA } from '../types'
import type { UserData, LogEntry } from '../types'
import { FIRESTORE_BASE, ARTIFACTS_PATH } from './firebase'

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

function toFirestoreDoc(payload: unknown) {
  return { fields: { payload: { stringValue: JSON.stringify(payload) } } }
}

function fromFirestoreDoc(doc: Record<string, unknown>): unknown {
  try {
    const fields = doc.fields as Record<string, { stringValue?: string }>
    return JSON.parse(fields?.payload?.stringValue ?? 'null')
  } catch { return null }
}

async function getIdToken(): Promise<string | null> {
  const { auth } = await import('./firebase')
  if (!auth.currentUser) return null
  return auth.currentUser.getIdToken()
}

export async function restSaveProfile(uid: string, data: UserData) {
  const token = await getIdToken()
  if (!token) return
  const url = `${FIRESTORE_BASE}/${ARTIFACTS_PATH}/${uid}`
  await fetch(`${url}?updateMask.fieldPaths=payload`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestoreDoc(data)),
  }).catch(() => {})
}

export async function restPullProfile(uid: string): Promise<UserData | null> {
  const token = await getIdToken()
  if (!token) return null
  const url = `${FIRESTORE_BASE}/${ARTIFACTS_PATH}/${uid}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
  if (!res || !res.ok) return null
  const doc = await res.json().catch(() => null)
  if (!doc) return null
  const data = fromFirestoreDoc(doc) as UserData | null
  if (!data) return null
  return { ...DEFAULT_USER_DATA, ...data }
}

export async function restCheckAccess(): Promise<boolean> {
  const token = await getIdToken()
  if (!token) return false
  const res = await fetch(`${FIRESTORE_BASE}/${ARTIFACTS_PATH}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)
  return !!res && res.ok
}
