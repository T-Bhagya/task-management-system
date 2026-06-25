import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import {
  Box, Typography, Paper, Avatar, Chip,
  Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, Alert,
  IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import WorkIcon from '@mui/icons-material/Work'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { api } from '../services/api'
import { THEME } from '../theme'

// ── Constants ────────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  ADMIN: '#1b5e55',
  PROJECT_MANAGER: '#eb5e43',
  COLLABORATOR: '#8890d3',
}

const ROLE_BADGE = {
  ADMIN:           { bg: 'rgba(27,94,85,0.10)',    color: '#1b5e55', border: '1px solid rgba(27,94,85,0.22)' },
  PROJECT_MANAGER: { bg: 'rgba(235,94,67,0.10)',   color: '#eb5e43', border: '1px solid rgba(235,94,67,0.22)' },
  COLLABORATOR:    { bg: 'rgba(136,144,211,0.12)', color: '#6870c4', border: '1px solid rgba(136,144,211,0.28)' },
}

const mapRole = (role) => {
  if (role === 'ADMIN') return 'Administrator'
  if (role === 'PROJECT_MANAGER') return 'Project Manager'
  if (role === 'COLLABORATOR') return 'Collaborator'
  return role
}

// ── Shared UI atoms ──────────────────────────────────────────────────────────

function StatCard({ Icon, label, value, color }) {
  return (
    <Paper elevation={0} sx={{
      flex: '1 1 160px', p: 2.5, borderRadius: 3,
      border: '1px solid rgba(27,94,85,0.08)',
      display: 'flex', alignItems: 'center', gap: 2,
      background: '#fff',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: `0 6px 24px ${color}18` }
    }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: 2.5, flexShrink: 0,
        backgroundColor: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon sx={{ color, fontSize: 24 }} />
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} sx={{ color: THEME.colors.textMain, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: THEME.colors.textMuted, fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  )
}

function UserCell({ user }) {
  const color = ROLE_COLORS[user.role] || THEME.colors.sidebarBg
  const letter = user.name ? user.name[0].toUpperCase() : 'U'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ width: 40, height: 40, fontSize: 16, fontWeight: 700, background: color, color: '#fff', flexShrink: 0 }}>
        {letter}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight={600} sx={{ color: THEME.colors.textMain, lineHeight: 1.3 }}>
          {user.name}
        </Typography>
        <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}>
          {user.email}
        </Typography>
      </Box>
    </Box>
  )
}

function RoleBadge({ role }) {
  const s = ROLE_BADGE[role] || {}
  return (
    <Chip label={mapRole(role)} size="small" sx={{
      backgroundColor: s.bg, color: s.color,
      fontWeight: 700, fontSize: 11, border: s.border, borderRadius: 1.5
    }} />
  )
}

function StatusBadge({ isActive }) {
  return (
    <Chip
      label={isActive !== false ? 'Active' : 'Inactive'}
      size="small"
      sx={{
        backgroundColor: isActive !== false ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)',
        color: isActive !== false ? '#16a34a' : '#ef4444',
        fontWeight: 700, fontSize: 11,
        border: isActive !== false ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.18)',
        borderRadius: 1.5
      }}
    />
  )
}

function TaskCount({ count }) {
  return (
    <Typography variant="body2" sx={{ color: THEME.colors.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {count} {count === 1 ? 'task' : 'tasks'}
    </Typography>
  )
}

function ProjectChips({ names }) {
  if (!names || names.length === 0)
    return <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}>—</Typography>
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {names.map(n => (
        <Chip key={n} label={n} size="small" sx={{
          backgroundColor: 'rgba(27,94,85,0.07)', color: THEME.colors.sidebarBg,
          fontSize: 11, fontWeight: 600, border: '1px solid rgba(27,94,85,0.14)', borderRadius: 1.5
        }} />
      ))}
    </Box>
  )
}

// Styled table header cell
function TH({ children, width, align }) {
  return (
    <TableCell align={align} sx={{
      fontWeight: 700, color: THEME.colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11,
      backgroundColor: 'rgba(27,94,85,0.04)',
      borderBottom: '1.5px solid rgba(27,94,85,0.10)',
      py: 1.5, width
    }}>
      {children}
    </TableCell>
  )
}

function ActionToggle({ user, onToggle }) {
  return (
    <Tooltip title={user.is_active !== false ? 'Deactivate member' : 'Activate member'} arrow>
      <IconButton
        size="medium"
        onClick={() => onToggle(user)}
        sx={{
          borderRadius: 2, px: 1.1, py: 0.7,
          backgroundColor: user.is_active !== false ? 'rgba(235,94,67,0.10)' : 'rgba(27,94,85,0.10)',
          color: user.is_active !== false ? '#eb5e43' : '#1b5e55',
          '&:hover': {
            backgroundColor: user.is_active !== false ? 'rgba(235,94,67,0.22)' : 'rgba(27,94,85,0.22)',
            transform: 'scale(1.08)',
          },
          transition: 'all 0.18s'
        }}
      >
        {user.is_active !== false
          ? <ToggleOnIcon sx={{ fontSize: 23 }} />
          : <ToggleOffIcon sx={{ fontSize: 23 }} />}
      </IconButton>
    </Tooltip>
  )
}

function ActionDelete({ onDelete }) {
  return (
    <Tooltip title="Delete collaborator" arrow>
      <IconButton
        size="medium"
        onClick={onDelete}
        sx={{
          borderRadius: 2, px: 1.1, py: 0.7,
          backgroundColor: 'rgba(239,68,68,0.08)',
          color: '#ef4444',
          '&:hover': { backgroundColor: 'rgba(239,68,68,0.20)', transform: 'scale(1.08)' },
          transition: 'all 0.18s'
        }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Tooltip>
  )
}

function EmptyRow({ cols, message }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} sx={{ textAlign: 'center', py: 7, color: THEME.colors.textMuted, fontSize: 14 }}>
        {message}
      </TableCell>
    </TableRow>
  )
}

// ── ADMIN VIEW ────────────────────────────────────────────────────────────────
function AdminView({ users, tasks, currentUser, onRefresh }) {
  const [tab, setTab] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('COLLABORATOR')
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const admins   = users.filter(u => u.role === 'ADMIN')
  const pms      = users.filter(u => u.role === 'PROJECT_MANAGER')
  const collabs  = users.filter(u => u.role === 'COLLABORATOR')
  const active   = users.filter(u => u.is_active !== false)
  const inactive = users.filter(u => u.is_active === false)

  const filtered =
    tab === 'ALL' ? users :
    tab === 'ADMIN' ? admins :
    tab === 'PROJECT_MANAGER' ? pms : collabs

  const taskCount = (id) => tasks.filter(t => t.assigned_to === id).length

  const handleToggle = async (user) => {
    try { await api.toggleUserStatus(user.id, !user.is_active); onRefresh() }
    catch (err) { alert(err.message) }
  }

  const handleCreate = async () => {
    if (!name || !email) { setFormError('Please fill in all fields'); return }
    if (!email.includes('@')) { setFormError('Please enter a valid email address'); return }
    setFormError(''); setCreating(true)
    try {
      const res = await api.createUser({ name, email, role })
      setTempPassword(res.tempPassword)
      onRefresh()
    } catch (err) { setFormError(err.message || 'Failed to create member.') }
    finally { setCreating(false) }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setDeleting(true); setDeleteError('')
    try {
      await api.deleteUser(userToDelete.id)
      setDeleteOpen(false); setUserToDelete(null); onRefresh()
    } catch (err) { setDeleteError(err.message || 'Failed to delete.') }
    finally { setDeleting(false) }
  }

  const openAdd = () => {
    setOpen(true); setTempPassword(''); setFormError('')
    setName(''); setEmail(''); setRole('COLLABORATOR')
  }

  return (
    <>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: THEME.colors.textMain }}>Team Members</Typography>
          <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
            Manage your organization's team and roles
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ backgroundColor: THEME.colors.sidebarBg, textTransform: 'none', borderRadius: 2.5, fontWeight: 700, px: 3, py: 1.2, flexShrink: 0, '&:hover': { backgroundColor: '#13463f' } }}
        >
          Add Collaborator
        </Button>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3.5, flexWrap: 'wrap' }}>
        <StatCard Icon={PeopleIcon}             label="Total Members"    value={users.length}    color="#1b5e55" />
        <StatCard Icon={WorkIcon}               label="Project Managers" value={pms.length}      color="#eb5e43" />
        <StatCard Icon={PersonIcon}             label="Collaborators"    value={collabs.length}  color="#8890d3" />
        <StatCard Icon={CheckCircleOutlineIcon} label="Active"           value={active.length}   color="#16a34a" />
        <StatCard Icon={HighlightOffIcon}       label="Inactive"         value={inactive.length} color="#ef4444" />
      </Box>

      {/* Table with Role Filter Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(27,94,85,0.10)', overflow: 'hidden' }}>
        <Tabs
          value={tab} onChange={(_, v) => setTab(v)}
          sx={{
            px: 2, pt: 0.5,
            borderBottom: '1px solid rgba(27,94,85,0.08)',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 46 },
            '& .Mui-selected': { color: THEME.colors.sidebarBg },
            '& .MuiTabs-indicator': { backgroundColor: THEME.colors.sidebarBg, height: 3, borderRadius: 2 }
          }}
        >
          <Tab label={`All  (${users.length})`}              value="ALL" />
          <Tab label={`Admins  (${admins.length})`}          value="ADMIN" />
          <Tab label={`Project Managers  (${pms.length})`}   value="PROJECT_MANAGER" />
          <Tab label={`Collaborators  (${collabs.length})`}  value="COLLABORATOR" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TH>Member</TH>
                <TH width={155}>Role</TH>
                <TH width={110}>Status</TH>
                <TH width={90}>Tasks</TH>
                <TH width={130}>Actions</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0
                ? <EmptyRow cols={5} message="No members in this category." />
                : filtered.map(user => (
                  <TableRow key={user.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><UserCell user={user} /></TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell><StatusBadge isActive={user.is_active} /></TableCell>
                    <TableCell><TaskCount count={taskCount(user.id)} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {currentUser?.id !== user.id && user.role !== 'ADMIN' && (
                          <ActionToggle user={user} onToggle={handleToggle} />
                        )}
                        {user.role === 'COLLABORATOR' && (
                          <ActionDelete onDelete={() => { setUserToDelete(user); setDeleteError(''); setDeleteOpen(true) }} />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1, maxWidth: 400, width: '100%' } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#ef4444' }}>Delete Collaborator</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>{deleteError}</Alert>}
          <DialogContentText sx={{ color: THEME.colors.textMain }}>
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
            Their task assignments will be cleared. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}
            sx={{ textTransform: 'none', color: THEME.colors.textMuted }}>Cancel</Button>
          <Button onClick={handleDelete} disabled={deleting} variant="contained"
            sx={{ backgroundColor: '#ef4444', borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: '#dc2626' } }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Member Dialog ── */}
      <Dialog open={open} onClose={() => !creating && setOpen(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1, maxWidth: 450, width: '100%' } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Add Team Member</DialogTitle>
        <DialogContent>
          {tempPassword ? (
            <Box sx={{ mt: 1 }}>
              <Alert severity="success" sx={{ borderRadius: 2.5, mb: 2 }}>Member created successfully!</Alert>
              <Typography variant="body2" sx={{ color: THEME.colors.textMain, mb: 2 }}>
                Share this temporary password with the new member:
              </Typography>
              <Box sx={{
                p: 2, backgroundColor: 'rgba(27,94,85,0.06)',
                border: '1px dashed rgba(27,94,85,0.3)', borderRadius: 2,
                fontFamily: 'monospace', fontSize: 20, textAlign: 'center',
                fontWeight: 'bold', color: THEME.colors.sidebarBg, letterSpacing: 2
              }}>
                {tempPassword}
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 2.5, mt: 0.5 }}>
                Enter the details of the new team member. They will receive a temporary password.
              </Typography>
              {formError && <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>{formError}</Alert>}
              <TextField autoFocus margin="dense" label="Full Name" type="text" fullWidth variant="outlined"
                value={name} onChange={e => setName(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
              <TextField margin="dense" label="Email Address" type="email" fullWidth variant="outlined"
                value={email} onChange={e => setEmail(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
              <FormControl fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                <InputLabel>Role</InputLabel>
                <Select value={role} onChange={e => setRole(e.target.value)} label="Role">
                  <MenuItem value="COLLABORATOR">Collaborator</MenuItem>
                  <MenuItem value="PROJECT_MANAGER">Project Manager</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {tempPassword ? (
            <Button onClick={() => setOpen(false)} variant="contained"
              sx={{ backgroundColor: THEME.colors.sidebarBg, borderRadius: 2.5, textTransform: 'none', '&:hover': { backgroundColor: '#13463f' } }}>
              Close
            </Button>
          ) : (
            <>
              <Button onClick={() => setOpen(false)} disabled={creating}
                sx={{ textTransform: 'none', color: THEME.colors.textMuted }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating} variant="contained"
                sx={{ backgroundColor: THEME.colors.sidebarBg, borderRadius: 2.5, textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: '#13463f' } }}>
                {creating ? 'Creating…' : 'Create Member'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}

// ── PROJECT MANAGER VIEW ──────────────────────────────────────────────────────
function ProjectManagerView({ users, tasks, projects, currentUser, onRefresh }) {
  // Projects I manage
  const myProjects = projects.filter(p => p.manager_id === currentUser.id)

  // All member IDs from my projects
  const myMemberIdSet = new Set()
  myProjects.forEach(p => p.members?.forEach(m => myMemberIdSet.add(m.user_id)))

  // Other PMs who share a project with any of my collaborators
  const sharedPMIds = new Set()
  projects.forEach(p => {
    const hasMyCollab = p.members?.some(m => myMemberIdSet.has(m.user_id))
    if (hasMyCollab && p.manager_id !== currentUser.id) sharedPMIds.add(p.manager_id)
  })

  // Build full team list (my project members + shared PMs, excluding self)
  const teamIds = new Set([...myMemberIdSet, ...sharedPMIds])
  const teamUsers = users.filter(u => teamIds.has(u.id) && u.id !== currentUser.id)

  // Which of my projects does this person appear in?
  const getSharedProjectNames = (userId) =>
    myProjects
      .filter(p => p.members?.some(m => m.user_id === userId) || p.manager_id === userId)
      .map(p => p.name)

  const taskCount = (id) => tasks.filter(t => t.assigned_to === id).length
  const myCollabs = teamUsers.filter(u => u.role === 'COLLABORATOR').length
  const teamTaskTotal = teamUsers.reduce((s, u) => s + taskCount(u.id), 0)

  const handleToggle = async (user) => {
    try { await api.toggleUserStatus(user.id, !user.is_active); onRefresh() }
    catch (err) { alert(err.message) }
  }

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: THEME.colors.textMain }}>My Team</Typography>
        <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
          People you work with across your projects
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3.5, flexWrap: 'wrap' }}>
        <StatCard Icon={PeopleIcon}    label="My Collaborators" value={myCollabs}          color="#8890d3" />
        <StatCard Icon={WorkIcon}      label="My Projects"      value={myProjects.length}  color="#eb5e43" />
        <StatCard Icon={AssignmentIcon} label="Team Tasks"      value={teamTaskTotal}      color="#1b5e55" />
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(27,94,85,0.10)', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(27,94,85,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: THEME.colors.textMuted }}>
            {teamUsers.length} {teamUsers.length === 1 ? 'person' : 'people'} across {myProjects.length} {myProjects.length === 1 ? 'project' : 'projects'}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TH>Member</TH>
                <TH width={155}>Role</TH>
                <TH>Projects in Common</TH>
                <TH width={90}>Tasks</TH>
                <TH width={100}>Actions</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamUsers.length === 0
                ? <EmptyRow cols={5} message="No team members yet. Add collaborators to your projects to see them here." />
                : teamUsers.map(user => (
                  <TableRow key={user.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><UserCell user={user} /></TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell><ProjectChips names={getSharedProjectNames(user.id)} /></TableCell>
                    <TableCell><TaskCount count={taskCount(user.id)} /></TableCell>
                    <TableCell>
                      {user.role === 'COLLABORATOR' && (
                        <ActionToggle user={user} onToggle={handleToggle} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  )
}

// ── COLLABORATOR VIEW ─────────────────────────────────────────────────────────
function CollaboratorView({ users, tasks, projects, currentUser }) {
  // Projects I belong to (server already filters these for collaborator role)
  const myProjects = projects.filter(p =>
    p.members?.some(m => m.user_id === currentUser.id)
  )

  // All people in my projects (excluding self)
  const teammateIdSet = new Set()
  myProjects.forEach(p => {
    if (p.manager_id) teammateIdSet.add(p.manager_id)
    p.members?.forEach(m => { if (m.user_id !== currentUser.id) teammateIdSet.add(m.user_id) })
  })

  const teammates = users.filter(u => teammateIdSet.has(u.id))

  // Which of my projects does this person appear in?
  const getSharedProjectNames = (userId) =>
    myProjects
      .filter(p => p.members?.some(m => m.user_id === userId) || p.manager_id === userId)
      .map(p => p.name)

  const myTaskCount = tasks.filter(t => t.assigned_to === currentUser.id).length

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: THEME.colors.textMain }}>My Teammates</Typography>
        <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
          People on your shared projects — read-only directory
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3.5, flexWrap: 'wrap' }}>
        <StatCard Icon={PeopleIcon}     label="My Teammates"   value={teammates.length}  color="#8890d3" />
        <StatCard Icon={WorkIcon}       label="Projects I'm In" value={myProjects.length} color="#eb5e43" />
        <StatCard Icon={AssignmentIcon} label="My Tasks"        value={myTaskCount}       color="#1b5e55" />
      </Box>

      {/* Read-only Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(27,94,85,0.10)', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(27,94,85,0.08)' }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: THEME.colors.textMuted }}>
            {teammates.length} {teammates.length === 1 ? 'person' : 'people'} in {myProjects.length} {myProjects.length === 1 ? 'project' : 'projects'}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TH>Member</TH>
                <TH width={155}>Role</TH>
                <TH>Projects in Common</TH>
                <TH width={90}>Tasks</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {teammates.length === 0
                ? <EmptyRow cols={4} message="You haven't been added to any projects yet." />
                : teammates.map(user => (
                  <TableRow key={user.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><UserCell user={user} /></TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell><ProjectChips names={getSharedProjectNames(user.id)} /></TableCell>
                    <TableCell>
                      <TaskCount count={tasks.filter(t => t.assigned_to === user.id).length} />
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers]       = useState([])
  const [tasks, setTasks]       = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null

  const loadData = async () => {
    try {
      const [u, t, p] = await Promise.all([api.getUsers(), api.getTasks(), api.getProjects()])
      setUsers(u)
      setTasks(t)
      setProjects(p)
    } catch (err) {
      console.error('UsersPage load error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: THEME.colors.textMuted, textAlign: 'center', py: 8 }}>
              Loading team data…
            </Typography>
          </Box>
        ) : (
          <>
            {currentUser?.role === 'ADMIN' && (
              <AdminView
                users={users} tasks={tasks}
                currentUser={currentUser} onRefresh={loadData}
              />
            )}
            {currentUser?.role === 'PROJECT_MANAGER' && (
              <ProjectManagerView
                users={users} tasks={tasks} projects={projects}
                currentUser={currentUser} onRefresh={loadData}
              />
            )}
            {currentUser?.role === 'COLLABORATOR' && (
              <CollaboratorView
                users={users} tasks={tasks} projects={projects}
                currentUser={currentUser}
              />
            )}
          </>
        )}
      </Box>
    </Layout>
  )
}

export default UsersPage