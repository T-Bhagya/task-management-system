import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Avatar, Chip, Divider } from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import WorkIcon from '@mui/icons-material/Work'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import { api } from '../services/api'
import { THEME } from '../theme'

const priorityColors = {
  High: { color: '#eb5e43', bg: 'rgba(235,94,67,0.12)' },
  Medium: { color: '#8890d3', bg: 'rgba(136,144,211,0.12)' },
  Low: { color: '#1b5e55', bg: 'rgba(27,94,85,0.12)' },
}

const statusColors = {
  'In Progress': { color: '#8890d3', bg: 'rgba(136,144,211,0.12)' },
  'To Do': { color: '#627575', bg: 'rgba(98,117,117,0.12)' },
  'Completed': { color: '#1b5e55', bg: 'rgba(27,94,85,0.12)' },
}

const mapRoleToUI = (role) => {
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'PROJECT_MANAGER') return 'Project Manager';
  if (role === 'COLLABORATOR') return 'Collaborator';
  return role;
};

const mapStatusToUI = (status) => {
  if (status === 'TODO') return 'To Do';
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'COMPLETED') return 'Completed';
  return status;
};

const mapPriorityToUI = (priority) => {
  if (priority === 'HIGH') return 'High';
  if (priority === 'MEDIUM') return 'Medium';
  if (priority === 'LOW') return 'Low';
  return priority;
};

function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfileData() {
      try {
        const fetchedProfile = await api.getProfile();
        setProfile(fetchedProfile);

        // Fetch tasks and filter for logged in user
        const fetchedTasks = await api.getTasks();
        const filtered = fetchedTasks.filter(t => t.assigned_to === fetchedProfile.id);
        setMyTasks(filtered);
      } catch (err) {
        console.error('Failed to load profile data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [])

  if (loading) {
    return (
      <Layout>
        <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: THEME.colors.textMain }}>Loading profile...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: THEME.colors.textMain }}>Profile not found. Please log in again.</Typography>
        </Box>
      </Layout>
    );
  }

  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'IN_PROGRESS').length;

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString([], { year: 'numeric', month: 'short' })
    : 'N/A';

  const letter = profile.name ? profile.name[0].toUpperCase() : 'U';

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
            Profile
          </Typography>
          <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
            Your personal information
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>

          {/* Left card */}
          <Paper elevation={0} sx={{
            p: 4, borderRadius: 3.5, width: 280, flexShrink: 0,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(27,94,85,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <Avatar sx={{
              width: 90, height: 90, fontSize: 36, fontWeight: 'bold', mb: 2,
              background: THEME.colors.sidebarBg, color: 'white'
            }}>{letter}</Avatar>

            <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
              {profile.name}
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 2 }}>
              {mapRoleToUI(profile.role)}
            </Typography>

            <Chip label="Active" size="small" sx={{
              backgroundColor: 'rgba(27,94,85,0.08)',
              color: THEME.colors.sidebarBg, fontWeight: 700,
              border: '1px solid rgba(27,94,85,0.15)', mb: 3
            }} />

            <Divider sx={{ borderColor: 'rgba(27,94,85,0.1)', width: '100%', mb: 3 }} />

            {[
              { icon: <EmailIcon sx={{ fontSize: 16 }} />, text: profile.email },
              { icon: <WorkIcon sx={{ fontSize: 16 }} />, text: mapRoleToUI(profile.role) },
              { icon: <CalendarTodayIcon sx={{ fontSize: 16 }} />, text: `Joined ${joinDate}` },
            ].map((item, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                mb: 1.5, width: '100%'
              }}>
                <Box sx={{ color: THEME.colors.sidebarBg }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ color: THEME.colors.textMain, fontSize: 13 }} noWrap title={item.text}>
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
                { label: 'Total Tasks', value: totalTasks, icon: <AssignmentIcon />, color: THEME.colors.sidebarBg, bg: 'rgba(27,94,85,0.1)' },
                { label: 'Completed', value: completedTasks, icon: <CheckCircleIcon />, color: THEME.colors.greenAccent, bg: 'rgba(27,94,85,0.1)' },
                { label: 'In Progress', value: inProgressTasks, icon: <PendingIcon />, color: THEME.colors.purpleAccent, bg: 'rgba(136,144,211,0.1)' },
              ].map((stat) => (
                <Paper key={stat.label} elevation={0} sx={{
                  p: 3, borderRadius: 3.5, flex: 1, minWidth: 140,
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(27,94,85,0.08)',
                  display: 'flex', alignItems: 'center', gap: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                  <Box sx={{
                    width: 46, height: 46, borderRadius: 2.5,
                    backgroundColor: stat.bg,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: stat.color
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: THEME.colors.textMuted, fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* My Tasks List */}
            <Paper elevation={0} sx={{
              p: 3, borderRadius: 3.5,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(27,94,85,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain, mb: 3 }}>
                My Assigned Tasks
              </Typography>

              {myTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: THEME.colors.textMuted, py: 3, textAlign: 'center' }}>
                  No tasks assigned to you.
                </Typography>
              ) : (
                myTasks.map((task, i, arr) => (
                  <Box key={task.id} sx={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', py: 1.8,
                    borderBottom: i < arr.length - 1
                      ? '1px solid rgba(27,94,85,0.08)' : 'none'
                  }}>
                    <Typography variant="body2" sx={{ color: THEME.colors.textMain, fontWeight: 600 }}>
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={mapPriorityToUI(task.priority)} size="small" sx={{
                        height: 22, fontSize: 11, fontWeight: 700,
                        backgroundColor: priorityColors[mapPriorityToUI(task.priority)]?.bg || 'rgba(0,0,0,0.05)',
                        color: priorityColors[mapPriorityToUI(task.priority)]?.color || THEME.colors.textMuted,
                      }} />
                      <Chip label={mapStatusToUI(task.status)} size="small" sx={{
                        height: 22, fontSize: 11, fontWeight: 700,
                        backgroundColor: statusColors[mapStatusToUI(task.status)]?.bg || 'rgba(0,0,0,0.05)',
                        color: statusColors[mapStatusToUI(task.status)]?.color || THEME.colors.textMuted,
                      }} />
                    </Box>
                  </Box>
                ))
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Layout>
  )
}

export default ProfilePage