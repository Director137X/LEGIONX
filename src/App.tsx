import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, SUPABASE_CONFIGURED } from './lib/supabase'
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
  { id: 'hq',        label: 'HQ',        short: 'HQ'  },
  { id: 'telemetry', label: 'TELEMETRY', short: 'TEL' },
  { id: 'warroom',   label: 'WAR ROOM',  short: 'WAR' },
  { id: 'archive',   label: 'ARCHIVE',   short: 'ARC' },
  { id: 'strategy',  label: 'STRATEGY',  short: 'STR' },
]

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('hq')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const showToast = useCallback((msg: string) => setToast(msg), [])

  if (!SUPABASE_CONFIGURED) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: '#000' }}>
        <p className="mono text-xs tracking-widest" style={{ color: '#10b981' }}>LEGIONX</p>
        <div className="p-6 rounded max-w-sm w-full" style={{ background: '#080808', border: '1px solid rgba(239,68,68,0.4)' }}>
          <p className="mono text-[10px] mb-3" style={{ color: '#ef4444' }}>CONFIGURATION REQUIRED</p>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: '#888' }}>
            Add these environment variables to your Vercel project or <code className="mono text-[10px] px-1 rounded" style={{ background: '#111', color: '#10b981' }}>.env</code> file:
          </p>
          {['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].map(k => (
            <p key={k} className="mono text-[9px] px-2 py-1.5 rounded mb-1" style={{ background: '#111', color: '#6b7280' }}>{k}</p>
          ))}
        </div>
      </div>
    )
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="sync-pulse" />
      </div>
    )
  }

  if (!session) {
    return <AuthPage onToast={showToast} />
  }

  return (
    <AppProvider uid={session.user.id} onToast={showToast}>
      <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
        <div className="hud-scanline" />
        <Header />

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
