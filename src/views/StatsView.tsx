import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateXPAndRank, getStreakTier, getProficiencyLevel, getDayCompletion } from '../lib/xp'
import { FTAG_COLORS, FTAG_LABELS, PROFICIENCY_THRESHOLDS } from '../types'
import type { FTag } from '../types'
import { todayString } from '../lib/xp'

type Scope = '7' | '30' | '365'

export default function StatsView() {
  const { userData } = useApp()
  const { displayXP, rank, nextRank, xpIntoRank, xpNeeded, progress } = calculateXPAndRank(userData)
  const tier = getStreakTier(userData.streak)
  const [scope, setScope] = useState<Scope>('7')
  const today = todayString()

  const logTypeCounts = userData.history.slice(0, 30).reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1
    return acc
  }, {})

  const scopeDays = scope === '7' ? 7 : scope === '30' ? 30 : 365
  const chartDates = Array.from({ length: Math.min(scopeDays, 60) }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  }).reverse()

  const chartData = chartDates.map(date => {
    if (date === today) return Math.round((Object.keys(userData.tasks).length / (userData.schedule.length || 1)) * 100)
    return getDayCompletion(date, userData.habitHistory, userData.schedule)
  })

  const validData = chartData.filter(v => v >= 0)
  const avgPct = validData.length ? Math.round(validData.reduce((a, b) => a + b, 0) / validData.length) : 0

  return (
    <div className="p-4 md:p-6 pb-32 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <div className="sync-pulse" />
        <span className="mono text-xs tracking-widest" style={{ color: '#10b981' }}>WAR ROOM</span>
      </div>

      {/* Operator Status */}
      <div className="luxury-card rounded p-5 space-y-4">
        <p className="mono text-[10px] tracking-widest" style={{ color: '#555' }}>OPERATOR STATUS</p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl font-black" style={{ color: rank.color }}>{rank.name}</p>
            <p className="mono text-[10px]" style={{ color: '#555' }}>RANK · LEVEL {Object.values(rank).indexOf(rank.color) + 1 || '?'}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-white">{displayXP.toLocaleString()}</p>
            <p className="mono text-[10px]" style={{ color: '#555' }}>TOTAL XP</p>
          </div>
        </div>

        {nextRank && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="mono text-[10px]" style={{ color: '#555' }}>→ {nextRank.name}</span>
              <span className="mono text-[10px]" style={{ color: '#555' }}>{xpIntoRank}/{xpNeeded} XP</span>
            </div>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: `${progress}%`, background: rank.color }} />
            </div>
          </div>
        )}

        <div className="flex gap-4 border-t pt-4" style={{ borderColor: '#1a1a1a' }}>
          <div>
            <p className="text-xl font-black text-white">{userData.streak}</p>
            <p className="mono text-[10px]" style={{ color: '#555' }}>DAY STREAK</p>
          </div>
          <div>
            <p className="text-xl font-black" style={{ color: '#f97316' }}>{tier.multiplier}×</p>
            <p className="mono text-[10px]" style={{ color: '#555' }}>{tier.label}</p>
          </div>
        </div>
      </div>

      {/* Campaign Trend */}
      <div className="luxury-card rounded p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="mono text-[10px] tracking-widest" style={{ color: '#555' }}>CAMPAIGN TREND</p>
          <div className="flex gap-1">
            {(['7', '30', '365'] as Scope[]).map(s => (
              <button key={s} onClick={() => setScope(s)} className="mono text-[10px] px-2 py-1" style={{ borderRadius: '2px', border: `1px solid ${scope === s ? '#10b981' : '#1a1a1a'}`, background: scope === s ? 'rgba(16,185,129,0.1)' : 'transparent', color: scope === s ? '#10b981' : '#444' }}>
                {s}D
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-black text-white">{avgPct}%</span>
          <span className="mono text-[10px]" style={{ color: '#555' }}>AVG COMPLETION</span>
        </div>
        <div className="chart-container">
          {chartData.slice(-30).map((pct, i) => (
            <div key={i} className="chart-bar-wrap">
              <div
                className="chart-bar rounded-t"
                style={{
                  height: pct < 0 ? '4px' : `${Math.max(4, pct)}%`,
                  background: pct >= 70 ? '#10b981' : pct >= 40 ? '#f97316' : pct >= 0 ? '#ef4444' : '#1a1a1a',
                  opacity: pct < 0 ? 0.2 : 0.85,
                }}
              />
              <div className="chart-bar-tooltip">{pct >= 0 ? `${pct}%` : 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Field Intelligence */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-panel-green rounded p-4">
          <p className="mono text-[10px] mb-1" style={{ color: '#10b981' }}>FIELD WINS</p>
          <p className="text-2xl font-black text-white">{logTypeCounts['WIN'] ?? 0}</p>
        </div>
        <div className="stat-panel-orange rounded p-4">
          <p className="mono text-[10px] mb-1" style={{ color: '#f97316' }}>DEBRIEFS</p>
          <p className="text-2xl font-black text-white">{logTypeCounts['DEBRIEF'] ?? 0}</p>
        </div>
        <div className="rounded p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="mono text-[10px] mb-1" style={{ color: '#ef4444' }}>FIXES REQ.</p>
          <p className="text-2xl font-black text-white">{logTypeCounts['FIX'] ?? 0}</p>
        </div>
      </div>

      {/* 5F Proficiency */}
      <div className="luxury-card rounded p-5">
        <p className="mono text-[10px] tracking-widest mb-4" style={{ color: '#555' }}>5F AXIOM PROFICIENCY</p>
        <div className="space-y-3">
          {(['finance', 'fitness', 'family', 'faith', 'friends'] as FTag[]).map(tag => {
            const pts = userData.proficiency[tag] ?? 0
            const level = getProficiencyLevel(pts)
            const nextThresh = PROFICIENCY_THRESHOLDS[level] ?? PROFICIENCY_THRESHOLDS[PROFICIENCY_THRESHOLDS.length - 1]
            const prevThresh = PROFICIENCY_THRESHOLDS[level - 1] ?? 0
            const pct = level >= 10 ? 100 : Math.min(100, ((pts - prevThresh) / (nextThresh - prevThresh)) * 100)
            return (
              <div key={tag}>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs font-bold" style={{ color: FTAG_COLORS[tag] }}>{FTAG_LABELS[tag]}</span>
                    <span className="mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${FTAG_COLORS[tag]}18`, color: FTAG_COLORS[tag] }}>LVL {level}</span>
                  </div>
                  <span className="mono text-[10px]" style={{ color: '#555' }}>{pts.toLocaleString()} pts</span>
                </div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${pct}%`, background: FTAG_COLORS[tag] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
