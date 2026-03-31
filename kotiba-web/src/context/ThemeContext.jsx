import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false)

  // localStorage dan tema yuklash
  useEffect(() => {
    const saved = localStorage.getItem('kotiba_theme')
    if (saved === 'dark') {
      setIsDark(true)
      document.body.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev
      if (next) {
        document.body.classList.add('dark')
        localStorage.setItem('kotiba_theme', 'dark')
      } else {
        document.body.classList.remove('dark')
        localStorage.setItem('kotiba_theme', 'light')
      }
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
