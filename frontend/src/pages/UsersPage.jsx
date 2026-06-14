import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material'
import { api } from '../services/api'

const roleColors = {
  ADMIN: '#7c3aed',
  PROJECT_MANAGER: '#fbbf24',
  COLLABORATOR: '#3b82f6',
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
      <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh' }}>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
            Team Members
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            Manage your team and their roles
          </Typography>
        </Box>

        {loading ? (
          <Typography sx={{ color: 'white', textAlign: 'center', py: 8 }}>
            Loading team members...
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3 }}>
            {users.map((user) => {
              const uiRole = mapRoleToUI(user.role);
              const color = roleColors[user.role] || '#60a5fa';
              const assignedTasks = getUserAssignedTasksCount(user.id);
              const letter = user.name ? user.name[0].toUpperCase() : 'U';

              return (
                <Paper key={user.id} elevation={0} onClick={() => navigate('/profile')} sx={{
                  p: 3, borderRadius: 3,
                  background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    border: `1px solid ${color}50`,
                    transform: 'translateY(-3px)',
                    boxShadow: `0 8px 25px ${color}20`
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    <Avatar sx={{
                      width: 52, height: 52, fontSize: 20, fontWeight: 'bold',
                      background: `linear-gradient(135deg, ${color}, #3b82f6)`
                    }}>
                      {letter}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body1" fontWeight="bold" sx={{ color: '#f1f5f9' }} noWrap title={user.name}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                        {uiRole}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(52,211,153,0.15)',
                        color: '#34d399',
                        fontWeight: 600, fontSize: 11,
                        border: '1px solid #34d39940'
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
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