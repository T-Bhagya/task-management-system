import Layout from '../components/Layout'
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material'

const users = [
  { name: 'Nadeesha', role: 'Frontend Developer', status: 'Active', tasks: 5, avatar: 'N', color: '#7c3aed' },
  { name: 'John', role: 'Backend Developer', status: 'Active', tasks: 3, avatar: 'J', color: '#3b82f6' },
  { name: 'Sara', role: 'UI/UX Designer', status: 'Active', tasks: 4, avatar: 'S', color: '#34d399' },
  { name: 'Mike', role: 'Project Manager', status: 'Away', tasks: 2, avatar: 'M', color: '#fbbf24' },
]

function UsersPage() {
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

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3 }}>
          {users.map((user) => (
            <Paper key={user.name} elevation={0} sx={{
              p: 3, borderRadius: 3,
              background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
              '&:hover': {
                border: `1px solid ${user.color}50`,
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 25px ${user.color}20`
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Avatar sx={{
                  width: 52, height: 52, fontSize: 20, fontWeight: 'bold',
                  background: `linear-gradient(135deg, ${user.color}, #3b82f6)`
                }}>
                  {user.avatar}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                    {user.role}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={user.status}
                  size="small"
                  sx={{
                    backgroundColor: user.status === 'Active'
                      ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                    color: user.status === 'Active' ? '#34d399' : '#fbbf24',
                    fontWeight: 600, fontSize: 11,
                    border: `1px solid ${user.status === 'Active' ? '#34d39940' : '#fbbf2440'}`
                  }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                  {user.tasks} tasks assigned
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    </Layout>
  )
}

export default UsersPage