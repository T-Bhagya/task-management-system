import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Box, Typography, Grid, Paper, LinearProgress, Chip, Avatar } from '@mui/material'
import CalendarCard from '../components/CalendarCard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import PeopleIcon from '@mui/icons-material/People'
import { api } from '../services/api'

const priorityColors = {
  High: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  Medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  Low: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
}

const statusColors = {
  'In Progress': { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  'To Do': { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  'Completed': { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
}

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

const getStatusProgress = (status) => {
  if (status === 'COMPLETED') return 100;
  if (status === 'IN_PROGRESS') return 50;
  return 0;
};

function DashboardPage() {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Parse current logged in user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }

    async function loadData() {
      try {
        const fetchedTasks = await api.getTasks();
        const fetchedUsers = await api.getUsers();
        setTasks(fetchedTasks);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Dashboard data load error:', error.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [])

  // Derived stats
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const todoTasks = tasks.filter(t => t.status === 'TODO').length;
  const totalUsers = users.length;

  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: <AssignmentIcon sx={{ fontSize: 28 }} />, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', path: '/taskboard' },
    { label: 'In Progress', value: inProgressTasks, icon: <PendingIcon sx={{ fontSize: 28 }} />, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', path: '/taskboard' },
    { label: 'Completed', value: completedTasks, icon: <CheckCircleIcon sx={{ fontSize: 28 }} />, color: '#34d399', bg: 'rgba(52,211,153,0.15)', path: '/taskboard' },
    { label: 'Team Members', value: totalUsers, icon: <PeopleIcon sx={{ fontSize: 28 }} />, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', path: '/users' },
  ]

  // Calculate percentages
  const completedPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressPercent = totalTasks ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const todoPercent = totalTasks ? Math.round((todoTasks / totalTasks) * 100) : 0;

  // Recent tasks (up to 5, sorted by latest)
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id))
    .slice(0, 5);

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold"
            sx={{ color: '#f1f5f9', letterSpacing: -0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body2"
            sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            Welcome back, {currentUser?.name || 'User'}! Here's what's happening today.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <Paper elevation={0} onClick={() => navigate(stat.path)} sx={{
                p: 3, borderRadius: 3,
                background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 2.5,
                cursor: 'pointer',
                transition: 'all 0.25s',
                '&:hover': {
                  border: `1px solid ${stat.color}60`,
                  transform: 'translateY(-3px)',
                  boxShadow: `0 8px 25px ${stat.color}20`
                }
              }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: 2.5,
                  backgroundColor: stat.bg,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: stat.color, flexShrink: 0
                }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold"
                    sx={{ color: '#f1f5f9', lineHeight: 1 }}>
                    {loading ? '...' : stat.value}
                  </Typography>
                  <Typography variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Left Column: Overall Progress & Recent Tasks */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Overall Progress */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{
                  p: 3, borderRadius: 3,
                  background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <Typography variant="h6" fontWeight="bold"
                    sx={{ color: '#f1f5f9', mb: 3 }}>
                    Overall Progress
                  </Typography>
                  {[
                    { label: 'Completed', value: completedPercent, color: '#34d399' },
                    { label: 'In Progress', value: inProgressPercent, color: '#fbbf24' },
                    { label: 'To Do', value: todoPercent, color: '#60a5fa' },
                  ].map((item) => (
                    <Box key={item.label} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2"
                          sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2"
                          sx={{ color: item.color, fontWeight: 700 }}>
                          {item.value}%
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={item.value} sx={{
                        height: 8, borderRadius: 4,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        '& .MuiLinearProgress-bar': { backgroundColor: item.color, borderRadius: 4 }
                      }} />
                    </Box>
                  ))}
                  <Box sx={{
                    mt: 2, p: 2, borderRadius: 2,
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    display: 'flex', alignItems: 'center', gap: 1.5
                  }}>
                    <TrendingUpIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                      Overall health: {completedPercent}% tasks completed
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Recent Tasks */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{
                  p: 3, borderRadius: 3,
                  background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
                      Recent Tasks
                    </Typography>
                    <Typography variant="body2" onClick={() => navigate('/taskboard')} sx={{
                      color: '#a78bfa', cursor: 'pointer', fontWeight: 500,
                      '&:hover': { textDecoration: 'underline' }
                    }}>
                      View all →
                    </Typography>
                  </Box>
                  {loading ? (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 4, textAlign: 'center' }}>
                      Loading recent tasks...
                    </Typography>
                  ) : recentTasks.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', py: 4, textAlign: 'center' }}>
                      No tasks found. Create a new task to get started!
                    </Typography>
                  ) : (
                    recentTasks.map((task, index) => {
                      const uiStatus = mapStatusToUI(task.status);
                      const uiPriority = mapPriorityToUI(task.priority);
                      const progress = getStatusProgress(task.status);
                      const assigneeName = task.assignee?.name || 'Unassigned';
                      const avatarLetter = assigneeName[0].toUpperCase();

                      return (
                        <Box key={task.id} sx={{
                          display: 'flex', alignItems: 'center', gap: 2, py: 2,
                          borderBottom: index < recentTasks.length - 1
                            ? '1px solid rgba(255,255,255,0.06)' : 'none'
                        }}>
                          <Avatar sx={{
                            width: 36, height: 36, fontSize: 14, fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', flexShrink: 0
                          }}>
                            {avatarLetter}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2"
                              sx={{ color: '#e2e8f0', fontWeight: 500 }} noWrap>
                              {task.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8 }}>
                              <LinearProgress variant="determinate" value={progress} sx={{
                                flex: 1, height: 4, borderRadius: 2,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: progress === 100 ? '#34d399' : '#a78bfa',
                                  borderRadius: 2
                                }
                              }} />
                              <Typography variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, flexShrink: 0 }}>
                                {progress}%
                              </Typography>
                            </Box>
                          </Box>
                          <Chip label={uiPriority} size="small" sx={{
                            backgroundColor: priorityColors[uiPriority]?.bg || 'rgba(255,255,255,0.1)',
                            color: priorityColors[uiPriority]?.color || 'white',
                            fontWeight: 600, fontSize: 11, height: 24, flexShrink: 0,
                            border: `1px solid ${priorityColors[uiPriority]?.color || 'white'}40`
                          }} />
                          <Chip label={uiStatus} size="small" sx={{
                            backgroundColor: statusColors[uiStatus]?.bg || 'rgba(255,255,255,0.1)',
                            color: statusColors[uiStatus]?.color || 'white',
                            fontWeight: 600, fontSize: 11, height: 24, flexShrink: 0,
                            border: `1px solid ${statusColors[uiStatus]?.color || 'white'}40`
                          }} />
                        </Box>
                      );
                    })
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column: Calendar / Schedule Card */}
          <Grid item xs={12} md={4}>
            <CalendarCard tasks={tasks} />
          </Grid>
        </Grid>
      </Box>
    </Layout>
  )
}

export default DashboardPage