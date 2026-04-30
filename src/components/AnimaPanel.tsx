import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import type { OracleMessage } from '../types'
import { buildAnimaContext, callAnima } from '../lib/anima'

interface Props { onClose: () => void }

export default function AnimaPanel({ onClose }: Props) {
  const { userData, addOracleMessage, updateUserData, showToast } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = userData.oracleHistory.slice(-30)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg: OracleMessage = { role: 'user', content: input.trim(), timestamp: Date.now() }
    addOracleMessage(userMsg)
    setInput('')
    setLoading(true)

    const context = buildAnimaContext(userData)
    const chatMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    const resp = await callAnima(chatMessages, context)

    const animaMsg: OracleMessage = {
      role: 'assistant',
      content: resp.message || '...',
      xp_award: resp.xp_award ?? 0,
      log_entry: resp.log_entry,
      insight: resp.insight,
      timestamp: Date.now(),
    }
    addOracleMessage(animaMsg)

    if (resp.xp_award && resp.xp_award > 0) {
      updateUserData({ xp: userData.xp + resp.xp_award })
      showToast(`ANIMA AWARDED +${resp.xp_award} XP`)
    }
    if (resp.new_rule) {
      updateUserData({ animaRules: [...userData.animaRules, resp.new_rule] })
    }

    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(4px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#111' }}>
        <div className="flex items-center gap-3">
          <div className="sync-pulse" />
          <div>
            <p className="text-sm font-black tracking-widest text-white">ANIMA</p>
            <p className="mono text-[10px]" style={{ color: '#10b981' }}>ORACLE MODE — TACTICAL INTELLIGENCE ACTIVE</p>
          </div>
        </div>
        <button onClick={onClose} className="mono text-xs px-3 py-1" style={{ border: '1px solid #1a1a1a', borderRadius: '2px', color: '#555', background: 'none' }}>
          CLOSE
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl font-black text-white mb-2 laurel-glow">ANIMA</p>
            <p className="mono text-xs" style={{ color: '#444' }}>Tactical intelligence standing by.</p>
            <p className="mono text-xs mt-1" style={{ color: '#333' }}>Ask anything. Report your status. Face the truth.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-xs md:max-w-md px-4 py-3 rounded text-sm"
              style={{
                background: msg.role === 'user' ? 'rgba(16,185,129,0.1)' : '#0a0a0a',
                border: `1px solid ${msg.role === 'user' ? 'rgba(16,185,129,0.3)' : '#1a1a1a'}`,
                color: msg.role === 'user' ? '#fff' : '#e0e0e0',
              }}
            >
              {msg.role === 'assistant' && (
                <p className="mono text-[9px] mb-2" style={{ color: '#10b981' }}>ANIMA</p>
              )}
              <p className="leading-relaxed">{msg.content}</p>
              {msg.xp_award ? <p className="mono text-[10px] mt-1" style={{ color: '#10b981' }}>+{msg.xp_award} XP</p> : null}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', animation: `syncPulse 1s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t" style={{ borderColor: '#111' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Report status. Ask anything. Face the truth."
            className="flex-1 px-3 py-2 text-sm"
            style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: '2px', color: '#fff' }}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="mono text-xs px-4 py-2 font-bold"
            style={{ background: '#10b981', color: '#000', borderRadius: '2px', border: 'none' }}
          >
            {loading ? '...' : 'SEND'}
          </button>
        </div>
      </form>
    </div>
  )
}
