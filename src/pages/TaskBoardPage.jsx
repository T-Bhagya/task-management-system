import { useState } from 'react'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Chip, Avatar, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

const initialTasks = {
  todo: [
    { id: 1, title: 'Design login page', priority: 'High', assignee: 'N' },
    { id: 2, title: 'Setup database', priority: 'Medium', assignee: 'J' },
    { id: 3, title: 'Write test cases', priority: 'Low', assignee: 'S' },
  ],
  inProgress: [
    { id: 4, title: 'Build dashboard', priority: 'High', assignee: 'N' },
    { id: 5, title: 'Create API endpoints', priority: 'Medium', assignee: 'J' },
  ],
  completed: [
    { id: 6, title: 'Project setup', priority: 'Low', assignee: 'S' },
    { id: 7, title: 'Install dependencies', priority: 'Low', assignee: 'N' },
  ]
}

const columns = [
  { key: 'todo', label: 'To Do', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  { key: 'inProgress', label: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  { key: 'completed', label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
]

const priorityColors = {
  High: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  Medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  Low: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
}

function TaskBoardPage() {
  const [tasks] = useState(initialTasks)

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
              Task Board
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
              Manage and track your team's tasks
            </Typography>
          </Box>
          <Button startIcon={<AddIcon />} variant="contained" sx={{
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3,
            '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #2563eb)' }
          }}>
            Add Task
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {columns.map((col) => (
            <Box key={col.key} sx={{ flex: 1, minWidth: 0 }}>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color }} />
                <Typography fontWeight="bold" sx={{ color: '#f1f5f9' }}>
                  {col.label}
                </Typography>
                <Chip label={tasks[col.key].length} size="small" sx={{
                  backgroundColor: col.bg, color: col.color,
                  fontWeight: 700, height: 22, fontSize: 12
                }} />
              </Box>

              {tasks[col.key].map((task) => (
                <Paper key={task.id} elevation={0} sx={{
                  p: 2.5, mb: 2, borderRadius: 2.5,
                  background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  '&:hover': {
                    border: `1px solid ${col.color}50`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${col.color}15`
                  }
                }}>
                  <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500, mb: 2 }}>
                    {task.title}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={task.priority} size="small" sx={{
                      backgroundColor: priorityColors[task.priority].bg,
                      color: priorityColors[task.priority].color,
                      fontWeight: 600, fontSize: 11, height: 22,
                      border: `1px solid ${priorityColors[task.priority].color}40`
                    }} />
                    <Avatar sx={{
                      width: 28, height: 28, fontSize: 12, fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                    }}>
                      {task.assignee}
                    </Avatar>
                  </Box>
                </Paper>
              ))}

            </Box>
          ))}
        </Box>
      </Box>
    </Layout>
  )
}

export default TaskBoardPage