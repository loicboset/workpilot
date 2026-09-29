import { useSpace } from '@/data/currentSpace'

/** Paths inside the page's space: `spacePath('/today')` is "/work/today", `spacePath()` "/work". */
export const useSpacePath = () => {
  // HOOKS
  const { slug } = useSpace()

  return (path = '') => `/${slug}${path}`
}
