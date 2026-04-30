import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { todayString, getDayCompletion } from '../lib/xp'

export default function MetricsView() {
  const [subview, setSubview] = useState<'grid' | 'calendar'>('grid')

  return (
    <div className="p-4 md:p-6 pb-32 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="sync-pulse" />
          <span className="mono text-xs tracking-widest" style={{ color: '#10b981' }}>TELEMETRY</span>
        </div>
        <div className="flex rounded overflow-hidden border" style={{ borderColor: '#1a1a1a' }}>
          {(['grid', 'calendar'] as const).map(v => (
            <button
              key={v}
              onClick={() => setSubview(v)}
              className="mono text-[10px] px-3 py-1.5 tracking-widest"
              style={{
                background: subview === v ? '#10b981' : 'transparent',
                color: subview === v ? '#000' : '#555',
                border: 'none',
              }}
            >
              {v === 'grid' ? '7-DAY GRID' : 'CALENDAR'}
            </button>
          ))}
        </div>
      </div>

      {subview === 'grid' ? <SevenDayGrid /> : <MonthCalendar />}
    </div>
  )
}

function SevenDayGrid() {
  const { userData } = useApp()
  const today = todayString()

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  }).reverse()

  return (
    <div className="space-y-4">
      <div className="grid gap-1" style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}>
        <div className="mono text-[9px]" style={{ color: '#333' }}>BLOCK</div>
        {last7.map(date => (
          <div key={date} className="mono text-[9px] text-center" style={{ color: date === today ? '#10b981' : '#333' }}>
            {new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' })}
          </div>
        ))}

        {userData.schedule.map(block => (
          <React.Fragment key={block.id}>
            <div className="mono text-[10px] py-1 pr-2 truncate" style={{ color: '#666' }}>{block.phase}</div>
            {last7.map(date => {
              const dayData = date === today ? userData.tasks : (userData.habitHistory[date] ?? {})
              const done = !!dayData[block.id]
              return (
                <div
                  key={date}
                  className={`telemetry-cell ${done ? 'win' : 'empty'}`}
                >
                  {done ? '✓' : ''}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}>
        <div className="mono text-[9px]" style={{ color: '#333' }}>COMPLETION</div>
        {last7.map(date => {
          const dayData = date === today ? userData.tasks : (userData.habitHistory[date] ?? null)
          const pct = dayData ? Math.round((Object.keys(dayData).length / userData.schedule.length) * 100) : -1
          return (
            <div key={date} className="mono text-[10px] text-center font-bold" style={{ color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f97316' : pct >= 0 ? '#ef4444' : '#333' }}>
              {pct >= 0 ? `${pct}%` : '—'}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Need React import for Fragment
import React from 'react'

function MonthCalendar() {
  const { userData } = useApp()
  const today = todayString()
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthStart = (firstDay + 6) % 7 // Mon-first

  const days: (string | null)[] = Array(monthStart).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  function getPct(date: string): number {
    if (date === today) return Math.round((Object.keys(userData.tasks).length / userData.schedule.length) * 100)
    return getDayCompletion(date, userData.habitHistory, userData.schedule)
  }

  function getCellColor(pct: number): string {
    if (pct < 0) return '#0a0a0a'
    if (pct >= 70) return 'rgba(16,185,129,0.25)'
    if (pct >= 40) return 'rgba(249,115,22,0.2)'
    return 'rgba(239,68,68,0.15)'
  }

  function getBorderColor(pct: number, isToday: boolean): string {
    if (isToday) return '#10b981'
    if (pct < 0) return '#111'
    if (pct >= 70) return 'rgba(16,185,129,0.4)'
    if (pct >= 40) return 'rgba(249,115,22,0.35)'
    return 'rgba(239,68,68,0.3)'
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="mono text-xs px-2 py-1" style={{ color: '#555', background: 'none', border: '1px solid #1a1a1a', borderRadius: '2px' }}>←</button>
        <span className="mono text-sm font-bold text-white">
          {viewDate.toLocaleDateString('en', { month: 'long', year: 'numeric' }).toUpperCase()}
        </span>
        <button onClick={nextMonth} className="mono text-xs px-2 py-1" style={{ color: '#555', background: 'none', border: '1px solid #1a1a1a', borderRadius: '2px' }}>→</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
          <span key={d} className="mono text-[9px]" style={{ color: '#333' }}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={i} />
          const pct = getPct(date)
          const isToday = date === today
          return (
            <button
              key={date}
              onClick={() => setSelectedDay(date === selectedDay ? null : date)}
              className="calendar-day"
              style={{
                background: getCellColor(pct),
                borderColor: getBorderColor(pct, isToday),
                outline: selectedDay === date ? '1px solid #f97316' : undefined,
              }}
            >
              <span className="mono text-[10px]" style={{ color: isToday ? '#10b981' : '#666' }}>
                {parseInt(date.slice(8))}
              </span>
              {pct >= 0 && (
                <span className="mono text-[8px] mt-auto" style={{ color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f97316' : '#ef4444' }}>
                  {pct}%
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedDay && <DayDetail date={selectedDay} />}

      <div className="flex gap-4 mt-2">
        <span className="mono text-[10px] flex items-center gap-1"><span style={{ color: '#10b981' }}>■</span> ≥70%</span>
        <span className="mono text-[10px] flex items-center gap-1"><span style={{ color: '#f97316' }}>■</span> 40-69%</span>
        <span className="mono text-[10px] flex items-center gap-1"><span style={{ color: '#ef4444' }}>■</span> &lt;40%</span>
        <span className="mono text-[10px] flex items-center gap-1"><span style={{ color: '#333' }}>■</span> No data</span>
      </div>
    </div>
  )
}

function DayDetail({ date }: { date: string }) {
  const { userData } = useApp()
  const today = todayString()
  const dayData = date === today ? userData.tasks : (userData.habitHistory[date] ?? {})
  const logs = userData.history.filter(e => e.date === date)

  return (
    <div className="p-4 rounded space-y-3" style={{ background: '#080808', border: '1px solid #1a1a1a' }}>
      <p className="mono text-xs font-bold text-white">{date}</p>
      <div className="space-y-1">
        {userData.schedule.map(block => (
          <div key={block.id} className="flex items-center gap-2">
            <span className="mono text-[10px]" style={{ color: dayData[block.id] ? '#10b981' : '#444' }}>
              {dayData[block.id] ? '✓' : '✗'}
            </span>
            <span className="mono text-[10px]" style={{ color: '#555' }}>{block.time}</span>
            <span className="text-xs" style={{ color: dayData[block.id] ? '#fff' : '#444' }}>{block.phase}</span>
          </div>
        ))}
      </div>
      {logs.length > 0 && (
        <div className="border-t pt-3" style={{ borderColor: '#1a1a1a' }}>
          <p className="mono text-[10px] mb-2" style={{ color: '#555' }}>FIELD LOGS</p>
          {logs.map(e => (
            <p key={e.id} className="text-xs mb-1" style={{ color: '#888' }}>
              <span style={{ color: '#444' }}>[{e.type}]</span> {e.text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
