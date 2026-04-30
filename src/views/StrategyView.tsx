import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { FTAG_COLORS } from '../types'
import type { Goal, Book, FTag } from '../types'

const PILLARS: FTag[] = ['finance', 'fitness', 'family', 'faith', 'friends']

function daysDiff(deadline: string): number {
  const d = new Date(deadline)
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function StrategyView() {
  return (
    <div className="p-4 md:p-6 pb-32 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-2">
        <div className="sync-pulse" />
        <span className="mono text-xs tracking-widest" style={{ color: '#10b981' }}>STRATEGY</span>
      </div>
      <GoalsSection />
      <BooksSection />
    </div>
  )
}

function GoalsSection() {
  const { userData, addGoal, updateGoalState, deleteGoal, showToast } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<1 | 2 | 3>(1)
  const [fTag, setFTag] = useState<FTag>('finance')
  const [deadline, setDeadline] = useState('')

  const standby = userData.goals.filter(g => g.state === 'STANDBY')
  const completed = userData.goals.filter(g => g.state === 'COMPLETED')
  const failed = userData.goals.filter(g => g.state === 'FAILED')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    addGoal({ text: text.trim(), state: 'STANDBY', priority, fTag, deadline: deadline || undefined })
    setText(''); setDeadline('')
    setShowAdd(false)
    showToast('DIRECTIVE ADDED')
  }

  const P_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#6b7280' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="mono text-[10px] tracking-widest" style={{ color: '#555' }}>DIRECTIVES — {standby.length} ACTIVE</p>
        <button onClick={() => setShowAdd(!showAdd)} className="mono text-[10px] px-3 py-1" style={{ border: '1px solid #1a1a1a', borderRadius: '2px', color: '#10b981', background: 'none' }}>
          + ADD DIRECTIVE
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 rounded space-y-3" style={{ background: '#080808', border: '1px solid #1a1a1a' }}>
          <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Directive text..." className="w-full px-3 py-2 text-sm" required />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mono text-[10px] block mb-1" style={{ color: '#555' }}>PRIORITY</label>
              <div className="flex gap-1">
                {([1, 2, 3] as (1|2|3)[]).map(p => (
                  <button key={p} type="button" onClick={() => setPriority(p)} className="flex-1 mono text-[10px] py-1" style={{ borderRadius: '2px', border: `1px solid ${priority === p ? P_COLORS[p] : '#1a1a1a'}`, background: priority === p ? `${P_COLORS[p]}18` : 'transparent', color: priority === p ? P_COLORS[p] : '#444' }}>P{p}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="mono text-[10px] block mb-1" style={{ color: '#555' }}>DEADLINE</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full px-2 py-1 text-xs" />
            </div>
          </div>
          <div>
            <label className="mono text-[10px] block mb-1" style={{ color: '#555' }}>5F PILLAR</label>
            <div className="flex gap-1 flex-wrap">
              {PILLARS.map(tag => (
                <button key={tag} type="button" onClick={() => setFTag(tag)} className="mono text-[10px] px-2 py-1" style={{ borderRadius: '2px', border: `1px solid ${fTag === tag ? FTAG_COLORS[tag] : '#1a1a1a'}`, background: fTag === tag ? `${FTAG_COLORS[tag]}18` : 'transparent', color: fTag === tag ? FTAG_COLORS[tag] : '#444' }}>{tag}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="mono text-xs px-4 py-2 font-bold" style={{ background: '#10b981', color: '#000', borderRadius: '2px', border: 'none' }}>ADD</button>
            <button type="button" onClick={() => setShowAdd(false)} className="mono text-xs px-4 py-2" style={{ background: 'transparent', color: '#555', border: '1px solid #1a1a1a', borderRadius: '2px' }}>CANCEL</button>
          </div>
        </form>
      )}

      {standby.length === 0 && <p className="mono text-xs py-4 text-center" style={{ color: '#333' }}>NO ACTIVE DIRECTIVES</p>}

      <div className="space-y-2">
        {standby.sort((a, b) => a.priority - b.priority).map(goal => (
          <GoalCard key={goal.id} goal={goal} onComplete={() => { updateGoalState(goal.id, 'COMPLETED'); showToast('DIRECTIVE COMPLETE') }} onFail={() => { updateGoalState(goal.id, 'FAILED'); showToast('DIRECTIVE FAILED') }} onDelete={() => { deleteGoal(goal.id); showToast('DIRECTIVE REMOVED') }} />
        ))}
      </div>

      {completed.length > 0 && (
        <details className="group">
          <summary className="mono text-[10px] cursor-pointer" style={{ color: '#444' }}>COMPLETED ({completed.length})</summary>
          <div className="mt-2 space-y-1 opacity-50">
            {completed.map(g => <GoalCard key={g.id} goal={g} onDelete={() => deleteGoal(g.id)} />)}
          </div>
        </details>
      )}

      {failed.length > 0 && (
        <details>
          <summary className="mono text-[10px] cursor-pointer" style={{ color: '#444' }}>FAILED ({failed.length})</summary>
          <div className="mt-2 space-y-1 opacity-40">
            {failed.map(g => <GoalCard key={g.id} goal={g} onDelete={() => deleteGoal(g.id)} />)}
          </div>
        </details>
      )}
    </div>
  )
}

function GoalCard({ goal, onComplete, onFail, onDelete }: { goal: Goal; onComplete?: () => void; onFail?: () => void; onDelete: () => void }) {
  const P_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#6b7280' }
  const diff = goal.deadline ? daysDiff(goal.deadline) : null
  const overdue = diff !== null && diff < 0

  return (
    <div className="px-3 py-3 rounded flex items-start gap-2" style={{ background: '#080808', border: '1px solid #111' }}>
      <span className="mono text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ background: `${P_COLORS[goal.priority]}18`, color: P_COLORS[goal.priority], border: `1px solid ${P_COLORS[goal.priority]}33` }}>P{goal.priority}</span>
      <span className="mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${FTAG_COLORS[goal.fTag]}18`, color: FTAG_COLORS[goal.fTag], border: `1px solid ${FTAG_COLORS[goal.fTag]}33` }}>{goal.fTag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white">{goal.text}</p>
        {goal.deadline && (
          <p className="mono text-[9px] mt-1" style={{ color: overdue ? '#ef4444' : '#555' }}>
            {overdue ? `OVERDUE ${Math.abs(diff!)}d` : `T-${diff}d`}
          </p>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {onComplete && <button onClick={onComplete} className="mono text-[9px] px-1.5 py-1" style={{ border: '1px solid rgba(16,185,129,0.3)', borderRadius: '2px', color: '#10b981', background: 'none' }}>✓</button>}
        {onFail && <button onClick={onFail} className="mono text-[9px] px-1.5 py-1" style={{ border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2px', color: '#ef4444', background: 'none' }}>✗</button>}
        <button onClick={onDelete} className="mono text-[9px] px-1.5 py-1" style={{ border: '1px solid #1a1a1a', borderRadius: '2px', color: '#444', background: 'none' }}>×</button>
      </div>
    </div>
  )
}

function BooksSection() {
  const { userData, addBook, updateBookProgress, completeBook, deleteBook, showToast } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<Book['type']>('Pages')
  const [total, setTotal] = useState('')
  const [editProgress, setEditProgress] = useState<Record<string, string>>({})

  const active = userData.books.filter(b => !b.completed)
  const done = userData.books.filter(b => b.completed)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !total) return
    addBook({ title: title.trim(), type, total: parseInt(total), current: 0 })
    setTitle(''); setTotal(''); setShowAdd(false)
    showToast('INTEL SOURCE ADDED')
  }

  function handleProgress(book: Book) {
    const val = parseInt(editProgress[book.id] ?? String(book.current))
    if (isNaN(val)) return
    updateBookProgress(book.id, Math.min(val, book.total))
    setEditProgress(prev => { const n = { ...prev }; delete n[book.id]; return n })
    showToast('PROGRESS UPDATED')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="mono text-[10px] tracking-widest" style={{ color: '#555' }}>INTEL IN PROGRESS — {active.length}</p>
        <button onClick={() => setShowAdd(!showAdd)} className="mono text-[10px] px-3 py-1" style={{ border: '1px solid #1a1a1a', borderRadius: '2px', color: '#10b981', background: 'none' }}>
          + ADD INTEL
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 rounded space-y-3" style={{ background: '#080808', border: '1px solid #1a1a1a' }}>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Book / course / resource title..." className="w-full px-3 py-2 text-sm" required />
          <div className="flex gap-2">
            <select value={type} onChange={e => setType(e.target.value as Book['type'])} className="flex-1 px-2 py-1 text-xs mono">
              <option>Pages</option>
              <option>Chapters</option>
              <option>Modules</option>
            </select>
            <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="Total" className="w-24 px-2 py-1 text-xs" min="1" required />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="mono text-xs px-4 py-2 font-bold" style={{ background: '#10b981', color: '#000', borderRadius: '2px', border: 'none' }}>ADD</button>
            <button type="button" onClick={() => setShowAdd(false)} className="mono text-xs px-4 py-2" style={{ background: 'transparent', color: '#555', border: '1px solid #1a1a1a', borderRadius: '2px' }}>CANCEL</button>
          </div>
        </form>
      )}

      {active.length === 0 && <p className="mono text-xs py-4 text-center" style={{ color: '#333' }}>NO ACTIVE INTEL SOURCES</p>}

      <div className="space-y-2">
        {active.map(book => {
          const pct = Math.round((book.current / book.total) * 100)
          return (
            <div key={book.id} className="px-3 py-3 rounded" style={{ background: '#080808', border: '1px solid #111' }}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-bold truncate">{book.title}</p>
                  <p className="mono text-[10px] mt-0.5" style={{ color: '#555' }}>{book.current}/{book.total} {book.type} · {pct}%</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => completeBook(book.id)} className="mono text-[9px] px-1.5 py-1" style={{ border: '1px solid rgba(16,185,129,0.3)', borderRadius: '2px', color: '#10b981', background: 'none' }}>DONE</button>
                  <button onClick={() => deleteBook(book.id)} className="mono text-[9px] px-1.5 py-1" style={{ border: '1px solid #1a1a1a', borderRadius: '2px', color: '#444', background: 'none' }}>×</button>
                </div>
              </div>
              <div className="metric-bar mt-2">
                <div className="metric-fill" style={{ width: `${pct}%`, background: '#8b5cf6' }} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={editProgress[book.id] ?? book.current}
                  onChange={e => setEditProgress(prev => ({ ...prev, [book.id]: e.target.value }))}
                  className="w-16 px-2 py-1 text-xs"
                  min="0"
                  max={book.total}
                />
                <button onClick={() => handleProgress(book)} className="mono text-[10px] px-2 py-1" style={{ border: '1px solid #1a1a1a', borderRadius: '2px', color: '#555', background: 'none' }}>LOG PROGRESS</button>
              </div>
            </div>
          )
        })}
      </div>

      {done.length > 0 && (
        <details>
          <summary className="mono text-[10px] cursor-pointer" style={{ color: '#444' }}>COMPLETED INTEL ({done.length})</summary>
          <div className="mt-2 space-y-1 opacity-40">
            {done.map(book => (
              <div key={book.id} className="px-3 py-2 rounded flex items-center justify-between" style={{ background: '#080808', border: '1px solid #111' }}>
                <div>
                  <p className="text-xs text-white">{book.title}</p>
                  <p className="mono text-[10px]" style={{ color: '#10b981' }}>COMPLETE — {book.total} {book.type}</p>
                </div>
                <button onClick={() => deleteBook(book.id)} className="mono text-[9px] px-1.5 py-1" style={{ border: '1px solid #1a1a1a', borderRadius: '2px', color: '#444', background: 'none' }}>×</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
