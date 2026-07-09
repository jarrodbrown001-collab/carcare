import { useEffect, useState } from 'react'

// Chart colors, stepped separately for light and dark surfaces.
export const CATEGORICAL = {
  light: ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'],
  dark: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'],
}

export const CHROME = {
  light: { grid: '#e1e0d9', axis: '#c3c2b7', muted: '#898781', ink: '#0b0b0b', surface: '#fcfcfb' },
  dark: { grid: '#2c2c2a', axis: '#383835', muted: '#898781', ink: '#ffffff', surface: '#1a1a19' },
}

export function useDarkMode() {
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return dark
}

export const fmtMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const fmtMoneyCents = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export const fmtMiles = (n) => new Intl.NumberFormat('en-US').format(n)
