'use client'

import { useTheme } from 'next-themes'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() =>
        setTheme(theme === 'dark' ? 'light' : 'dark')
      }
      className="px-3 py-1.5 text-sm rounded-full border"
    >
      {theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}
    </button>
  )
}