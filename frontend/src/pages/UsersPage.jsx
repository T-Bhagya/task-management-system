import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material'
import { api } from '../services/api'
import { THEME } from '../theme'

const roleColors = {
  ADMIN: '#1b5e55',
  PROJECT_MANAGER: '#eb5e43',
  COLLABORATOR: '#8890d3',
}

const mapRoleToUI = (role) => {
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'PROJECT_MANAGER') return 'Project Manager';
  if (role === 'COLLABORATOR') return 'Collaborator';
  return role;
};

function UsersPage() {
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedUsers = await api.getUsers();
        const fetchedTasks = await api.getTasks();
        setUsers(fetchedUsers);
        setTasks(fetchedTasks);
      } catch (err) {
        console.error('Failed to load users page data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [])

  const getUserAssignedTasksCount = (userId) => {
    return tasks.filter(t => t.assigned_to === userId).length;
  };

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
            Team Members
          </Typography>
          <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
            Manage your team and their roles
          </Typography>
        </Box>

        {loading ? (
          <Typography sx={{ color: THEME.colors.textMuted, textAlign: 'center', py: 8 }}>
            Loading team members...
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3 }}>
            {users.map((user) => {
              const uiRole = mapRoleToUI(user.role);
              const color = roleColors[user.role] || THEME.colors.sidebarBg;
              const assignedTasks = getUserAssignedTasksCount(user.id);
              const letter = user.name ? user.name[0].toUpperCase() : 'U';

              return (
                <Paper key={user.id} elevation={0} onClick={() => navigate('/profile')} sx={{
                  p: 3, borderRadius: 3.5,
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(27,94,85,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  '&:hover': {
                    border: `1px solid ${color}`,
                    transform: 'translateY(-3px)',
                    boxShadow: `0 8px 25px ${color}15`
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    <Avatar sx={{
                      width: 52, height: 52, fontSize: 20, fontWeight: 'bold',
                      background: color, color: 'white'
                    }}>
                      {letter}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body1" fontWeight="bold" sx={{ color: THEME.colors.textMain }} noWrap title={user.name}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}>
                        {uiRole}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(27,94,85,0.08)',
                        color: THEME.colors.sidebarBg,
                        fontWeight: 700, fontSize: 11,
                        border: '1px solid rgba(27,94,85,0.15)'
                      }}
                    />
                    <Typography variant="body2" sx={{ color: THEME.colors.textMuted, fontSize: 13, fontWeight: 500 }}>
                      {assignedTasks} {assignedTasks === 1 ? 'task' : 'tasks'} assigned
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Layout>
  )
}

export default UsersPage