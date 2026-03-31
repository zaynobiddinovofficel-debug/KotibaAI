import { useState, useEffect } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('kotibaai_dark') === 'true'
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('kotibaai_dark', dark)
  }, [dark])

  const toggle = () => setDark(d => !d)

  return { dark, toggle }
}
