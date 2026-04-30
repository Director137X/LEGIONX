import { useEffect } from 'react'

interface Props {
  message: string
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  return (
    <div
      className="toast-msg fixed bottom-6 left-1/2 z-[9999] px-4 py-2 rounded mono text-xs"
      style={{
        background: '#0d0d0d',
        border: '1px solid #1a1a1a',
        color: '#10b981',
        boxShadow: '0 0 20px rgba(0,0,0,0.8)',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  )
}
