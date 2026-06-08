import {
  Box, Paper, Typography, Avatar,
  Divider, Chip
} from '@mui/material'
import Navbar from '../components/Navbar'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import BadgeIcon from '@mui/icons-material/Badge'

function ProfilePage() {
  return (
    <Box sx={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Navbar />

      <Box sx={{ p: 4, maxWidth: 600, margin: '0 auto' }}>
        <Typography variant="h4" sx={{
          mb: 4, fontWeight: 'bold', color: '#1976d2'
        }}>
          My Profile
        </Typography>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>

          <Box sx={{
            display: 'flex', alignItems: 'center',
            gap: 3, mb: 4
          }}>
            <Avatar sx={{
              width: 80, height: 80,
              backgroundColor: '#1976d2',
              fontSize: 36
            }}>
              N
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Nadeesha Kavindi
              </Typography>
              <Chip
                label="Collaborator"
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ color: '#1976d2' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Nadeesha Kavindi
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon sx={{ color: '#1976d2' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email Address
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  nadeeshkavindi@gmail.com
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BadgeIcon sx={{ color: '#1976d2' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Collaborator
                </Typography>
              </Box>
            </Box>

          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            My Tasks Summary
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper elevation={1} sx={{
              p: 2, flex: 1, textAlign: 'center',
              borderRadius: 2, backgroundColor: '#e3f2fd'
            }}>
              <Typography variant="h4" fontWeight="bold" color="primary">3</Typography>
              <Typography variant="caption">To Do</Typography>
            </Paper>

            <Paper elevation={1} sx={{
              p: 2, flex: 1, textAlign: 'center',
              borderRadius: 2, backgroundColor: '#fff3e0'
            }}>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff9800' }}>2</Typography>
              <Typography variant="caption">In Progress</Typography>
            </Paper>

            <Paper elevation={1} sx={{
              p: 2, flex: 1, textAlign: 'center',
              borderRadius: 2, backgroundColor: '#e8f5e9'
            }}>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#4caf50' }}>5</Typography>
              <Typography variant="caption">Completed</Typography>
            </Paper>
          </Box>

        </Paper>
      </Box>
    </Box>
  )
}

export default ProfilePage