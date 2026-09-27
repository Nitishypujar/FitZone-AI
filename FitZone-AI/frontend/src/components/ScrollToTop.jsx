import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // SPA navigation should start each page at its own top. This prevents
    // the browser from carrying the previous page's scroll position into
    // Dashboard, Workout, Progress, Nutrition, and other long screens.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default ScrollToTop
