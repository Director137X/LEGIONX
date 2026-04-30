import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { FTAG_COLORS, FTAG_LABELS } from '../types'
import type { LogType, FTag } from '../types'
import jsPDF from 'jspdf'

const LOG_TYPES: LogType[] = ['WIN', 'FIX', 'NOTE', 'DEBRIEF', 'PERSONAL', 'INTEL', 'BRIEFING', 'GOAL']
const LOG_COLORS: Record<LogType, string> = {
  WIN: '#10b981', FIX: '#ef4444', NOTE: '#6b7280', DEBRIEF: '#f97316',
  PERSONAL: '#3b82f6', INTEL: '#8b5cf6', BRIEFING: '#fbbf24', GOAL: '#ec4899',
}

export default function ArchiveView() {
  const { userData, deleteLog, showToast } = useApp()
  const [filter, setFilter] = useState<LogType | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const filtered = userData.history.filter(e => {
    if (filter !== 'ALL' && e.type !== filter) return false
    if (fromDate && e.date < fromDate) return false
    if (toDate && e.date > toDate) return false
    if (search && !e.text.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // group by date
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, e) => {
    acc[e.date] = acc[e.date] ?? []
    acc[e.date].push(e)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  function handleDelete(id: string) {
    setPendingDelete(id)
    const t = setTimeout(() => {
      deleteLog(id)
      setPendingDelete(null)
      showToast('LOG DELETED')
    }, 5000)
    setUndoTimer(t)
    showToast('DELETING IN 5s — TAP TO UNDO')
  }

  function handleUndo() {
    if (undoTimer) clearTimeout(undoTimer)
    setPendingDelete(null)
    showToast('DELETION CANCELLED')
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('LEGIONX — FIELD ARCHIVE', 20, 20)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Exported: ${new Date().toLocaleString()} | Filter: ${filter} | Entries: ${filtered.length}`, 20, 28)

    let y = 36
    for (const date of sortedDates) {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(date, 20, y)
      y += 6

      for (const entry of grouped[date]) {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text(`[${entry.type}] ${entry.timeStr}`, 24, y)
        y += 4
        doc.setFont('helvetica', 'normal')
        const lines = doc.splitTextToSize(entry.text, 160)
        doc.text(lines, 24, y)
        y += lines.length * 4 + 2
      }
      y += 4
    }

    doc.save(`LegionX_Archive_${new Date().toISOString().slice(0, 10)}.pdf`)
    showToast('PDF EXPORTED')
  }

  return (
    <div className="p-4 md:p-6 pb-32 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="sync-pulse" />
          <span className="mono text-xs tracking-widest" style={{ color: '#10b981' }}>ARCHIVE</span>
        </div>
        <button onClick={exportPDF} className="mono text-[10px] px-3 py-1.5" style={{ border: '1px solid #1a1a1a', borderRadius: '2px', color: '#555', background: 'none' }}>
          EXPORT PDF
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilter('ALL')} className="mono text-[10px] px-2 py-1" style={{ borderRadius: '2px', border: `1px solid ${filter === 'ALL' ? '#10b981' : '#1a1a1a'}`, background: filter === 'ALL' ? 'rgba(16,185,129,0.1)' : 'transparent', color: filter === 'ALL' ? '#10b981' : '#444' }}>ALL</button>
          {LOG_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)} className="mono text-[10px] px-2 py-1" style={{ borderRadius: '2px', border: `1px solid ${filter === t ? LOG_COLORS[t] : '#1a1a1a'}`, background: filter === t ? `${LOG_COLORS[t]}18` : 'transparent', color: filter === t ? LOG_COLORS[t] : '#444' }}>{t}</button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH LOGS..." className="w-full px-3 py-2 text-xs mono" style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: '2px', color: '#fff' }} />
        <div className="flex gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="flex-1 px-2 py-1 text-xs mono" />
          <span className="mono text-xs self-center" style={{ color: '#555' }}>→</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="flex-1 px-2 py-1 text-xs mono" />
        </div>
      </div>

      <p className="mono text-[10px]" style={{ color: '#555' }}>{filtered.length} ENTRIES</p>

      {pendingDelete && (
        <button onClick={handleUndo} className="w-full py-2 mono text-xs" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.4)', color: '#f97316', borderRadius: '2px' }}>
          ↩ UNDO DELETE
        </button>
      )}

      <div className="space-y-4">
        {sortedDates.map(date => (
          <div key={date}>
            <p className="mono text-[10px] mb-2 pb-1" style={{ color: '#444', borderBottom: '1px solid #111' }}>{date}</p>
            <div className="space-y-1">
              {grouped[date].map(entry => (
                <div
                  key={entry.id}
                  className="px-3 py-2 rounded flex items-start gap-2"
                  style={{
                    background: entry.id === pendingDelete ? 'rgba(239,68,68,0.05)' : '#080808',
                    border: `1px solid ${entry.id === pendingDelete ? 'rgba(239,68,68,0.3)' : '#111'}`,
                    opacity: entry.id === pendingDelete ? 0.5 : 1,
                  }}
                >
                  <span className="mono text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 mt-0.5" style={{ background: `${LOG_COLORS[entry.type]}18`, color: LOG_COLORS[entry.type], border: `1px solid ${LOG_COLORS[entry.type]}33` }}>
                    {entry.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white">{entry.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="mono text-[9px]" style={{ color: '#444' }}>{entry.timeStr}</span>
                      {entry.fTag && <span className="mono text-[9px]" style={{ color: FTAG_COLORS[entry.fTag as FTag] }}>{FTAG_LABELS[entry.fTag as FTag]}</span>}
                      {entry.xp_award ? <span className="mono text-[9px]" style={{ color: '#10b981' }}>+{entry.xp_award} XP</span> : null}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(entry.id)} className="mono text-[10px] flex-shrink-0 px-2 py-1" style={{ color: '#333', background: 'none', border: 'none' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="mono text-xs text-center py-8" style={{ color: '#333' }}>NO LOGS MATCH CURRENT FILTER</p>
        )}
      </div>
    </div>
  )
}
