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

const menuItems = [
  { icon: <DashboardIcon />, label: 'Dashboard', path: '/dashboard' },
  { icon: <AssignmentIcon />, label: 'Task Board', path: '/taskboard' },
  { icon: <AddTaskIcon />, label: 'Create Task', path: '/create-task' },
  { icon: <PeopleIcon />, label: 'Users', path: '/users' },
  { icon: <NotificationsIcon />, label: 'Notifications', path: '/notifications' },
  { icon: <PersonIcon />, label: 'Profile', path: '/profile' },
]

function Sidebar({ expanded, setExpanded }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{
      width: expanded ? '240px' : '72px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #13151f 0%, #0f1117 100%)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
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
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: 18
            }}>T</Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', fontSize: 17 }}>
              TaskFlow
            </Typography>
          </Box>
        )}
        <Box onClick={() => setExpanded(!expanded)} sx={{
          cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', p: 0.8, borderRadius: 1.5,
          '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.08)' }
        }}>
          {expanded ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, mb: 2 }} />

      <Box sx={{ flex: 1, px: 1.5 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Tooltip key={item.path} title={!expanded ? item.label : ''} placement="right">
              <Box onClick={() => navigate(item.path)} sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                px: expanded ? 2 : 0, py: 1.4, mb: 0.5,
                borderRadius: 2, cursor: 'pointer',
                justifyContent: expanded ? 'flex-start' : 'center',
                backgroundColor: isActive ? 'rgba(124,58,237,0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(124,58,237,0.35)' : '1px solid transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: isActive ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
                }
              }}>
                <Box sx={{
                  color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                  display: 'flex', alignItems: 'center', fontSize: 22, flexShrink: 0,
                  ml: expanded ? 0 : 'auto', mr: expanded ? 0 : 'auto',
                }}>
                  {item.icon}
                </Box>
                {expanded && (
                  <Typography variant="body2" sx={{
                    color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.65)',
                    fontWeight: isActive ? 600 : 400, fontSize: 14, whiteSpace: 'nowrap'
                  }}>
                    {item.label}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, mb: 2 }} />

      <Box sx={{ px: 1.5, pb: 2.5 }}>
        {expanded && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.5, mb: 1, borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <Avatar sx={{
              width: 34, height: 34, fontSize: 14, fontWeight: 'bold',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
            }}>N</Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>
                Nadeesha
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                Collaborator
              </Typography>
            </Box>
          </Box>
        )}
        <Tooltip title={!expanded ? 'Logout' : ''} placement="right">
          <Box onClick={() => navigate('/')} sx={{
            display: 'flex', alignItems: 'center', gap: 2,
            px: expanded ? 2 : 0, py: 1.3, borderRadius: 2,
            cursor: 'pointer', justifyContent: expanded ? 'flex-start' : 'center',
            '&:hover': { backgroundColor: 'rgba(239,68,68,0.12)' }, transition: 'all 0.2s'
          }}>
            <LogoutIcon sx={{
              color: 'rgba(255,255,255,0.4)', fontSize: 20, flexShrink: 0,
              ml: expanded ? 0 : 'auto', mr: expanded ? 0 : 'auto',
            }} />
            {expanded && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
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