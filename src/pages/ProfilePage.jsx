import Layout from '../components/Layout'
import { Box, Typography, Paper, Avatar, Chip, Divider } from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import WorkIcon from '@mui/icons-material/Work'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'

function ProfilePage() {
  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh' }}>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
            Profile
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            Your personal information
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>

          {/* Left card */}
          <Paper elevation={0} sx={{
            p: 4, borderRadius: 3, width: 280, flexShrink: 0,
            background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <Avatar sx={{
              width: 90, height: 90, fontSize: 36, fontWeight: 'bold', mb: 2,
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
            }}>N</Avatar>

            <Typography variant="h6" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
              Nadeesha
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 2 }}>
              Frontend Developer
            </Typography>

            <Chip label="Active" size="small" sx={{
              backgroundColor: 'rgba(52,211,153,0.15)',
              color: '#34d399', fontWeight: 600,
              border: '1px solid rgba(52,211,153,0.3)', mb: 3
            }} />

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', width: '100%', mb: 3 }} />

            {[
              { icon: <EmailIcon sx={{ fontSize: 16 }} />, text: 'nadeesha@gmail.com' },
              { icon: <WorkIcon sx={{ fontSize: 16 }} />, text: 'Collaborator' },
              { icon: <CalendarTodayIcon sx={{ fontSize: 16 }} />, text: 'Joined Jan 2025' },
            ].map((item, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                mb: 1.5, width: '100%'
              }}>
                <Box sx={{ color: '#a78bfa' }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Paper>

          {/* Right side */}
          <Box sx={{ flex: 1, minWidth: 280 }}>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Tasks', value: 12, icon: <AssignmentIcon />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
                { label: 'Completed', value: 7, icon: <CheckCircleIcon />, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
                { label: 'In Progress', value: 5, icon: <PendingIcon />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
              ].map((stat) => (
                <Paper key={stat.label} elevation={0} sx={{
                  p: 3, borderRadius: 3, flex: 1, minWidth: 140,
                  background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: 2
                }}>
                  <Box sx={{
                    width: 46, height: 46, borderRadius: 2,
                    backgroundColor: stat.bg,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: stat.color
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Recent activity */}
            <Paper elevation={0} sx={{
              p: 3, borderRadius: 3,
              background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#f1f5f9', mb: 3 }}>
                My Tasks
              </Typography>

              {[
                { title: 'Fix login bug', status: 'In Progress', priority: 'High' },
                { title: 'Setup database', status: 'Completed', priority: 'Medium' },
                { title: 'Write API docs', status: 'In Progress', priority: 'Low' },
                { title: 'Design dashboard', status: 'To Do', priority: 'High' },
              ].map((task, i, arr) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', py: 1.8,
                  borderBottom: i < arr.length - 1
                    ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                    {task.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={task.priority} size="small" sx={{
                      height: 22, fontSize: 11, fontWeight: 600,
                      backgroundColor: task.priority === 'High'
                        ? 'rgba(248,113,113,0.15)' : task.priority === 'Medium'
                        ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                      color: task.priority === 'High' ? '#f87171'
                        : task.priority === 'Medium' ? '#fbbf24' : '#34d399',
                    }} />
                    <Chip label={task.status} size="small" sx={{
                      height: 22, fontSize: 11, fontWeight: 600,
                      backgroundColor: task.status === 'Completed'
                        ? 'rgba(52,211,153,0.15)' : task.status === 'In Progress'
                        ? 'rgba(251,191,36,0.15)' : 'rgba(96,165,250,0.15)',
                      color: task.status === 'Completed' ? '#34d399'
                        : task.status === 'In Progress' ? '#fbbf24' : '#60a5fa',
                    }} />
                  </Box>
                </Box>
              ))}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Layout>
  )
}

export default ProfilePage