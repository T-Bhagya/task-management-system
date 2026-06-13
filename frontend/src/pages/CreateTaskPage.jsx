import { useState } from 'react'
import Layout from '../components/Layout'
import { Box, Typography, Paper, TextField, Button, MenuItem } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

const fieldStyle = {
  mb: 3,
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
    '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' },
  '& input': { color: 'white' },
  '& textarea': { color: 'white' },
  '& .MuiSelect-select': { color: 'white' },
}

function CreateTaskPage() {
  const [form, setForm] = useState({
    title: '', description: '', priority: '', assignee: '', dueDate: '', status: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    if (!form.title || !form.priority || !form.status) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setForm({ title: '', description: '', priority: '', assignee: '', dueDate: '', status: '' })
    }, 2000)
  }

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh' }}>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
            Create Task
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            Add a new task to the board
          </Typography>
        </Box>

        <Paper elevation={0} sx={{
          p: 4, borderRadius: 3, maxWidth: 600,
          background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>

          {submitted && (
            <Box sx={{
              mb: 3, p: 2, borderRadius: 2,
              background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.3)',
            }}>
              <Typography sx={{ color: '#34d399', fontWeight: 600 }}>
                ✅ Task created successfully!
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth label="Task Title" name="title"
            value={form.title} onChange={handleChange}
            sx={fieldStyle}
          />

          <TextField
            fullWidth label="Description" name="description"
            value={form.description} onChange={handleChange}
            multiline rows={3} sx={fieldStyle}
          />

          <TextField
            fullWidth select label="Priority" name="priority"
            value={form.priority} onChange={handleChange}
            sx={fieldStyle}
            SelectProps={{ MenuProps: { PaperProps: { sx: { backgroundColor: '#1e2235', color: 'white' } } } }}
          >
            {['High', 'Medium', 'Low'].map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth select label="Status" name="status"
            value={form.status} onChange={handleChange}
            sx={fieldStyle}
            SelectProps={{ MenuProps: { PaperProps: { sx: { backgroundColor: '#1e2235', color: 'white' } } } }}
          >
            {['To Do', 'In Progress', 'Completed'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth label="Assignee" name="assignee"
            value={form.assignee} onChange={handleChange}
            sx={fieldStyle}
          />

          <TextField
            fullWidth label="Due Date" name="dueDate"
            type="date" value={form.dueDate} onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            sx={fieldStyle}
          />

          <Button
            fullWidth variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSubmit}
            sx={{
              py: 1.5, fontWeight: 'bold', fontSize: 15,
              borderRadius: 2, textTransform: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #2563eb)' }
            }}
          >
            Create Task
          </Button>

        </Paper>
      </Box>
    </Layout>
  )
}

export default CreateTaskPage