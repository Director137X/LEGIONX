import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from './lib/firebase'
import { AppProvider } from './context/AppContext'
import AuthPage from './pages/AuthPage'
import Header from './components/Header'
import Toast from './components/Toast'
import AnimaProactive from './components/AnimaProactive'
import CommandView from './views/CommandView'
import MetricsView from './views/MetricsView'
import StatsView from './views/StatsView'
import ArchiveView from './views/ArchiveView'
import StrategyView from './views/StrategyView'

type Tab = 'hq' | 'telemetry' | 'warroom' | 'archive' | 'strategy'

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: 'hq',       label: 'HQ',        short: 'HQ' },
  { id: 'telemetry',label: 'TELEMETRY', short: 'TEL' },
  { id: 'warroom',  label: 'WAR ROOM',  short: 'WAR' },
  { id: 'archive',  label: 'ARCHIVE',   short: 'ARC' },
  { id: 'strategy', label: 'STRATEGY',  short: 'STR' },
]

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('hq')
  const [toast, setToast] = useState<string | null>(null)
  const [uplinkStatus] = useState<'connecting' | 'online' | 'offline'>('connecting')

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="sync-pulse" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage onToast={showToast} />
  }

  return (
    <AppProvider uid={user.uid} onToast={showToast}>
      <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
        <div className="hud-scanline" />

        <Header uplinkStatus={uplinkStatus} />

        {/* Tab bar */}
        <nav className="flex border-b sticky top-[52px] z-50" style={{ background: '#000', borderColor: '#111' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 mono text-[10px] tracking-widest ${tab === t.id ? 'nav-active' : ''}`}
              style={{
                color: tab === t.id ? '#10b981' : '#444',
                background: 'none',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid #10b981' : '2px solid transparent',
              }}
            >
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
            </button>
          ))}
        </nav>

        {/* Views */}
        <main className="flex-1">
          {tab === 'hq'        && <CommandView />}
          {tab === 'telemetry' && <MetricsView />}
          {tab === 'warroom'   && <StatsView />}
          {tab === 'archive'   && <ArchiveView />}
          {tab === 'strategy'  && <StrategyView />}
        </main>

        <AnimaProactive />

        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      </div>
    </AppProvider>
  )
}
