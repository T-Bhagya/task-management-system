import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Avatar, Tooltip, Divider } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AddTaskIcon from '@mui/icons-material/AddTask'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import NotificationsIcon from '@mui/icons-material/Notifications'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import FolderIcon from '@mui/icons-material/Folder'
import { THEME } from '../theme'
import { useNotifications } from '../context/NotificationContext'

const menuItems = [
  { icon: <DashboardIcon />, label: 'Dashboard', path: '/dashboard' },
  { icon: <FolderIcon />, label: 'Projects', path: '/projects' },
  { icon: <AssignmentIcon />, label: 'Task Board', path: '/taskboard' },
  { icon: <AddTaskIcon />, label: 'Create Task', path: '/create-task', pmOrAdminOnly: true },
  { icon: <PeopleIcon />, label: 'Users', path: '/users', adminOnly: true },
  { icon: <NotificationsIcon />, label: 'Notifications', path: '/notifications' },
  { icon: <PersonIcon />, label: 'Profile', path: '/profile' },
]

function Sidebar({ expanded, setExpanded }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadCount } = useNotifications()

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const userName = user?.name || 'James Smith'
  const userEmail = user?.email || 'jamesm@mail.com'
  const userRole = user?.role ? (user.role.charAt(0) + user.role.slice(1).toLowerCase()).replace('_', ' ') : 'Collaborator'
  const initial = userName.charAt(0).toUpperCase()

  return (
    <div style={{
      width: expanded ? '240px' : '72px',
      minHeight: '100vh',
      background: THEME.colors.sidebarBg,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 100,
      overflowX: 'hidden'
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'space-between' : 'center',
        p: 2.5, mb: 1
      }}>
        {expanded && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: '#ffffff',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              color: THEME.colors.sidebarBg, fontWeight: 'bold', fontSize: 18
            }}>D</Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', fontSize: 17, letterSpacing: 0.5 }}>
              DoIT
            </Typography>
          </Box>
        )}
        <Box onClick={() => setExpanded(!expanded)} sx={{
          cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', p: 0.8, borderRadius: 1.5,
          '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
        }}>
          {expanded ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2, mb: 2 }} />

      {/* User profile details header area inside sidebar like mockup */}
      {expanded && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2, mb: 3 }}>
          <Avatar sx={{
            width: 72, height: 72, fontSize: 24, fontWeight: 'bold',
            background: '#d1d5db', color: '#4b5563', mb: 1.5,
            border: '2px solid rgba(255,255,255,0.2)'
          }}>{initial}</Avatar>
          <Typography variant="body1" sx={{ color: 'white', fontWeight: 600, fontSize: 15, mb: 0.2 }}>
            {userName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            {userEmail}
          </Typography>
        </Box>
      )}

      <Box sx={{ flex: 1, px: 1.5 }}>
        {menuItems
          .filter(item => {
            if (item.adminOnly && user?.role !== 'ADMIN') return false;
            if (item.pmOrAdminOnly && user?.role !== 'ADMIN' && user?.role !== 'PROJECT_MANAGER') return false;
            return true;
          })
          .map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Tooltip key={item.path} title={!expanded ? item.label : ''} placement="right">
              <Box onClick={() => navigate(item.path)} sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                px: expanded ? 2 : 0, py: 1.2, mb: 0.5,
                borderRadius: 2, cursor: 'pointer',
                justifyContent: expanded ? 'flex-start' : 'center',
                backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                }
              }}>
                <Box sx={{
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                  display: 'flex', alignItems: 'center', fontSize: 20, flexShrink: 0,
                  ml: expanded ? 0 : 'auto', mr: expanded ? 0 : 'auto',
                  position: 'relative'
                }}>
                  {item.icon}
                  {!expanded && item.path === '/notifications' && unreadCount > 0 && (
                    <Box sx={{
                      position: 'absolute', top: -3, right: -3,
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: '#eb5e43', border: '1px solid ' + THEME.colors.sidebarBg
                    }} />
                  )}
                </Box>
                {expanded && (
                  <Typography variant="body2" sx={{
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.75)',
                    fontWeight: isActive ? 600 : 400, fontSize: 13.5, whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'
                  }}>
                    <span>{item.label}</span>
                    {item.path === '/notifications' && unreadCount > 0 && (
                      <Box sx={{
                        backgroundColor: '#eb5e43', color: 'white',
                        fontSize: 10, fontWeight: 'bold',
                        px: 0.8, py: 0.2, borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 16, height: 16, ml: 1
                      }}>
                        {unreadCount}
                      </Box>
                    )}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2, mb: 2 }} />

      <Box sx={{ px: 1.5, pb: 2.5 }}>
        {expanded && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.2, mb: 1, borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <Avatar sx={{
              width: 32, height: 32, fontSize: 13, fontWeight: 'bold',
              background: '#e2e8f0', color: THEME.colors.sidebarBg
            }}>{initial}</Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: 12.5 }}>
                {userName.split(' ')[0]}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                {userRole}
              </Typography>
            </Box>
          </Box>
        )}
        <Tooltip title={!expanded ? 'Logout' : ''} placement="right">
          <Box onClick={() => { localStorage.removeItem('token'); navigate('/') }} sx={{
            display: 'flex', alignItems: 'center', gap: 2,
            px: expanded ? 2 : 0, py: 1.1, borderRadius: 2,
            cursor: 'pointer', justifyContent: expanded ? 'flex-start' : 'center',
            '&:hover': { backgroundColor: 'rgba(239,68,68,0.15)' }, transition: 'all 0.2s'
          }}>
            <LogoutIcon sx={{
              color: 'rgba(255,255,255,0.6)', fontSize: 18, flexShrink: 0,
              ml: expanded ? 0 : 'auto', mr: expanded ? 0 : 'auto',
            }} />
            {expanded && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                Logout
              </Typography>
            )}
          </Box>
        </Tooltip>
      </Box>
    </div>
  )
}

export default Sidebar