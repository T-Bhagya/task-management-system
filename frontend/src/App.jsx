import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import TaskBoardPage from './pages/TaskBoardPage'
import CreateTaskPage from './pages/CreateTaskPage'
import ProfilePage from './pages/ProfilePage'
import UsersPage from './pages/UsersPage'
import NotificationsPage from './pages/NotificationsPage'
import ProjectsPage from './pages/ProjectsPage'

// Simple auth check - looks for token in localStorage
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
        <Route path="/taskboard" element={<PrivateRoute><TaskBoardPage /></PrivateRoute>} />
        <Route path="/create-task" element={<PrivateRoute><CreateTaskPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App