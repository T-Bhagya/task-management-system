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
        <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: 'white' }}>Loading profile...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: 'white' }}>Profile not found. Please log in again.</Typography>
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
            }}>{letter}</Avatar>

            <Typography variant="h6" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
              {profile.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 2 }}>
              {mapRoleToUI(profile.role)}
            </Typography>

            <Chip label="Active" size="small" sx={{
              backgroundColor: 'rgba(52,211,153,0.15)',
              color: '#34d399', fontWeight: 600,
              border: '1px solid rgba(52,211,153,0.3)', mb: 3
            }} />

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', width: '100%', mb: 3 }} />

            {[
              { icon: <EmailIcon sx={{ fontSize: 16 }} />, text: profile.email },
              { icon: <WorkIcon sx={{ fontSize: 16 }} />, text: mapRoleToUI(profile.role) },
              { icon: <CalendarTodayIcon sx={{ fontSize: 16 }} />, text: `Joined ${joinDate}` },
            ].map((item, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                mb: 1.5, width: '100%'
              }}>
                <Box sx={{ color: '#a78bfa' }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }} noWrap title={item.text}>
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
                { label: 'Total Tasks', value: totalTasks, icon: <AssignmentIcon />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
                { label: 'Completed', value: completedTasks, icon: <CheckCircleIcon />, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
                { label: 'In Progress', value: inProgressTasks, icon: <PendingIcon />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
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

            {/* My Tasks List */}
            <Paper elevation={0} sx={{
              p: 3, borderRadius: 3,
              background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#f1f5f9', mb: 3 }}>
                My Assigned Tasks
              </Typography>

              {myTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', py: 3, textAlign: 'center' }}>
                  No tasks assigned to you.
                </Typography>
              ) : (
                myTasks.map((task, i, arr) => (
                  <Box key={task.id} sx={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', py: 1.8,
                    borderBottom: i < arr.length - 1
                      ? '1px solid rgba(255,255,255,0.06)' : 'none'
                  }}>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={mapPriorityToUI(task.priority)} size="small" sx={{
                        height: 22, fontSize: 11, fontWeight: 600,
                        backgroundColor: task.priority === 'HIGH'
                          ? 'rgba(248,113,113,0.15)' : task.priority === 'MEDIUM'
                          ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                        color: task.priority === 'HIGH' ? '#f87171'
                          : task.priority === 'MEDIUM' ? '#fbbf24' : '#34d399',
                      }} />
                      <Chip label={mapStatusToUI(task.status)} size="small" sx={{
                        height: 22, fontSize: 11, fontWeight: 600,
                        backgroundColor: task.status === 'COMPLETED'
                          ? 'rgba(52,211,153,0.15)' : task.status === 'IN_PROGRESS'
                          ? 'rgba(251,191,36,0.15)' : 'rgba(96,165,250,0.15)',
                        color: task.status === 'COMPLETED' ? '#34d399'
                          : task.status === 'IN_PROGRESS' ? '#fbbf24' : '#60a5fa',
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