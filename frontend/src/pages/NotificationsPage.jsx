import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Chip } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonIcon from '@mui/icons-material/Person'
import CommentIcon from '@mui/icons-material/Comment'
import { api } from '../services/api'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'ASSIGNMENT':
      return { icon: <AssignmentIcon />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' };
    case 'COMMENT':
      return { icon: <CommentIcon />, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' };
    case 'SYSTEM':
      return { icon: <PersonIcon />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' };
    default:
      return { icon: <AssignmentIcon />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' };
  }
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const fetched = await api.getNotifications();
        setNotifications(fetched);

        // Mark unread notifications as read in the background
        const unread = fetched.filter(n => !n.is_read);
        if (unread.length > 0) {
          Promise.all(unread.map(n => api.markNotificationAsRead(n.id)))
            .then(() => {
              // Optionally update state to read
              setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
            })
            .catch(err => console.error('Error marking notifications as read:', err.message));
        }
      } catch (err) {
        console.error('Failed to load notifications:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
          <Chip label={`${unreadCount} unread`} sx={{
            backgroundColor: unreadCount > 0 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)',
            color: unreadCount > 0 ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            fontWeight: 600,
            border: unreadCount > 0 ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.1)'
          }} />
        </Box>

        {loading ? (
          <Typography sx={{ color: 'white', py: 4 }}>Loading notifications...</Typography>
        ) : (
          <Paper elevation={0} sx={{
            borderRadius: 3, maxWidth: 700,
            background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden'
          }}>
            {notifications.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', py: 6, textAlign: 'center' }}>
                You have no notifications yet.
              </Typography>
            ) : (
              notifications.map((notif, index) => {
                const visual = getNotificationIcon(notif.type);
                const date = new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <Box key={notif.id} sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 2.5, p: 3,
                    backgroundColor: notif.is_read ? 'transparent' : 'rgba(124,58,237,0.06)',
                    borderBottom: index < notifications.length - 1
                      ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' }
                  }}>

                    <Box sx={{
                      width: 42, height: 42, borderRadius: 2,
                      backgroundColor: visual.bg,
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: visual.color, flexShrink: 0
                    }}>
                      {visual.icon}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={notif.is_read ? 500 : 700}
                          sx={{ color: notif.is_read ? '#e2e8f0' : '#f1f5f9' }}>
                          {notif.type === 'ASSIGNMENT' ? 'New Assignment' : notif.type === 'COMMENT' ? 'New Comment' : 'Notification'}
                        </Typography>
                        {!notif.is_read && (
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
                        {date}
                      </Typography>
                    </Box>

                  </Box>
                );
              })
            )}
          </Paper>
        )}

      </Box>
    </Layout>
  )
}

export default NotificationsPage