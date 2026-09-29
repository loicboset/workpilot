import { useCallback, useState } from 'react'

/**
 * The width of an element in CSS pixels, kept up to date as it resizes. 0 until measured.
 * Give the returned ref to the element; it may appear later (e.g. once data has loaded).
 */
export const useElementWidth = <T extends Element>(): [(element: T | null) => void, number] => {
  // STATES
  const [width, setWidth] = useState(0)

  // METHODS
  const ref = useCallback((element: T | null) => {
    // jsdom (tests) has no ResizeObserver: the width stays 0.
    if (!element || typeof ResizeObserver === 'undefined') return
    // It reports the first size as soon as it starts observing.
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
