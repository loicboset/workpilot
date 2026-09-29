import { useEffect, useState } from 'react'

/** The current time, updated at the start of every minute. */
export const useMinuteClock = (): Date => {
  // STATES
  const [now, setNow] = useState(() => new Date())

  // EFFECTS
  useEffect(() => {
    const tick = () => {
      setNow(new Date())
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    }
    let timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    return () => clearTimeout(timer)
  }, [])

  return now
}
