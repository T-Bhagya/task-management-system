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



export default CreateTaskPage