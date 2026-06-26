import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { 
  Box, Typography, Paper, Avatar, Chip, 
  Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Grid, MenuItem, 
  Select, FormControl, InputLabel, OutlinedInput, 
  Checkbox, ListItemText, Card, CardContent, CardActions,
  IconButton
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import GroupIcon from '@mui/icons-material/Group'
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

function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Modal states
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  
  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [managerId, setManagerId] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null
  const isAdmin = currentUser?.role === 'ADMIN'
  const isProjectManager = currentUser?.role === 'PROJECT_MANAGER'
  const canManageProjects = isAdmin || isProjectManager

  const loadData = async () => {
    try {
      const fetchedProjects = await api.getProjects()
      const fetchedUsers = await api.getUsers()
      setProjects(fetchedProjects)
      setUsers(fetchedUsers)
    } catch (err) {
      console.error('Failed to load projects page data:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const projectManagers = users.filter(u => u.role === 'PROJECT_MANAGER')
  const collaborators = users.filter(u => u.role === 'COLLABORATOR')

  const handleOpenCreate = () => {
    setEditMode(false)
    setName('')
    setDescription('')
    setManagerId('')
    setSelectedMembers([])
    setError('')
    setOpen(true)
  }

  const handleOpenEdit = (project) => {
    setEditMode(true)
    setSelectedProjectId(project.id)
    setName(project.name)
    setDescription(project.description || '')
    setManagerId(project.manager_id)
    setSelectedMembers(project.members ? project.members.map(m => m.user_id) : [])
    setError('')
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!name || !managerId) {
      setError('Project Name and Manager are required.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        name,
        description,
        manager_id: parseInt(managerId),
        member_ids: selectedMembers
      }

      if (editMode) {
        await api.updateProject(selectedProjectId, payload)
      } else {
        await api.createProject(payload)
      }
      setOpen(false)
      loadData()
    } catch (err) {
      setError(err.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? This will delete all tasks inside it.')) {
      return
    }
    try {
      await api.deleteProject(id)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to delete project.')
    }
  }

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>
        
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
              Projects
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
              Assign, manage, and track projects across teams
            </Typography>
          </Box>
          {canManageProjects && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                backgroundColor: THEME.colors.greenAccent,
                color: 'white',
                px: 3,
                py: 1.2,
                borderRadius: 2.5,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(27, 94, 85, 0.25)',
                '&:hover': {
                  backgroundColor: '#14463f',
                }
              }}
            >
              New Project
            </Button>
          )}
        </Box>

        {loading ? (
          <Typography sx={{ color: THEME.colors.textMuted }}>Loading projects...</Typography>
        ) : projects.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, backgroundColor: THEME.colors.cardBg }}>
            <Typography variant="h6" sx={{ color: THEME.colors.textMain, mb: 1 }}>No Projects Found</Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 3 }}>
              {canManageProjects ? 'Get started by creating your first project.' : 'You are not assigned to any projects yet.'}
            </Typography>
            {canManageProjects && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{
                  color: THEME.colors.greenAccent,
                  borderColor: THEME.colors.greenAccent,
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#14463f',
                    backgroundColor: 'rgba(27, 94, 85, 0.04)'
                  }
                }}
              >
                Create Project
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card sx={{ 
                  borderRadius: 3, 
                  backgroundColor: THEME.colors.cardBg, 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  border: '1px solid rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
                        {project.name}
                      </Typography>
                      {canManageProjects && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleOpenEdit(project)} sx={{ color: THEME.colors.textMuted }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(project.id)} sx={{ color: THEME.colors.orangeAccent }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 3, minHeight: '40px' }}>
                      {project.description || 'No description provided.'}
                    </Typography>

                    {/* Manager Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 'bold', background: THEME.colors.greenAccent }}>
                        {project.manager?.name ? project.manager.name.charAt(0).toUpperCase() : 'M'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: THEME.colors.textMain, fontSize: 13 }}>
                          {project.manager?.name || 'Unassigned'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}>
                          Project Manager
                        </Typography>
                      </Box>
                    </Box>

                    {/* Member Avatars & Count */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <GroupIcon sx={{ color: THEME.colors.textMuted, fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: THEME.colors.textMuted, fontSize: 13 }}>
                        {project.members ? project.members.length : 0} Collaborator(s)
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 1, borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Chip 
                        label={`${project._count?.tasks || 0} Tasks`} 
                        size="small"
                        sx={{ 
                          backgroundColor: THEME.colors.scheduleBg, 
                          color: THEME.colors.greenAccent,
                          fontWeight: 600
                        }} 
                      />
                      <Button
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/taskboard?projectId=${project.id}`)}
                        sx={{ 
                          textTransform: 'none', 
                          fontWeight: 600, 
                          color: THEME.colors.greenAccent 
                        }}
                      >
                        View Tasks
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Dialog for Create / Edit Project */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3.5,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(27,94,85,0.08)',
              boxShadow: '0 20px 60px rgba(27,94,85,0.12)',
              overflow: 'hidden',
            }
          }}
        >
          {/* Styled Header */}
          <Box sx={{
            px: 3, pt: 3, pb: 2,
            borderBottom: '1px solid rgba(27,94,85,0.06)',
            background: 'linear-gradient(135deg, rgba(27,94,85,0.04) 0%, rgba(27,94,85,0.01) 100%)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2,
                backgroundColor: THEME.colors.sidebarBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Typography sx={{ fontSize: 18 }}>{editMode ? '✏️' : '📁'}</Typography>
              </Box>
              <Box>
                <Typography fontWeight={700} sx={{ color: THEME.colors.textMain, fontSize: 18, lineHeight: 1.2 }}>
                  {editMode ? 'Edit Project' : 'Create New Project'}
                </Typography>
                <Typography sx={{ color: THEME.colors.textMuted, fontSize: 12, mt: 0.3 }}>
                  {editMode ? 'Update project details and team members' : 'Set up a new project and assign your team'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
            {error && (
              <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                <Typography sx={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>❌ {error}</Typography>
              </Box>
            )}

            <TextField
              label="Project Name *"
              fullWidth
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={fieldStyle}
              placeholder="e.g. Website Redesign"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={fieldStyle}
              placeholder="Briefly describe the project goals..."
            />

            <TextField
              fullWidth
              select
              label="Project Manager *"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              sx={fieldStyle}
              SelectProps={{ MenuProps: menuProps }}
            >
              <MenuItem value="" disabled>Select a Project Manager</MenuItem>
              {projectManagers.length === 0 ? (
                <MenuItem disabled>
                  <Typography sx={{ color: THEME.colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>
                    No Project Managers found. Add users with PM role first.
                  </Typography>
                </MenuItem>
              ) : (
                projectManagers.map(pm => (
                  <MenuItem key={pm.id} value={pm.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        backgroundColor: THEME.colors.sidebarBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
                          {pm.name.slice(0, 2).toUpperCase()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: THEME.colors.textMain }}>{pm.name}</Typography>
                        <Typography sx={{ fontSize: 11, color: THEME.colors.textMuted }}>{pm.email}</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              )}
            </TextField>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel
                id="collaborators-select-label"
                sx={{
                  color: THEME.colors.textMuted,
                  '&.Mui-focused': { color: THEME.colors.sidebarBg }
                }}
              >
                Collaborators
              </InputLabel>
              <Select
                labelId="collaborators-select-label"
                multiple
                value={selectedMembers}
                onChange={(e) => setSelectedMembers(e.target.value)}
                input={<OutlinedInput label="Collaborators" />}
                MenuProps={menuProps}
                renderValue={(selected) => {
                  const selectedUsers = collaborators.filter(u => selected.includes(u.id))
                  return selectedUsers.length === 0
                    ? 'None selected'
                    : selectedUsers.map(u => u.name).join(', ')
                }}
                sx={{
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(27,94,85,0.03)',
                  color: THEME.colors.textMain,
                  '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                  '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                  '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
                }}
              >
                {collaborators.length === 0 ? (
                  <MenuItem disabled>
                    <Typography sx={{ color: THEME.colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>
                      No collaborators found.
                    </Typography>
                  </MenuItem>
                ) : (
                  collaborators.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      <Checkbox
                        checked={selectedMembers.indexOf(c.id) > -1}
                        sx={{
                          color: 'rgba(27,94,85,0.3)',
                          '&.Mui-checked': { color: THEME.colors.sidebarBg }
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 0.5 }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '50%',
                          backgroundColor: 'rgba(27,94,85,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Typography sx={{ color: THEME.colors.sidebarBg, fontSize: 10, fontWeight: 700 }}>
                            {c.name.slice(0, 2).toUpperCase()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: THEME.colors.textMain }}>{c.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: THEME.colors.textMuted }}>{c.email}</Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions sx={{
            px: 3, pb: 3, pt: 1,
            gap: 1.5,
            borderTop: '1px solid rgba(27,94,85,0.06)',
          }}>
            <Button
              onClick={() => setOpen(false)}
              sx={{
                color: THEME.colors.textMuted,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2.5,
                px: 3,
                border: '1px solid rgba(27,94,85,0.12)',
                '&:hover': {
                  backgroundColor: 'rgba(27,94,85,0.04)',
                  borderColor: 'rgba(27,94,85,0.25)',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
              sx={{
                py: 1.2, px: 4,
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 2.5,
                textTransform: 'none',
                backgroundColor: THEME.colors.sidebarBg,
                boxShadow: '0 4px 14px rgba(27,94,85,0.25)',
                '&:hover': { backgroundColor: '#13463f', boxShadow: '0 6px 20px rgba(27,94,85,0.35)' },
                '&.Mui-disabled': { backgroundColor: 'rgba(27,94,85,0.3)', color: 'white' }
              }}
            >
              {submitting ? 'Saving...' : editMode ? '✓ Save Changes' : '+ Create Project'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Layout>
  )
}

export default ProjectsPage
