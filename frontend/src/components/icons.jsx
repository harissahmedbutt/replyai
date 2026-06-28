import React from 'react'

// Minimal line-icon set (Lucide-style geometry) used across the app.
const paths = {
  flame: <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.3-2-.8-2.7C16.5 8 18 10 18 13a6 6 0 1 1-12 0c0-4 3-6 4-8 .8-1.4 1.6-2.3 2-3Z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  pencil: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  bolt: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />,
  users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />,
  inbox: <path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />,
  refresh: <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />,
  rocket: <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
}

export function Icon({ name, size = 16, color, fill, strokeWidth = 1.7, style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill || 'none'}
      stroke={fill ? 'none' : (color || 'currentColor')}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
