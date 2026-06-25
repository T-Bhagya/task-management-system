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
  const todoTasks = myTasks.filter(t => t.status === 'TODO').length;

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

          {/* Right side - Edit Profile */}
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Paper elevation={0} sx={{
              p: 4, borderRadius: 3.5,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(27,94,85,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain, mb: 3 }}>
                Edit Profile
              </Typography>

              <Box component="form" onSubmit={async (e) => {
                e.preventDefault();
                const newName = e.target.name.value;
                try {
                  const updated = await api.updateProfile({ name: newName });
                  setProfile(updated.user);
                  alert('Profile updated successfully!');
                  // Update local storage user name
                  const userStr = localStorage.getItem('user');
                  if (userStr) {
                    const userObj = JSON.parse(userStr);
                    userObj.name = newName;
                    localStorage.setItem('user', JSON.stringify(userObj));
                  }
                } catch (err) {
                  alert(err.message || 'Failed to update profile.');
                }
              }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 1, fontWeight: 500 }}>
                    Full Name
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    border: '1px solid rgba(27,94,85,0.1)', 
                    borderRadius: 2.5,
                    p: 1.5,
                    backgroundColor: 'rgba(27,94,85,0.02)'
                  }}>
                    <input 
                      name="name"
                      defaultValue={profile.name}
                      style={{ 
                        border: 'none', 
                        outline: 'none', 
                        background: 'transparent', 
                        width: '100%', 
                        fontSize: 15,
                        color: THEME.colors.textMain
                      }} 
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 1, fontWeight: 500 }}>
                    Email Address
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    border: '1px solid rgba(27,94,85,0.1)', 
                    borderRadius: 2.5,
                    p: 1.5,
                    backgroundColor: 'rgba(27,94,85,0.05)'
                  }}>
                    <input 
                      value={profile.email}
                      disabled
                      style={{ 
                        border: 'none', 
                        outline: 'none', 
                        background: 'transparent', 
                        width: '100%', 
                        fontSize: 15,
                        color: THEME.colors.textMuted
                      }} 
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: THEME.colors.textMuted, mt: 0.5, display: 'block' }}>
                    Email address cannot be changed.
                  </Typography>
                </Box>

                <button type="submit" style={{
                  backgroundColor: THEME.colors.sidebarBg,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(27,94,85,0.15)'
                }}>
                  Save Changes
                </button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Layout>
  )
}

export default ProfilePage