import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_USER_DATA } from '../types'
import type { UserData, LogEntry, LogType, Goal, Book, ScheduleBlock, FTag, OracleMessage } from '../types'
import { loadLocalProfile, saveLocalProfile, loadLocalHistory, saveLocalHistory, cloudSave, cloudLoad, checkUplink } from '../lib/storage'
import { todayString, completionPct, getBlockXP } from '../lib/xp'
import { detect5FContext, detectAll5FContext } from '../lib/detect5f'

interface AppContextValue {
  userData: UserData
  uid: string
  showToast: (msg: string) => void
  addLog: (type: LogType, text: string) => Promise<LogEntry>
  deleteLog: (id: string) => void
  toggleTask: (blockId: string) => void
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoalState: (id: string, state: Goal['state']) => void
  deleteGoal: (id: string) => void
  addBook: (book: Omit<Book, 'id' | 'completed'>) => void
  updateBookProgress: (id: string, current: number) => void
  completeBook: (id: string) => void
  deleteBook: (id: string) => void
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => void
  deleteScheduleBlock: (id: string) => void
  addOracleMessage: (msg: OracleMessage) => void
  updateUserData: (patch: Partial<UserData>) => void
  uplinkStatus: 'connecting' | 'online' | 'offline'
}

const AppCtx = createContext<AppContextValue | null>(null)
export const useApp = () => {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

interface Props { uid: string; children: React.ReactNode; onToast: (msg: string) => void }

export function AppProvider({ uid, children, onToast }: Props) {
  const [userData, setUserData] = useState<UserData>(() => {
    const local = loadLocalProfile(uid)
    const history = loadLocalHistory(uid)
    if (local) return { ...local, history }
    return DEFAULT_USER_DATA
  })
  const [uplinkStatus, setUplinkStatus] = useState<'connecting' | 'online' | 'offline'>('connecting')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // midnight rollover
  useEffect(() => {
    const today = todayString()
    setUserData(prev => {
      if (prev.lastLogin === today) return prev
      let next = { ...prev }
      if (prev.lastLogin && prev.lastLogin !== today) {
        const doneCount = Object.keys(prev.tasks).length
        const threshold = Math.ceil(prev.schedule.length * 0.7)
        const streakEarned = doneCount >= threshold
        next = {
          ...next,
          streak: streakEarned ? prev.streak + 1 : 0,
          habitHistory: { ...prev.habitHistory, [prev.lastLogin]: prev.tasks },
          tasks: {},
          taskXp: {},
        }
      }
      return { ...next, lastLogin: today }
    })
  }, [])

  const scheduleSave = useCallback((data: UserData) => {
    saveLocalProfile(uid, data)
    saveLocalHistory(uid, data.history)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => cloudSave(uid, data).catch(() => {}), 1500)
  }, [uid])

  const update = useCallback((updater: (prev: UserData) => UserData) => {
    setUserData(prev => {
      const next = updater(prev)
      scheduleSave(next)
      return next
    })
  }, [scheduleSave])

  const updateUserData = useCallback((patch: Partial<UserData>) => {
    update(prev => ({ ...prev, ...patch }))
  }, [update])

  // cloud uplink
  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>
    async function connect() {
      const ok = await checkUplink()
      if (!ok) {
        setUplinkStatus('offline')
        retryTimer = setTimeout(connect, 30000)
        return
      }
      setUplinkStatus('online')
      onToast('>> UPLINK ESTABLISHED')
      const cloud = await cloudLoad(uid)
      if (!cloud) return
      setUserData(prev => {
        if (cloud.xp >= prev.xp) {
          const merged = { ...cloud, history: mergeHistory(cloud.history, prev.history) }
          saveLocalProfile(uid, merged)
          saveLocalHistory(uid, merged.history)
          return merged
        }
        return prev
      })
    }
    connect()
    return () => { if (retryTimer) clearTimeout(retryTimer) }
  }, [uid]) // eslint-disable-line

  function mergeHistory(a: LogEntry[], b: LogEntry[]): LogEntry[] {
    const map = new Map<string, LogEntry>()
    ;[...a, ...b].forEach(e => map.set(e.id, e))
    return Array.from(map.values()).sort((x, y) => y.timestamp - x.timestamp)
  }

  const addLog = useCallback(async (type: LogType, text: string): Promise<LogEntry> => {
    const now = new Date()
    const fTag = detect5FContext(text) ?? undefined
    const fTags = detectAll5FContext(text)
    const entry: LogEntry = {
      id: uuidv4(),
      type,
      text,
      timestamp: now.getTime(),
      date: todayString(),
      timeStr: now.toTimeString().slice(0, 5),
      fTag,
      fTags: fTags.length ? fTags : undefined,
    }
    update(prev => ({ ...prev, history: [entry, ...prev.history].slice(0, 500) }))
    return entry
  }, [update])

  const applyXpAward = useCallback((entryId: string, xp: number) => {
    update(prev => {
      const history = prev.history.map(e => e.id === entryId ? { ...e, xp_award: xp } : e)
      return { ...prev, xp: prev.xp + xp, history }
    })
  }, [update])

  ;(window as unknown as Record<string, unknown>).__lgx_applyXp = applyXpAward

  const deleteLog = useCallback((id: string) => {
    update(prev => {
      const entry = prev.history.find(e => e.id === id)
      const xpDeduct = entry?.xp_award ?? 0
      return {
        ...prev,
        xp: Math.max(0, prev.xp - xpDeduct),
        history: prev.history.filter(e => e.id !== id),
      }
    })
  }, [update])

  const toggleTask = useCallback((blockId: string) => {
    update(prev => {
      if (prev.tasks[blockId]) {
        const deduct = prev.taskXp[blockId] ?? 0
        const { [blockId]: _t, ...tasks } = prev.tasks
        const { [blockId]: _x, ...taskXp } = prev.taskXp
        return { ...prev, tasks, taskXp, xp: Math.max(0, prev.xp - deduct) }
      }
      const xpAward = getBlockXP(prev.streak)
      const block = prev.schedule.find(b => b.id === blockId)
      const proficiency = { ...prev.proficiency }
      if (block) {
        const base = Math.floor(Math.random() * 11) + 15
        block.f_tags.forEach((tag: FTag) => { proficiency[tag] = (proficiency[tag] ?? 0) + base })
      }
      return {
        ...prev,
        tasks: { ...prev.tasks, [blockId]: true },
        taskXp: { ...prev.taskXp, [blockId]: xpAward },
        xp: prev.xp + xpAward,
        proficiency,
      }
    })
  }, [update])

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    update(prev => ({
      ...prev,
      goals: [{ ...goal, id: uuidv4(), createdAt: Date.now() }, ...prev.goals],
    }))
  }, [update])

  const updateGoalState = useCallback((id: string, state: Goal['state']) => {
    update(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, state } : g) }))
  }, [update])

  const deleteGoal = useCallback((id: string) => {
    update(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))
  }, [update])

  const addBook = useCallback((book: Omit<Book, 'id' | 'completed'>) => {
    update(prev => ({ ...prev, books: [{ ...book, id: uuidv4(), completed: false }, ...prev.books] }))
  }, [update])

  const updateBookProgress = useCallback((id: string, current: number) => {
    update(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === id ? { ...b, current, completed: current >= b.total } : b),
    }))
  }, [update])

  const completeBook = useCallback((id: string) => {
    update(prev => ({ ...prev, books: prev.books.map(b => b.id === id ? { ...b, completed: true } : b) }))
  }, [update])

  const deleteBook = useCallback((id: string) => {
    update(prev => ({ ...prev, books: prev.books.filter(b => b.id !== id) }))
  }, [update])

  const addScheduleBlock = useCallback((block: Omit<ScheduleBlock, 'id'>) => {
    update(prev => ({
      ...prev,
      schedule: [...prev.schedule, { ...block, id: uuidv4() }].sort((a, b) => a.time.localeCompare(b.time)),
    }))
  }, [update])

  const deleteScheduleBlock = useCallback((id: string) => {
    update(prev => ({ ...prev, schedule: prev.schedule.filter(b => b.id !== id) }))
  }, [update])

  const addOracleMessage = useCallback((msg: OracleMessage) => {
    update(prev => ({
      ...prev,
      oracleHistory: [...prev.oracleHistory, msg].slice(-100),
    }))
  }, [update])

  ;(window as unknown as Record<string, unknown>).__lgx_completionPct = () =>
    completionPct(userData.tasks, userData.schedule)

  const value: AppContextValue = {
    userData, uid, showToast: onToast, addLog, deleteLog, toggleTask,
    addGoal, updateGoalState, deleteGoal,
    addBook, updateBookProgress, completeBook, deleteBook,
    addScheduleBlock, deleteScheduleBlock,
    addOracleMessage, updateUserData, uplinkStatus,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
