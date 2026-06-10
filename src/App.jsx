import NotificationsPage from './pages/NotificationsPage'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import TaskBoardPage from './pages/TaskBoardPage'
import CreateTaskPage from './pages/CreateTaskPage'
import ProfilePage from './pages/ProfilePage'
import UsersPage from './pages/UsersPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/taskboard" element={<TaskBoardPage />} />
        <Route path="/create-task" element={<CreateTaskPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App