import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { 
  Box, Typography, Paper, Avatar, Chip, 
  Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Alert 
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
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

  // Creation dialog states
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null
  const isAdmin = currentUser?.role === 'ADMIN'

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

  const handleCreate = async () => {
    if (!name || !email) {
      setError('Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setCreating(true);
    try {
      const res = await api.createUser({ name, email });
      setTempPassword(res.tempPassword);
      
      // Refresh user list
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err.message || 'Failed to create collaborator.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
              Team Members
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
              Manage your team and their roles
            </Typography>
          </Box>
          
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setOpen(true);
                setTempPassword('');
                setError('');
                setName('');
                setEmail('');
              }}
              sx={{
                backgroundColor: THEME.colors.sidebarBg,
                textTransform: 'none',
                borderRadius: 2.5,
                fontWeight: 'bold',
                px: 3, py: 1.2,
                '&:hover': { backgroundColor: '#13463f' }
              }}
            >
              Add Collaborator
            </Button>
          )}
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

      {/* Add Collaborator Dialog */}
      <Dialog 
        open={open} 
        onClose={() => !creating && setOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1, maxWidth: 450, width: '100%' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>
          Add Team Member
        </DialogTitle>
        <DialogContent>
          {tempPassword ? (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Alert severity="success" sx={{ borderRadius: 2.5, mb: 2 }}>
                Collaborator created successfully!
              </Alert>
              <Typography variant="body2" sx={{ color: THEME.colors.textMain, mb: 1 }}>
                A simulated welcome email has been printed to the server console.
              </Typography>
              <Typography variant="body2" sx={{ color: THEME.colors.textMain, mb: 2 }}>
                Share this temporary password with the collaborator:
              </Typography>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(27,94,85,0.06)', 
                border: '1px dashed rgba(27,94,85,0.3)',
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: 18,
                textAlign: 'center',
                fontWeight: 'bold',
                color: THEME.colors.sidebarBg,
                letterSpacing: 1
              }}>
                {tempPassword}
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 3 }}>
                Enter the name and email of the team member. An email simulation will print their temporary password in the console.
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                autoFocus
                margin="dense"
                label="Full Name"
                type="text"
                fullWidth
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />

              <TextField
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {tempPassword ? (
            <Button 
              onClick={() => setOpen(false)} 
              variant="contained"
              sx={{ 
                backgroundColor: THEME.colors.sidebarBg,
                borderRadius: 2.5,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#13463f' }
              }}
            >
              Close
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => setOpen(false)} 
                disabled={creating}
                sx={{ textTransform: 'none', color: THEME.colors.textMuted }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                variant="contained"
                disabled={creating}
                sx={{ 
                  backgroundColor: THEME.colors.sidebarBg,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#13463f' }
                }}
              >
                {creating ? 'Creating...' : 'Create Member'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default UsersPage