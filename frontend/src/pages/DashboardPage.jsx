import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Box, Typography, Grid, Paper, LinearProgress, Chip, Avatar, InputBase, IconButton } from '@mui/material'
import CalendarCard from '../components/CalendarCard'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import PeopleIcon from '@mui/icons-material/People'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
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

  // Stats derivations
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const todoTasks = tasks.filter(t => t.status === 'TODO').length;
  const totalUsers = users.length;

  const completedPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressPercent = totalTasks ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const todoPercent = totalTasks ? Math.round((todoTasks / totalTasks) * 100) : 0;

  // Recent tasks (agenda items/upcoming)
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id))
    .slice(0, 3);

  // Format today's date like "18 August 2024"
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>
        
        {/* Main Banner Heading */}
        <Typography variant="h3" fontWeight="bold" sx={{ color: THEME.colors.sidebarBg, mb: 4, fontFamily: 'Outfit, sans-serif', letterSpacing: -0.8 }}>
          Task Dashboard
        </Typography>

        {/* Hello Banner row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
              Hello, {currentUser?.name?.split(' ')[0] || 'James'}
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, fontWeight: 500, mt: 0.2 }}>
              {formattedDate}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {/* Search Input Button */}
            <Paper component="div" sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 240, borderRadius: 2.5, boxShadow: 'none', border: '1px solid rgba(27,94,85,0.12)' }}>
              <InputBase
                sx={{ ml: 1, flex: 1, fontSize: 13 }}
                placeholder="Search tasks..."
                inputProps={{ 'aria-label': 'search tasks' }}
              />
              <IconButton type="button" sx={{ p: '6px', color: THEME.colors.textMuted }} aria-label="search">
                <SearchIcon fontSize="small" />
              </IconButton>
            </Paper>

            {/* Add New Task Button */}
            <Box onClick={() => navigate('/create-task')} sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              backgroundColor: THEME.colors.darkBtnBg,
              color: 'white', px: 2.5, py: 1.2,
              borderRadius: 2.5, cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.15s, opacity 0.15s',
              '&:hover': {
                opacity: 0.9,
                transform: 'translateY(-1px)'
              }
            }}>
              <AddIcon fontSize="small" />
              Add New Task
            </Box>
          </Box>
        </Box>

        {/* Category Cards Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* To Do Card (Purple) */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 3, borderRadius: 4,
              backgroundColor: THEME.colors.purpleAccent,
              color: '#ffffff',
              boxShadow: '0 8px 25px rgba(136,144,211,0.12)',
              position: 'relative'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="body1" fontWeight="bold">To Do</Typography>
                <IconButton size="small" sx={{ color: 'white' }}><MoreVertIcon fontSize="small" /></IconButton>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                Planner Progress
              </Typography>
              <LinearProgress variant="determinate" value={todoPercent} sx={{
                height: 8, borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                mb: 2,
                '& .MuiLinearProgress-bar': { backgroundColor: 'white', borderRadius: 4 }
              }} />
              <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500 }}>
                {todoTasks} tasks ({todoPercent}%)
              </Typography>
            </Paper>
          </Grid>

          {/* In Progress Card (Orange) */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 3, borderRadius: 4,
              backgroundColor: THEME.colors.orangeAccent,
              color: '#ffffff',
              boxShadow: '0 8px 25px rgba(235,94,67,0.12)',
              position: 'relative'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="body1" fontWeight="bold">In Progress</Typography>
                <IconButton size="small" sx={{ color: 'white' }}><MoreVertIcon fontSize="small" /></IconButton>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                Current Progress
              </Typography>
              <LinearProgress variant="determinate" value={inProgressPercent} sx={{
                height: 8, borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                mb: 2,
                '& .MuiLinearProgress-bar': { backgroundColor: 'white', borderRadius: 4 }
              }} />
              <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500 }}>
                {inProgressTasks} tasks ({inProgressPercent}%)
              </Typography>
            </Paper>
          </Grid>

          {/* Completed Card (Green) */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 3, borderRadius: 4,
              backgroundColor: THEME.colors.greenAccent,
              color: '#ffffff',
              boxShadow: '0 8px 25px rgba(27,94,85,0.12)',
              position: 'relative'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="body1" fontWeight="bold">Completed</Typography>
                <IconButton size="small" sx={{ color: 'white' }}><MoreVertIcon fontSize="small" /></IconButton>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                Completed Progress
              </Typography>
              <LinearProgress variant="determinate" value={completedPercent} sx={{
                height: 8, borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                mb: 2,
                '& .MuiLinearProgress-bar': { backgroundColor: 'white', borderRadius: 4 }
              }} />
              <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500 }}>
                {completedTasks} tasks ({completedPercent}%)
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3.5}>
          {/* Left Column: Summary & Upcoming Task list */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3.5}>
              
              {/* Task Summary Grid */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain, mb: 2 }}>
                  Task Summary
                </Typography>
                <Grid container spacing={2.5}>
                  {[
                    { label: 'Total Tasks', value: totalTasks, icon: <AssignmentIcon sx={{ fontSize: 22 }} />, color: THEME.colors.sidebarBg, path: '/taskboard' },
                    { label: 'In Progress', value: inProgressTasks, icon: <PendingIcon sx={{ fontSize: 22 }} />, color: THEME.colors.purpleAccent, path: '/taskboard' },
                    { label: 'Completed', value: completedTasks, icon: <CheckCircleIcon sx={{ fontSize: 22 }} />, color: THEME.colors.greenAccent, path: '/taskboard' },
                    { label: 'To Do', value: todoTasks, icon: <AssignmentIcon sx={{ fontSize: 22 }} />, color: THEME.colors.orangeAccent, path: '/taskboard' },
                    { label: 'Team Members', value: totalUsers, icon: <PeopleIcon sx={{ fontSize: 22 }} />, color: '#4f46e5', path: '/users' },
                  ].map((stat) => (
                    <Grid item xs={6} sm={4} key={stat.label}>
                      <Paper elevation={0} onClick={() => navigate(stat.path)} sx={{
                        p: 2.5, borderRadius: 3.5,
                        backgroundColor: '#ebf0f0',
                        border: '1px solid rgba(27,94,85,0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 110,
                        '&:hover': {
                          backgroundColor: '#e3e8e8',
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain, lineHeight: 1 }}>
                          {loading ? '...' : stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: THEME.colors.textMuted, fontWeight: 600, fontSize: 13 }}>
                          {stat.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}

                  {/* Add New Data Card styled matching mockup */}
                  <Grid item xs={6} sm={4}>
                    <Paper elevation={0} onClick={() => navigate('/create-task')} sx={{
                      p: 2.5, borderRadius: 3.5,
                      backgroundColor: 'rgba(27,94,85,0.06)',
                      border: '1px dashed rgba(27,94,85,0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 110,
                      gap: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(27,94,85,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <AddIcon sx={{ color: THEME.colors.sidebarBg }} />
                      <Typography variant="body2" sx={{ color: THEME.colors.sidebarBg, fontWeight: 700, fontSize: 13 }}>
                        New Task
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              {/* Upcoming Task Section */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain, mb: 2 }}>
                  Upcoming Task
                </Typography>
                
                {loading ? (
                  <Typography variant="body2" sx={{ color: THEME.colors.textMuted, py: 4, textAlign: 'center' }}>
                    Loading tasks...
                  </Typography>
                ) : recentTasks.length === 0 ? (
                  <Typography variant="body2" sx={{ color: THEME.colors.textMuted, py: 4, textAlign: 'center' }}>
                    No tasks found. Create a new task to get started!
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {recentTasks.map((task) => {
                      const uiPriority = mapPriorityToUI(task.priority);
                      const uiStatus = mapStatusToUI(task.status);
                      const priorityColor = priorityColors[uiPriority]?.color || THEME.colors.sidebarBg;

                      return (
                        <Paper key={task.id} elevation={0} sx={{
                          p: 2.5, borderRadius: 3.5,
                          backgroundColor: '#ffffff',
                          border: '1px solid rgba(27,94,85,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          transition: 'transform 0.15s',
                          '&:hover': {
                            transform: 'translateY(-1px)'
                          }
                        }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body1" fontWeight="bold" sx={{ color: THEME.colors.textMain }} noWrap>
                              {task.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5, fontSize: 12.5 }} noWrap>
                              {task.description || 'No description provided.'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                            <Chip label={uiPriority} size="small" sx={{
                              backgroundColor: priorityColors[uiPriority]?.bg || 'rgba(0,0,0,0.05)',
                              color: priorityColor,
                              fontWeight: 700, fontSize: 11, height: 24
                            }} />
                            <Chip label={uiStatus} size="small" sx={{
                              backgroundColor: statusColors[uiStatus]?.bg || 'rgba(0,0,0,0.05)',
                              color: statusColors[uiStatus]?.color || THEME.colors.textMuted,
                              fontWeight: 700, fontSize: 11, height: 24
                            }} />
                            <CheckCircleOutlineIcon sx={{ color: task.status === 'COMPLETED' ? THEME.colors.greenAccent : 'rgba(0,0,0,0.15)' }} />
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Grid>

            </Grid>
          </Grid>

          {/* Right Column: Schedule Card */}
          <Grid item xs={12} md={4}>
            <CalendarCard tasks={tasks} />
          </Grid>
        </Grid>

      </Box>
    </Layout>
  )
}

export default DashboardPage