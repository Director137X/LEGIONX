import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props { onToast: (msg: string) => void }

type Mode = 'landing' | 'signin' | 'signup'

export default function AuthPage({ onToast }: Props) {
  const [mode, setMode] = useState<Mode>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        onToast('OPERATOR ENLISTED — CHECK EMAIL TO VERIFY')
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Authentication failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'landing') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
        <div className="hud-scanline" />

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
          <div className="flex items-center gap-2 mb-8">
            <div className="sync-pulse" />
            <span className="mono text-[10px] tracking-widest" style={{ color: '#10b981' }}>SYSTEM ONLINE</span>
          </div>

          <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white mb-4 text-center">
            LEGION<span style={{ color: '#10b981' }}>X</span>
          </h1>

          <p className="mono text-xs tracking-widest mb-2 text-center" style={{ color: '#555' }}>
            THE CRM FOR YOUR LIFE
          </p>

          <p className="text-sm max-w-sm text-center leading-relaxed mb-12" style={{ color: '#444' }}>
            Track goals, log wins, build streaks, and command every pillar of your life — finance, fitness, family, faith, and friends.
          </p>

          {/* 5F pillars */}
          <div className="flex gap-2 mb-12 flex-wrap justify-center">
            {[
              { label: 'FINANCE',  color: '#10b981' },
              { label: 'FITNESS',  color: '#ef4444' },
              { label: 'FAMILY',   color: '#3b82f6' },
              { label: 'FAITH',    color: '#f59e0b' },
              { label: 'FRIENDS',  color: '#ec4899' },
            ].map(p => (
              <span
                key={p.label}
                className="mono text-[9px] px-2.5 py-1 rounded"
                style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}33` }}
              >
                {p.label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode('signin')}
              className="mono text-xs px-6 py-3 font-bold"
              style={{ background: '#10b981', color: '#000', borderRadius: '2px', border: 'none' }}
            >
              SIGN IN
            </button>
            <button
              onClick={() => setMode('signup')}
              className="mono text-xs px-6 py-3"
              style={{ background: 'transparent', color: '#10b981', borderRadius: '2px', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              ENLIST
            </button>
          </div>
        </div>

        {/* Feature grid */}
        <div className="border-t px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto w-full" style={{ borderColor: '#111' }}>
          {[
            { label: 'DAILY PROTOCOL', desc: 'Build unstoppable routines' },
            { label: 'FIELD LOGS',     desc: 'Capture every win and lesson' },
            { label: 'DIRECTIVES',     desc: 'Goals with real accountability' },
            { label: 'ANIMA AI',       desc: 'Your tactical operator advisor' },
          ].map(f => (
            <div key={f.label}>
              <p className="mono text-[9px] tracking-widest mb-1" style={{ color: '#10b981' }}>{f.label}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#444' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="mono text-[10px] text-center pb-6" style={{ color: '#222' }}>
          LEGIONX COMMAND CENTER · CLASSIFIED
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#000' }}>
      <div className="hud-scanline" />
      <div className="w-full max-w-sm">

        <button
          onClick={() => { setMode('landing'); setError('') }}
          className="mono text-[10px] mb-8 flex items-center gap-1"
          style={{ color: '#444', background: 'none', border: 'none', padding: 0 }}
        >
          ← BACK
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-1">
            LEGION<span style={{ color: '#10b981' }}>X</span>
          </h1>
          <p className="mono text-[10px] tracking-widest" style={{ color: '#555' }}>
            {mode === 'signin' ? 'OPERATOR SIGN IN' : 'ENLIST AS OPERATOR'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mono text-[10px] tracking-widest block mb-1.5" style={{ color: '#555' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm"
              style={{ background: '#080808', border: '1px solid #222', borderRadius: '2px', color: '#fff' }}
              placeholder="operator@domain.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="mono text-[10px] tracking-widest block mb-1.5" style={{ color: '#555' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm"
              style={{ background: '#080808', border: '1px solid #222', borderRadius: '2px', color: '#fff' }}
              placeholder="••••••••••"
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="mono text-[10px] py-2 px-3 rounded leading-relaxed" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mono text-xs tracking-widest font-bold"
            style={{ background: '#10b981', color: '#000', border: 'none', borderRadius: '2px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'AUTHENTICATING...' : mode === 'signin' ? 'ACCESS TERMINAL' : 'INITIATE ENLISTMENT'}
          </button>
        </form>

        <p className="mono text-[10px] text-center mt-6" style={{ color: '#333' }}>
          {mode === 'signin' ? "No account? " : "Already enlisted? "}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            className="mono"
            style={{ color: '#10b981', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {mode === 'signin' ? 'ENLIST' : 'SIGN IN'}
          </button>
        </p>
      </div>
    </div>
  )
}
