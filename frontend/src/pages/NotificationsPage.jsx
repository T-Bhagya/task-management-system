import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Chip } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PersonIcon from '@mui/icons-material/Person'
import CommentIcon from '@mui/icons-material/Comment'
import { THEME } from '../theme'
import { useNotifications } from '../context/NotificationContext'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'ASSIGNMENT':
      return { icon: <AssignmentIcon />, color: '#1b5e55', bg: 'rgba(27,94,85,0.1)' };
    case 'COMMENT':
      return { icon: <CommentIcon />, color: '#8890d3', bg: 'rgba(136,144,211,0.1)' };
    case 'SYSTEM':
      return { icon: <PersonIcon />, color: '#eb5e43', bg: 'rgba(235,94,67,0.1)' };
    default:
      return { icon: <AssignmentIcon />, color: '#1b5e55', bg: 'rgba(27,94,85,0.1)' };
  }
};

function NotificationsPage() {
  const { notifications, markAllAsRead, fetchNotifications } = useNotifications()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      await fetchNotifications();
      setLoading(false);
      // Mark all as read after loading the page
      await markAllAsRead();
    }
    init();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
              Stay updated with your team's activity
            </Typography>
          </Box>
          <Chip label={`${unreadCount} unread`} sx={{
            backgroundColor: unreadCount > 0 ? 'rgba(27,94,85,0.1)' : 'rgba(0,0,0,0.05)',
            color: unreadCount > 0 ? THEME.colors.sidebarBg : THEME.colors.textMuted,
            fontWeight: 700,
            border: unreadCount > 0 ? '1px solid rgba(27,94,85,0.2)' : '1px solid rgba(0,0,0,0.08)'
          }} />
        </Box>

        {loading ? (
          <Typography sx={{ color: THEME.colors.textMuted, py: 4 }}>Loading notifications...</Typography>
        ) : (
          <Paper elevation={0} sx={{
            borderRadius: 3.5, maxWidth: 700,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(27,94,85,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            overflow: 'hidden'
          }}>
            {notifications.length === 0 ? (
              <Typography variant="body2" sx={{ color: THEME.colors.textMuted, py: 6, textAlign: 'center' }}>
                You have no notifications yet.
              </Typography>
            ) : (
              notifications.map((notif, index) => {
                const visual = getNotificationIcon(notif.type);
                const date = new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <Box key={notif.id} sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 2.5, p: 3,
                    backgroundColor: notif.is_read ? 'transparent' : 'rgba(27,94,85,0.04)',
                    borderBottom: index < notifications.length - 1
                      ? '1px solid rgba(27,94,85,0.08)' : 'none',
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: 'rgba(27,94,85,0.06)' }
                  }}>

                    <Box sx={{
                      width: 42, height: 42, borderRadius: 2.5,
                      backgroundColor: visual.bg,
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: visual.color, flexShrink: 0
                    }}>
                      {visual.icon}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={notif.is_read ? 600 : 800}
                          sx={{ color: THEME.colors.textMain }}>
                          {notif.type === 'ASSIGNMENT' ? 'New Assignment' : notif.type === 'COMMENT' ? 'New Comment' : 'Notification'}
                        </Typography>
                        {!notif.is_read && (
                          <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: THEME.colors.sidebarBg, flexShrink: 0
                          }} />
                        )}
                      </Box>
                      <Typography variant="body2"
                        sx={{ color: THEME.colors.textMuted, mb: 0.5, fontSize: 13 }}>
                        {notif.message}
                      </Typography>
                      <Typography variant="caption"
                        sx={{ color: THEME.colors.textMuted, fontSize: 11 }}>
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