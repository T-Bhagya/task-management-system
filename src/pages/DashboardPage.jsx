import { Box, Grid, Paper, Typography } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import PeopleIcon from '@mui/icons-material/People'

function DashboardPage() {
  return (
    <Box sx={{ p: 4, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>

      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1976d2' }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon sx={{ fontSize: 48, color: '#1976d2' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">12</Typography>
              <Typography variant="body1" color="text.secondary">Total Tasks</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PendingIcon sx={{ fontSize: 48, color: '#ff9800' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">5</Typography>
              <Typography variant="body1" color="text.secondary">In Progress</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">7</Typography>
              <Typography variant="body1" color="text.secondary">Completed</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon sx={{ fontSize: 48, color: '#9c27b0' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">4</Typography>
              <Typography variant="body1" color="text.secondary">Team Members</Typography>
            </Box>
          </Paper>
        </Grid>

      </Grid>

      <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
        Recent Tasks
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        {['Fix login bug', 'Design dashboard', 'Write API docs', 'Test notifications'].map((task, index) => (
          <Box key={index} sx={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', py: 1.5,
            borderBottom: index < 3 ? '1px solid #eee' : 'none'
          }}>
            <Typography>{task}</Typography>
            <Typography variant="body2" sx={{
              backgroundColor: index % 2 === 0 ? '#e3f2fd' : '#fff3e0',
              color: index % 2 === 0 ? '#1976d2' : '#ff9800',
              px: 2, py: 0.5, borderRadius: 5
            }}>
              {index % 2 === 0 ? 'In Progress' : 'To Do'}
            </Typography>
          </Box>
        ))}
      </Paper>

    </Box>
  )
}

export default DashboardPage