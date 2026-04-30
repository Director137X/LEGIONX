import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { WHY_PULSE_LINES } from '../types'
import type { AnimaResponse } from '../types'
import { completionPct } from '../lib/xp'
import { buildAnimaContext, callAnima } from '../lib/anima'
import AnimaPanel from './AnimaPanel'

let lastProactiveFire = 0
const COOLDOWN_MS = 45 * 60 * 1000
const firedThisSession = new Set<string>()

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function AnimaProactive() {
  const { userData, showToast, addOracleMessage, updateUserData } = useApp()
  const [panelOpen, setPanelOpen] = useState(false)
  const [notification, setNotification] = useState<AnimaResponse | null>(null)
  const [whyLine, setWhyLine] = useState('')
  const whyQueue = useRef<string[]>([])
  const whyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // WHY pulse lines rotation
  const advanceWhy = useCallback(() => {
    if (whyQueue.current.length === 0) {
      whyQueue.current = shuffled(WHY_PULSE_LINES)
    }
    setWhyLine(whyQueue.current.shift() ?? '')
    whyTimeout.current = setTimeout(advanceWhy, 7000)
  }, [])

  useEffect(() => {
    advanceWhy()
    return () => { if (whyTimeout.current) clearTimeout(whyTimeout.current) }
  }, [advanceWhy])

  // ANIMA intercept listener
  useEffect(() => {
    function handleIntercept(e: CustomEvent<AnimaResponse>) {
      setNotification(e.detail)
      if (e.detail.log_entry) {
        addOracleMessage({ role: 'assistant', content: e.detail.message, xp_award: e.detail.xp_award, timestamp: Date.now() })
      }
    }
    window.addEventListener('anima:intercept', handleIntercept as EventListener)
    return () => window.removeEventListener('anima:intercept', handleIntercept as EventListener)
  }, [addOracleMessage])

  // Proactive surveillance
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now()
      if (now - lastProactiveFire < COOLDOWN_MS) return

      const hour = new Date().getHours()
      const pct = completionPct(userData.tasks, userData.schedule)

      let trigger: string | null = null
      if (hour >= 18 && pct < 50 && !firedThisSession.has('protocol_risk')) {
        trigger = 'PROTOCOL AT RISK — it is after 18:00 and completion is below 50%. What is happening?'
        firedThisSession.add('protocol_risk')
      }

      if (!trigger) return

      lastProactiveFire = now
      const context = buildAnimaContext(userData)
      const resp = await callAnima([{ role: 'user', content: trigger }], context)
      if (resp.message) {
        setNotification(resp)
        if (resp.xp_award && resp.xp_award > 0) {
          updateUserData({ xp: userData.xp + resp.xp_award })
          showToast(`ANIMA +${resp.xp_award} XP`)
        }
      }
    }, 5 * 60 * 1000) // check every 5 min

    return () => clearInterval(interval)
  }, [userData, showToast, addOracleMessage, updateUserData])

  return (
    <>
      {panelOpen && <AnimaPanel onClose={() => setPanelOpen(false)} />}

      {/* Notification */}
      {notification && !panelOpen && (
        <div
          className="fixed top-4 left-1/2 z-[9990] w-full max-w-sm px-4 py-3 rounded lgx-fade-in"
          style={{
            transform: 'translateX(-50%)',
            background: '#090909',
            border: '1px solid rgba(16,185,129,0.4)',
            boxShadow: '0 0 30px rgba(16,185,129,0.1)',
          }}
        >
          <div className="flex items-start gap-2">
            <div className="sync-pulse mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="mono text-[10px] mb-1" style={{ color: '#10b981' }}>ANIMA</p>
              <p className="text-xs text-white leading-relaxed">{notification.message}</p>
              {notification.xp_award ? <p className="mono text-[10px] mt-1" style={{ color: '#10b981' }}>+{notification.xp_award} XP</p> : null}
            </div>
            <button
              onClick={() => setNotification(null)}
              className="mono text-[10px] flex-shrink-0"
              style={{ color: '#555', background: 'none', border: 'none' }}
            >×</button>
          </div>
          <button
            onClick={() => { setPanelOpen(true); setNotification(null) }}
            className="mono text-[10px] mt-2 w-full py-1"
            style={{ border: '1px solid rgba(16,185,129,0.2)', borderRadius: '2px', color: '#10b981', background: 'none' }}
          >
            OPEN ORACLE
          </button>
        </div>
      )}

      {/* Floating button + Why line */}
      <div className="fixed bottom-24 right-4 z-[9980] flex flex-col items-end gap-2">
        {whyLine && !panelOpen && (
          <div
            key={whyLine}
            className="lgx-why-fade max-w-[180px] text-right"
          >
            <p className="mono text-[10px] leading-relaxed" style={{ color: 'rgba(16,185,129,0.6)' }}>{whyLine}</p>
          </div>
        )}
        <button
          onClick={() => setPanelOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center laurel-glow"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.4)',
            boxShadow: '0 0 20px rgba(16,185,129,0.15)',
          }}
        >
          <span className="text-lg" style={{ color: '#10b981' }}>⚙</span>
        </button>
      </div>
    </>
  )
}
