import { useState } from 'react'
import { Box, Typography, Paper, Chip } from '@mui/material'

const initialTasks = {
  todo: [
    { id: 1, title: 'Design login page', priority: 'High', assignee: 'Nadeesha' },
    { id: 2, title: 'Setup database', priority: 'Medium', assignee: 'John' },
    { id: 3, title: 'Write test cases', priority: 'Low', assignee: 'Sara' },
  ],
  inProgress: [
    { id: 4, title: 'Build dashboard', priority: 'High', assignee: 'Nadeesha' },
    { id: 5, title: 'Create API endpoints', priority: 'Medium', assignee: 'John' },
  ],
  completed: [
    { id: 6, title: 'Project setup', priority: 'Low', assignee: 'Sara' },
    { id: 7, title: 'Install dependencies', priority: 'Low', assignee: 'Nadeesha' },
  ]
}

const priorityColors = {
  High: 'error',
  Medium: 'warning',
  Low: 'success'
}

const columns = [
  { key: 'todo', label: 'To Do', color: '#1976d2' },
  { key: 'inProgress', label: 'In Progress', color: '#ff9800' },
  { key: 'completed', label: 'Completed', color: '#4caf50' }
]

function TaskCard({ task }) {
  return (
    <Paper elevation={2} sx={{
      p: 2, mb: 2, borderRadius: 2,
      borderLeft: '4px solid',
      borderLeftColor: task.priority === 'High' ? '#f44336' :
        task.priority === 'Medium' ? '#ff9800' : '#4caf50'
    }}>
      <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
        {task.title}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={task.priority}
          color={priorityColors[task.priority]}
          size="small"
        />
        <Typography variant="caption" color="text.secondary">
          {task.assignee}
        </Typography>
      </Box>
    </Paper>
  )
}

function TaskBoardPage() {
  const [tasks] = useState(initialTasks)

  return (
    <Box sx={{ p: 4, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>

      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1976d2' }}>
        Task Board
      </Typography>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {columns.map((column) => (
          <Box key={column.key} sx={{ flex: 1 }}>

            <Box sx={{
              backgroundColor: column.color,
              borderRadius: 2, p: 1.5, mb: 2,
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                {column.label}
              </Typography>
              <Chip
                label={tasks[column.key].length}
                size="small"
                sx={{ backgroundColor: 'white', fontWeight: 'bold' }}
              />
            </Box>

            <Box>
              {tasks[column.key].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Box>

          </Box>
        ))}
      </Box>

    </Box>
  )
}

export default TaskBoardPage