import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { FTAG_COLORS, FTAG_LABELS } from '../types'
import type { FTag, LogType, ScheduleBlock } from '../types'
import { todayString } from '../lib/xp'
import { fireAnimaIntercept } from '../lib/anima'

const LOG_TYPES: LogType[] = ['WIN', 'FIX', 'NOTE', 'DEBRIEF', 'PERSONAL', 'INTEL']

const LOG_COLORS: Record<LogType, string> = {
  WIN:      '#10b981',
  FIX:      '#ef4444',
  NOTE:     '#6b7280',
  DEBRIEF:  '#f97316',
  PERSONAL: '#3b82f6',
  INTEL:    '#8b5cf6',
  BRIEFING: '#fbbf24',
  GOAL:     '#ec4899',
}

function getActiveBlock(schedule: ScheduleBlock[]): ScheduleBlock | null {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  let active: ScheduleBlock | null = null
  for (const block of schedule) {
    const [h, m] = block.time.split(':').map(Number)
    const blockMins = h * 60 + m
    if (blockMins <= nowMins) active = block
  }
  return active
}

function getNextBlock(schedule: ScheduleBlock[]): ScheduleBlock | null {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  for (const block of schedule) {
    const [h, m] = block.time.split(':').map(Number)
    if (h * 60 + m > nowMins) return block
  }
  return null
}

export default function CommandView() {
  const { userData, toggleTask, addLog, showToast } = useApp()
  const [logText, setLogText] = useState('')
  const [logType, setLogType] = useState<LogType>('WIN')
  const [submitting, setSubmitting] = useState(false)
  const [showAddBlock, setShowAddBlock] = useState(false)
  const today = todayString()
  const activeBlock = getActiveBlock(userData.schedule)
  const nextBlock = getNextBlock(userData.schedule)
  const done = Object.keys(userData.tasks).length
  const total = userData.schedule.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!logText.trim()) return
    setSubmitting(true)
    const entry = await addLog(logType, logText.trim())
    setLogText('')
    showToast(`${logType} LOGGED`)
    setSubmitting(false)
    // ANIMA intercept
    fireAnimaIntercept(logType, entry, userData)
  }

  function handleToggle(blockId: string) {
    const wasDone = !!userData.tasks[blockId]
    toggleTask(blockId)
    if (!wasDone) showToast(`+XP AWARDED`)
  }

  const recentLogs = userData.history.filter(e => e.date === today).slice(0, 10)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-32">
      {/* Protocol header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="sync-pulse" />
            <span className="mono text-xs tracking-widest" style={{ color: '#10b981' }}>HQ — DAILY PROTOCOL</span>
          </div>
          <p className="mono text-[10px]" style={{ color: '#444' }}>{today}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{pct}<span className="text-sm" style={{ color: pct >= 70 ? '#10b981' : '#f97316' }}>%</span></p>
          <p className="mono text-[10px]" style={{ color: '#555' }}>{done}/{total} BLOCKS</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="metric-bar">
        <div className="metric-fill" style={{ width: `${pct}%`, background: pct >= 70 ? '#10b981' : pct >= 40 ? '#f97316' : '#ef4444' }} />
      </div>

      {/* Active block banner */}
      {activeBlock && (
        <div className="px-4 py-3 rounded" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="mono text-[10px] mb-1" style={{ color: '#10b981' }}>ACTIVE BLOCK</p>
          <p className="text-sm font-bold text-white">{activeBlock.phase}</p>
          {nextBlock && <p className="mono text-[10px] mt-1" style={{ color: '#444' }}>NEXT → {nextBlock.time} {nextBlock.phase}</p>}
        </div>
      )}

      {/* Schedule blocks */}
      <div className="space-y-1">
        <p className="mono text-[10px] tracking-widest mb-2" style={{ color: '#555' }}>DAILY PROTOCOL BLOCKS</p>
        {userData.schedule.map(block => {
          const done = !!userData.tasks[block.id]
          const isActive = activeBlock?.id === block.id
          return (
            <div
              key={block.id}
              className={`schedule-row ${done ? 'completed' : ''} px-4 py-3 rounded cursor-pointer flex items-center justify-between`}
              style={{ border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent', background: isActive ? 'rgba(16,185,129,0.03)' : undefined }}
              onClick={() => handleToggle(block.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    border: done ? 'none' : '1px solid #333',
                    background: done ? '#10b981' : 'transparent',
                  }}
                >
                  {done && <span className="text-black text-xs font-black">✓</span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[10px]" style={{ color: '#555' }}>{block.time}</span>
                    <span className="text-sm font-bold text-white">{block.phase}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#555' }}>{block.desc}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {block.f_tags.map(tag => (
                  <span key={tag} className="mono text-[9px] px-1 py-0.5 rounded" style={{ background: `${FTAG_COLORS[tag]}18`, color: FTAG_COLORS[tag], border: `1px solid ${FTAG_COLORS[tag]}33` }}>
                    {tag.slice(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        <button
          onClick={() => setShowAddBlock(!showAddBlock)}
          className="w-full py-2 mono text-[10px] tracking-widest"
          style={{ border: '1px dashed #1a1a1a', borderRadius: '2px', color: '#333', background: 'none' }}
        >
          + ADD BLOCK
        </button>
      </div>

      {showAddBlock && <AddBlockForm onAdd={() => setShowAddBlock(false)} />}

      {/* Log entry */}
      <div>
        <p className="mono text-[10px] tracking-widest mb-3" style={{ color: '#555' }}>FIELD LOG ENTRY</p>
        <form onSubmit={handleLogSubmit} className="space-y-2">
          <div className="flex gap-1 flex-wrap">
            {LOG_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setLogType(t)}
                className="mono text-[10px] px-2 py-1"
                style={{
                  borderRadius: '2px',
                  border: `1px solid ${logType === t ? LOG_COLORS[t] : '#1a1a1a'}`,
                  background: logType === t ? `${LOG_COLORS[t]}18` : 'transparent',
                  color: logType === t ? LOG_COLORS[t] : '#444',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={logText}
            onChange={e => setLogText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm resize-none"
            style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: '2px', color: '#fff' }}
            placeholder="Report your status..."
          />
          <button
            type="submit"
            disabled={submitting || !logText.trim()}
            className="mono text-xs px-4 py-2 font-bold"
            style={{ background: LOG_COLORS[logType], color: '#000', borderRadius: '2px', border: 'none' }}
          >
            {submitting ? 'LOGGING...' : `SUBMIT ${logType}`}
          </button>
        </form>
      </div>

      {/* Today's logs */}
      {recentLogs.length > 0 && (
        <div>
          <p className="mono text-[10px] tracking-widest mb-2" style={{ color: '#555' }}>TODAY'S FIELD LOGS</p>
          <div className="space-y-1">
            {recentLogs.map(entry => (
              <div key={entry.id} className="px-3 py-2 rounded flex items-start gap-2" style={{ background: '#080808', border: '1px solid #111' }}>
                <span className="mono text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ background: `${LOG_COLORS[entry.type]}18`, color: LOG_COLORS[entry.type], border: `1px solid ${LOG_COLORS[entry.type]}33` }}>
                  {entry.type}
                </span>
                <p className="text-xs text-white flex-1">{entry.text}</p>
                {entry.fTag && (
                  <span className="mono text-[9px] flex-shrink-0" style={{ color: FTAG_COLORS[entry.fTag as FTag] }}>
                    {FTAG_LABELS[entry.fTag as FTag]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AddBlockForm({ onAdd }: { onAdd: () => void }) {
  const { addScheduleBlock, showToast } = useApp()
  const [time, setTime] = useState('12:00')
  const [phase, setPhase] = useState('')
  const [desc, setDesc] = useState('')
  const [tags, setTags] = useState<FTag[]>(['finance'])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phase.trim()) return
    addScheduleBlock({ time, phase: phase.toUpperCase(), desc, f_tags: tags })
    showToast('BLOCK ADDED')
    onAdd()
  }

  function toggleTag(tag: FTag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 rounded" style={{ background: '#080808', border: '1px solid #1a1a1a' }}>
      <p className="mono text-[10px] tracking-widest" style={{ color: '#10b981' }}>ADD SCHEDULE BLOCK</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mono text-[10px] block mb-1" style={{ color: '#555' }}>TIME</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="mono text-[10px] block mb-1" style={{ color: '#555' }}>PHASE NAME</label>
          <input type="text" value={phase} onChange={e => setPhase(e.target.value)} className="w-full px-2 py-1 text-sm" placeholder="DEEP WORK" />
        </div>
      </div>
      <div>
        <label className="mono text-[10px] block mb-1" style={{ color: '#555' }}>DESCRIPTION</label>
        <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-2 py-1 text-sm" placeholder="What this block is for" />
      </div>
      <div>
        <label className="mono text-[10px] block mb-1" style={{ color: '#555' }}>5F TAGS</label>
        <div className="flex gap-1 flex-wrap">
          {(['finance', 'fitness', 'family', 'faith', 'friends'] as FTag[]).map(tag => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)} className="mono text-[10px] px-2 py-1" style={{ borderRadius: '2px', border: `1px solid ${tags.includes(tag) ? FTAG_COLORS[tag] : '#1a1a1a'}`, background: tags.includes(tag) ? `${FTAG_COLORS[tag]}18` : 'transparent', color: tags.includes(tag) ? FTAG_COLORS[tag] : '#444' }}>
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="mono text-xs px-4 py-2 font-bold" style={{ background: '#10b981', color: '#000', borderRadius: '2px', border: 'none' }}>ADD</button>
        <button type="button" onClick={onAdd} className="mono text-xs px-4 py-2" style={{ background: 'transparent', color: '#555', border: '1px solid #1a1a1a', borderRadius: '2px' }}>CANCEL</button>
      </div>
    </form>
  )
}
