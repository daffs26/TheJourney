import { useEffect, useState, lazy, Suspense, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/useAppStore'
import BottomNav from './components/BottomNav/BottomNav'
import Toast from './components/Toast/Toast'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import Onboarding from './components/Onboarding/Onboarding'

// Lazy load all module pages
const Home        = lazy(() => import('./modules/home/Home'))
const Courses     = lazy(() => import('./modules/courses/CourseList'))
const CourseDetail= lazy(() => import('./modules/courses/CourseDetail'))
const MeetingPage = lazy(() => import('./modules/courses/MeetingPage'))
const Schedule    = lazy(() => import('./modules/schedule/Schedule'))
const Todos       = lazy(() => import('./modules/todos/Todos'))
const Finance     = lazy(() => import('./modules/finance/Finance'))
const Presentation = lazy(() => import('./modules/presentation/Presentation'))
const Ipk         = lazy(() => import('./modules/ipk/Ipk'))
const Attendance  = lazy(() => import('./modules/attendance/Attendance'))
const Settings    = lazy(() => import('./modules/settings/Settings'))
const Deadline    = lazy(() => import('./modules/deadline/Deadline'))
const Pomodoro    = lazy(() => import('./modules/pomodoro/Pomodoro'))
const Grades      = lazy(() => import('./modules/grades/Grades'))
const Documents   = lazy(() => import('./modules/documents/Documents'))
const Notifications = lazy(() => import('./modules/notifications/Notifications'))
const MoreFeatures  = lazy(() => import('./modules/more-features/MoreFeatures'))

const TABS = ['/', '/courses', '/schedule', '/todos']

function useSwipeNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStart = useRef({ x: 0, y: 0, time: 0 })

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length > 1) return
      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
    }

    const handleTouchEnd = (e) => {
      if (e.changedTouches.length !== 1) return
      const touch = e.changedTouches[0]
      const diffX = touch.clientX - touchStart.current.x
      const diffY = touch.clientY - touchStart.current.y
      const duration = Date.now() - touchStart.current.time

      // 1. Gesture must be within a reasonable duration (< 400ms)
      if (duration > 400) return

      // 2. Gesture must be horizontal-dominant (horizontal swipe)
      // Minimum displacement is 50px, and horizontal distance must be at least 1.4x of vertical distance
      if (Math.abs(diffX) < 50 || Math.abs(diffY) > Math.abs(diffX) * 0.7) return

      // 3. We must only trigger if we are on one of the main tabs
      const currentPath = location.pathname
      const tabIndex = TABS.indexOf(currentPath)
      if (tabIndex === -1) return

      // 4. Filter target: Ignore swiping on inputs, textareas, horizontal scroll containers, or open modals.
      const target = e.target
      let isIgnored = false
      let el = target

      // Check if modal or overlay is open
      const hasModal = document.querySelector('[class*="overlay"], [class*="modal"], [class*="zoomOverlay"]') !== null
      if (hasModal) return

      while (el && el !== document.body) {
        // Horizontal scroll container detection
        const style = window.getComputedStyle(el)
        const overflowX = style.overflowX
        if (
          (overflowX === 'auto' || overflowX === 'scroll') &&
          el.scrollWidth > el.clientWidth
        ) {
          isIgnored = true
          break
        }
        // Input fields and interactive controls
        if (
          el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.getAttribute('contenteditable') === 'true' ||
          el.classList.contains('no-swipe') ||
          el.classList.contains('lightbox')
        ) {
          isIgnored = true
          break
        }
        el = el.parentElement
      }

      if (isIgnored) return

      // 5. Swipe left (diffX < 0) -> Next Tab
      if (diffX < -50) {
        if (tabIndex < TABS.length - 1) {
          navigate(TABS[tabIndex + 1])
        }
      }
      // 6. Swipe right (diffX > 0) -> Previous Tab
      else if (diffX > 50) {
        if (tabIndex > 0) {
          navigate(TABS[tabIndex - 1])
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [location.pathname, navigate])
}

function AppRoutes() {
  const location = useLocation()
  const navType = useNavigationType()
  const [prevPath, setPrevPath] = useState(location.pathname)
  const [direction, setDirection] = useState(0) // 1 = slide left (forward), -1 = slide right (backward)

  useSwipeNavigation()

  useEffect(() => {
    if (location.pathname !== prevPath) {
      const prevIdx = TABS.indexOf(prevPath)
      const currIdx = TABS.indexOf(location.pathname)

      if (prevIdx !== -1 && currIdx !== -1) {
        // Navigating between tabs
        setDirection(currIdx > prevIdx ? 1 : -1)
      } else if (navType === 'POP') {
        // Back navigation (backward)
        setDirection(-1)
      } else {
        // Opening a sub-page (forward)
        setDirection(1)
      }
      setPrevPath(location.pathname)
    }
  }, [location.pathname, prevPath, navType])

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : dir < 0 ? '-100%' : '0%',
      opacity: dir === 0 ? 0 : 1,
    }),
    center: {
      x: '0%',
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : dir < 0 ? '100%' : '0%',
      opacity: dir === 0 ? 0 : 1,
    }),
  }

  const isTabTransition = direction !== 0
  const transition = isTabTransition
    ? { type: 'spring', stiffness: 350, damping: 35 }
    : { duration: 0.2, ease: 'easeInOut' }

  return (
    <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          style={{
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Suspense fallback={<LoadingScreen />}>
            <Routes location={location}>
              <Route path="/"               element={<Home />} />
              <Route path="/courses"        element={<Courses />} />
              <Route path="/courses/:id"    element={<CourseDetail />} />
              <Route path="/courses/:courseId/meeting/:meetingId" element={<MeetingPage />} />
              <Route path="/schedule"       element={<Schedule />} />
              <Route path="/todos"          element={<Todos />} />
              <Route path="/finance"        element={<Finance />} />
              <Route path="/ppt"            element={<Presentation />} />
              <Route path="/ipk"            element={<Ipk />} />
              <Route path="/attendance"     element={<Attendance />} />
              <Route path="/settings"       element={<Settings />} />
              <Route path="/deadline"      element={<Deadline />} />
              <Route path="/pomodoro"      element={<Pomodoro />} />
              <Route path="/grades"        element={<Grades />} />
              <Route path="/documents"     element={<Documents />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/more-features"  element={<MoreFeatures />} />
              <Route path="*"               element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function App() {
  const { init, onboarded, toasts, theme, applyTheme } = useAppStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const startTime = Date.now()
    init().finally(() => {
      const elapsed = Date.now() - startTime
      const minDelay = 1800
      const remaining = Math.max(0, minDelay - elapsed)
      setTimeout(() => {
        setInitializing(false)
      }, remaining)
    })
  }, [init])

  // Listen to system theme preference changes if theme is set to 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, applyTheme])

  // Show loading screen while reading from IndexedDB
  if (initializing) {
    return (
      <>
        <LoadingScreen />
        <Toast toasts={toasts} />
      </>
    )
  }

  if (!onboarded) {
    return (
      <>
        <Onboarding />
        <Toast toasts={toasts} />
      </>
    )
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <AppRoutes />
        <BottomNav />
        <Toast toasts={toasts} />
      </div>
    </BrowserRouter>
  )
}

export default App
