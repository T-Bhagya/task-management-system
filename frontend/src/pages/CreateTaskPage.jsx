import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Box, Typography, Paper, TextField, Button, MenuItem } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { api } from '../services/api'
import { THEME } from '../theme'

const fieldStyle = {
  mb: 3,
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    backgroundColor: 'rgba(27,94,85,0.03)',
    color: THEME.colors.textMain,
    '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
    '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
    '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
  },
  '& .MuiInputLabel-root': { color: THEME.colors.textMuted },
  '& .MuiInputLabel-root.Mui-focused': { color: THEME.colors.sidebarBg },
  '& input': { color: THEME.colors.textMain },
  '& textarea': { color: THEME.colors.textMain },
  '& .MuiSelect-select': { color: THEME.colors.textMain },
}

const menuProps = {
  PaperProps: {
    sx: {
      backgroundColor: '#ffffff',
      border: '1px solid rgba(27,94,85,0.1)',
      '& .MuiMenuItem-root': {
        color: THEME.colors.textMain,
        '&:hover': { backgroundColor: 'rgba(27,94,85,0.05)' }
      }
    }
  }
}

function getBusyLevel(taskCount) {
  if (taskCount <= 1) return { label: 'Available', color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a' }
  if (taskCount <= 3) return { label: 'Moderate', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' }
  return { label: 'Busy', color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' }
}

function TeamAvailabilityPanel({ users }) {
  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: 3.5,
      backgroundColor: '#ffffff',
      border: '1px solid rgba(27,94,85,0.08)',
      boxShadow: '0 4px 25px rgba(27,94,85,0.04)',
      mb: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: 'rgba(27,94,85,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Typography sx={{ fontSize: 16 }}>👥</Typography>
        </Box>
        <Typography fontWeight={600} sx={{ color: THEME.colors.textMain, fontSize: 15 }}>
          Team Availability
        </Typography>
      </Box>

      {users.length === 0 ? (
        <Typography sx={{ color: THEME.colors.textMuted, fontSize: 13 }}>Loading team...</Typography>
      ) : (
        users.map((user) => {
          const taskCount = user.taskCount || 0
          const status = getBusyLevel(taskCount)
          const initials = user.name ? user.name.slice(0, 2).toUpperCase() : '??'
          return (
            <Box key={user.id} sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5, mb: 1, borderRadius: 2,
              backgroundColor: status.bg,
              border: `1px solid ${status.dot}22`,
            }}>
              {/* Left: avatar + name */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: '50%',
                  backgroundColor: THEME.colors.sidebarBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    {initials}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 12, fontWeight: 500, color: THEME.colors.textMain,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {user.name || user.email}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: THEME.colors.textMuted }}>
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>

              {/* Right: dot + status — fixed width so it never wraps */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.6,
                flexShrink: 0, ml: 1, width: 72, justifyContent: 'flex-end'
              }}>
                <Box sx={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: status.dot, flexShrink: 0
                }} />
                <Typography sx={{ fontSize: 11, fontWeight: 500, color: status.color, whiteSpace: 'nowrap' }}>
                  {status.label}
                </Typography>
              </Box>
            </Box>
          )
        })
      )}

      {/* Legend */}
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(27,94,85,0.08)' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          {[
            { dot: '#16a34a', label: 'Available — 0 to 1 tasks' },
            { dot: '#f59e0b', label: 'Moderate — 2 to 3 tasks' },
            { dot: '#ef4444', label: 'Busy — 4 or more tasks' },
          ].map((item) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.dot, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 11, color: THEME.colors.textMuted }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  )
}

function PriorityGuidePanel() {
  const priorities = [
    { label: 'High', desc: 'Urgent — needs immediate attention', color: '#dc2626', bg: '#fef2f2' },
    { label: 'Medium', desc: 'Important but not urgent', color: '#d97706', bg: '#fffbeb' },
    { label: 'Low', desc: 'Can be done when time allows', color: '#16a34a', bg: '#f0fdf4' },
  ]
  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: 3.5,
      backgroundColor: '#ffffff',
      border: '1px solid rgba(27,94,85,0.08)',
      boxShadow: '0 4px 25px rgba(27,94,85,0.04)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: 'rgba(27,94,85,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Typography sx={{ fontSize: 16 }}>🚦</Typography>
        </Box>
        <Typography fontWeight={600} sx={{ color: THEME.colors.textMain, fontSize: 15 }}>
          Priority Guide
        </Typography>
      </Box>
      {priorities.map((p) => (
        <Box key={p.label} sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          p: 1.2, mb: 1, borderRadius: 2,
          backgroundColor: p.bg,
        }}>
          <Box sx={{
            px: 1.2, py: 0.3, borderRadius: 1.5,
            backgroundColor: p.color,
            minWidth: 52, textAlign: 'center', flexShrink: 0
          }}>
            <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{p.label}</Typography>
          </Box>
          <Typography sx={{ fontSize: 11, color: THEME.colors.textMuted, lineHeight: 1.4 }}>{p.desc}</Typography>
        </Box>
      ))}
    </Paper>
  )
}

function CreateTaskPage() {
  const [form, setForm] = useState({
    title: '', description: '', priority: '',
    assignee: '', dueDate: '', status: '',
    category: '', estimatedHours: '',
  })
  const [users, setUsers] = useState([])
  const [usersWithTasks, setUsersWithTasks] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function loadUsers() {
      try {
        const fetchedUsers = await api.getUsers()
        setUsers(fetchedUsers)
        const tasks = await api.getTasks()
        const countMap = {}
        tasks.forEach(t => {
          if (t.assigned_to) {
            countMap[t.assigned_to] = (countMap[t.assigned_to] || 0) + 1
          }
        })
        const enriched = fetchedUsers.map(u => ({ ...u, taskCount: countMap[u.id] || 0 }))
        setUsersWithTasks(enriched)
      } catch (err) {
        console.error('Failed to load users:', err.message)
      }
    }
    loadUsers()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.title || !form.priority || !form.status) {
      setError('Please fill in Title, Priority, and Status.')
      return
    }
    setError('')
    setSubmitted(false)

    let mappedPriority = 'MEDIUM'
    if (form.priority === 'High') mappedPriority = 'HIGH'
    else if (form.priority === 'Low') mappedPriority = 'LOW'

    let mappedStatus = 'TODO'
    if (form.status === 'In Progress') mappedStatus = 'IN_PROGRESS'
    else if (form.status === 'Completed') mappedStatus = 'COMPLETED'

    const payload = {
      title: form.title,
      description: form.description || null,
      priority: mappedPriority,
      status: mappedStatus,
      assigned_to: form.assignee ? parseInt(form.assignee) : null,
      due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    }

    try {
      await api.createTask(payload)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        navigate('/taskboard')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to create task. Please try again.')
    }
  }

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
            Create Task
          </Typography>
          <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
            Add a new task to the board
          </Typography>
        </Box>

        {/* Two column layout — form smaller, panel larger */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

          {/* LEFT — form (smaller) */}
          <Box sx={{ flex: '0 0 55%', minWidth: 0 }}>
            <Paper elevation={0} sx={{
              p: 3, borderRadius: 3.5,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(27,94,85,0.08)',
              boxShadow: '0 4px 25px rgba(27,94,85,0.04)'
            }}>

              {submitted && (
                <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Typography sx={{ color: '#16a34a', fontWeight: 600 }}>
                    ✅ Task created successfully! Redirecting...
                  </Typography>
                </Box>
              )}

              {error && (
                <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                  <Typography sx={{ color: '#ef4444', fontWeight: 600 }}>
                    ❌ {error}
                  </Typography>
                </Box>
              )}

              <TextField fullWidth label="Task Title *" name="title"
                value={form.title} onChange={handleChange} sx={fieldStyle} />

              <TextField fullWidth label="Description" name="description"
                value={form.description} onChange={handleChange}
                multiline rows={3} sx={fieldStyle} />

              <TextField fullWidth select label="Priority *" name="priority"
                value={form.priority} onChange={handleChange}
                sx={fieldStyle} SelectProps={{ MenuProps: menuProps }}>
                {['High', 'Medium', 'Low'].map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </TextField>

              <TextField fullWidth select label="Status *" name="status"
                value={form.status} onChange={handleChange}
                sx={fieldStyle} SelectProps={{ MenuProps: menuProps }}>
                {['To Do', 'In Progress', 'Completed'].map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>

              <TextField fullWidth select label="Assignee" name="assignee"
                value={form.assignee} onChange={handleChange}
                sx={fieldStyle} SelectProps={{ MenuProps: menuProps }}>
                <MenuItem value="">Unassigned</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
                ))}
              </TextField>

              <TextField fullWidth label="Due Date" name="dueDate"
                type="date" value={form.dueDate} onChange={handleChange}
                InputLabelProps={{ shrink: true }} sx={fieldStyle} />

              <TextField fullWidth select label="Category / Tag" name="category"
                value={form.category} onChange={handleChange}
                sx={fieldStyle} SelectProps={{ MenuProps: menuProps }}>
                <MenuItem value="">None</MenuItem>
                {['Frontend', 'Backend', 'Testing', 'Design', 'Documentation', 'Database', 'DevOps'].map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>

              <TextField fullWidth label="Estimated Hours" name="estimatedHours"
                type="number" value={form.estimatedHours} onChange={handleChange}
                placeholder="e.g. 4"
                inputProps={{ min: 0.5, max: 999, step: 0.5 }}
                InputProps={{
                  endAdornment: (
                    <Typography sx={{ color: THEME.colors.textMuted, fontSize: 13, pr: 1 }}>hrs</Typography>
                  )
                }}
                sx={fieldStyle} />

              <Button fullWidth variant="contained" endIcon={<SendIcon />}
                onClick={handleSubmit}
                sx={{
                  py: 1.5, fontWeight: 'bold', fontSize: 15,
                  borderRadius: 2.5, textTransform: 'none',
                  backgroundColor: THEME.colors.sidebarBg,
                  boxShadow: '0 4px 14px rgba(27,94,85,0.15)',
                  '&:hover': { backgroundColor: '#13463f' }
                }}>
                Create Task
              </Button>

            </Paper>
          </Box>

          {/* RIGHT — panels (larger) */}
          <Box sx={{ flex: '0 0 42%', minWidth: 0 }}>
            <TeamAvailabilityPanel users={usersWithTasks} />
            <PriorityGuidePanel />
          </Box>

        </Box>
      </Box>
    </Layout>
  )
}

export default CreateTaskPage