import { useEffect, useState } from 'react'

interface CollaborativeCursorProps {
  userName: string
  color: string
  position: { top: number; left: number } | null
}

export function CollaborativeCursor({ userName, color, position }: CollaborativeCursorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (position) {
      setVisible(true)
      // Hide cursor after 3 seconds of inactivity
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [position])

  if (!position || !visible) return null

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: color }}
      />
      {/* User name tag */}
      <div
        className="absolute top-0 left-1 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded shadow-sm"
        style={{
          backgroundColor: color,
          color: 'white',
        }}
      >
        {userName}
      </div>
    </div>
  )
}

