import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useApp } from '../context/AppContext'
import { calculateXPAndRank, getStreakTier } from '../lib/xp'

interface Props { uplinkStatus: 'connecting' | 'online' | 'offline' }

export default function Header({ uplinkStatus }: Props) {
  const { userData } = useApp()
  const { displayXP, rank } = calculateXPAndRank(userData)
  const tier = getStreakTier(userData.streak)

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ background: '#000', borderColor: '#111', position: 'sticky', top: 0, zIndex: 100 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: uplinkStatus === 'online' ? '#10b981' : uplinkStatus === 'offline' ? '#ef4444' : '#f97316',
            boxShadow: uplinkStatus === 'online' ? '0 0 8px #10b981' : undefined,
            animation: uplinkStatus === 'connecting' ? 'syncPulse 1.5s infinite' : undefined,
          }}
        />
        <h1 className="text-lg font-black tracking-tight text-white">
          LEGION<span style={{ color: '#10b981' }}>X</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {userData.streak > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            <span className="mono text-[10px]" style={{ color: '#555' }}>🔥</span>
            <span className="mono text-[10px] font-bold" style={{ color: '#f97316' }}>{userData.streak}d</span>
            <span className="mono text-[10px]" style={{ color: '#333' }}>{tier.label}</span>
          </div>
        )}

        <div
          className="flex items-center gap-2 px-3 py-1 rounded"
          style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
        >
          <span className="mono text-xs font-bold" style={{ color: rank.color }}>{rank.name}</span>
          <span className="mono text-[10px]" style={{ color: '#444' }}>{displayXP} XP</span>
        </div>

        <button
          onClick={() => signOut(auth)}
          className="mono text-[10px] px-2 py-1"
          style={{ color: '#444', border: '1px solid #1a1a1a', borderRadius: '2px', background: 'none' }}
        >
          LOGOUT
        </button>
      </div>
    </header>
  )
}
