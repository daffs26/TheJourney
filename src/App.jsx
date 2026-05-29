import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function App() {
  const { init, onboarded, toasts } = useAppStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    init().finally(() => setInitializing(false))
  }, [init])

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
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
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
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <BottomNav />
        <Toast toasts={toasts} />
      </div>
    </BrowserRouter>
  )
}

export default App
