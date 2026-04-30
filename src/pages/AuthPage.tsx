import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'

interface Props { onToast: (msg: string) => void }

export default function AuthPage({ onToast }: Props) {
  const [tab, setTab] = useState<'signin' | 'enlist'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (tab === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
        onToast('OPERATOR ENLISTED — WELCOME TO LEGIONX')
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Authentication failed'
      setError(msg.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#000' }}>
      <div className="hud-scanline" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="sync-pulse" />
            <span className="mono text-xs tracking-widest" style={{ color: '#10b981' }}>SYSTEM ONLINE</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white">
            LEGION<span style={{ color: '#10b981' }}>X</span>
          </h1>
          <p className="mono text-xs mt-2" style={{ color: '#444' }}>COMMAND CENTER · RESTRICTED ACCESS</p>
        </div>

        {/* Tab selector */}
        <div className="flex mb-6 border-b" style={{ borderColor: '#1a1a1a' }}>
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-2 text-xs mono tracking-widest ${tab === 'signin' ? 'nav-active' : ''}`}
            style={{ color: tab === 'signin' ? '#10b981' : '#444', background: 'none', border: 'none' }}
          >
            SIGN IN
          </button>
          <button
            onClick={() => setTab('enlist')}
            className={`flex-1 py-2 text-xs mono tracking-widest ${tab === 'enlist' ? 'nav-active' : ''}`}
            style={{ color: tab === 'enlist' ? '#10b981' : '#444', background: 'none', border: 'none' }}
          >
            ENLIST
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mono text-[10px] tracking-widest block mb-1" style={{ color: '#555' }}>
              OPERATOR EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm"
              style={{ background: '#080808', border: '1px solid #222', color: '#fff' }}
              placeholder="operator@legionx.io"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mono text-[10px] tracking-widest block mb-1" style={{ color: '#555' }}>
              SECURITY CYPHER
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm"
              style={{ background: '#080808', border: '1px solid #222', color: '#fff' }}
              placeholder="••••••••••"
              required
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="mono text-xs py-2 px-3 rounded" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mono text-xs tracking-widest font-bold"
            style={{ background: '#10b981', color: '#000', border: 'none', borderRadius: '2px' }}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS TERMINAL'}
          </button>
        </form>

        <p className="mono text-[10px] text-center mt-8" style={{ color: '#222' }}>
          LEGIONX COMMAND CENTER · CLASSIFIED
        </p>
      </div>
    </div>
  )
}
