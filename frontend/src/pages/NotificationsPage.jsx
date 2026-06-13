import Layout from '../components/Layout'
import { Box, Typography, Paper, Chip } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonIcon from '@mui/icons-material/Person'
import CommentIcon from '@mui/icons-material/Comment'

const notifications = [
  {
    id: 1, icon: <AssignmentIcon />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)',
    title: 'New task assigned to you',
    message: 'Fix login bug has been assigned to you by John',
    time: '2 minutes ago', read: false
  },
  {
    id: 2, icon: <CheckCircleIcon />, color: '#34d399', bg: 'rgba(52,211,153,0.15)',
    title: 'Task completed',
    message: 'Setup database has been marked as completed',
    time: '1 hour ago', read: false
  },
  {
    id: 3, icon: <CommentIcon />, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',
    title: 'New comment on your task',
    message: 'Sara commented on Design dashboard task',
    time: '3 hours ago', read: true
  },
  {
    id: 4, icon: <PersonIcon />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',
    title: 'New team member joined',
    message: 'Mike has joined the project as Project Manager',
    time: '1 day ago', read: true
  },
  {
    id: 5, icon: <AssignmentIcon />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)',
    title: 'Task deadline approaching',
    message: 'Write API docs is due tomorrow',
    time: '1 day ago', read: true
  },
]

function NotificationsPage() {
  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
              Stay updated with your team's activity
            </Typography>
          </Box>
          <Chip label="2 unread" sx={{
            backgroundColor: 'rgba(124,58,237,0.2)',
            color: '#a78bfa', fontWeight: 600,
            border: '1px solid rgba(124,58,237,0.35)'
          }} />
        </Box>

        <Paper elevation={0} sx={{
          borderRadius: 3, maxWidth: 700,
          background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden'
        }}>
          {notifications.map((notif, index) => (
            <Box key={notif.id} sx={{
              display: 'flex', alignItems: 'flex-start', gap: 2.5, p: 3,
              backgroundColor: notif.read ? 'transparent' : 'rgba(124,58,237,0.06)',
              borderBottom: index < notifications.length - 1
                ? '1px solid rgba(255,255,255,0.06)' : 'none',
              transition: 'all 0.2s',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' }
            }}>

              <Box sx={{
                width: 42, height: 42, borderRadius: 2,
                backgroundColor: notif.bg,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: notif.color, flexShrink: 0
              }}>
                {notif.icon}
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={notif.read ? 500 : 700}
                    sx={{ color: notif.read ? '#e2e8f0' : '#f1f5f9' }}>
                    {notif.title}
                  </Typography>
                  {!notif.read && (
                    <Box sx={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: '#7c3aed', flexShrink: 0
                    }} />
                  )}
                </Box>
                <Typography variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, fontSize: 13 }}>
                  {notif.message}
                </Typography>
                <Typography variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  {notif.time}
                </Typography>
              </Box>

            </Box>
          ))}
        </Paper>

      </Box>
    </Layout>
  )
}

export default NotificationsPage