import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import {
  Box, Typography, Paper, Avatar, Chip,
  Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, Alert,
  IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
  Divider, CircularProgress, List, ListItem, ListItemText,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import ToggleOnIcon from "@mui/icons-material/ToggleOn"
import ToggleOffIcon from "@mui/icons-material/ToggleOff"
import AssignmentIcon from "@mui/icons-material/Assignment"
import FolderIcon from "@mui/icons-material/Folder"
import CommentIcon from "@mui/icons-material/Comment"
import CloseIcon from "@mui/icons-material/Close"
import { api } from "../services/api"
import { THEME } from "../theme"

const roleColors = {
  ADMIN: "#1b5e55",
  PROJECT_MANAGER: "#eb5e43",
  COLLABORATOR: "#8890d3",
}

const mapRoleToUI = (role) => {
  if (role === "ADMIN") return "Administrator"
  if (role === "PROJECT_MANAGER") return "Project Manager"
  if (role === "COLLABORATOR") return "Collaborator"
  return role
}

const mapStatusToUI = (status) => {
  if (status === "TODO") return "To Do"
  if (status === "IN_PROGRESS") return "In Progress"
  if (status === "COMPLETED") return "Completed"
  return status
}

const statusColors = {
  TODO: "#627575",
  IN_PROGRESS: "#8890d3",
  COMPLETED: "#1b5e55",
}

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("COLLABORATOR")
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)
  const [tempPassword, setTempPassword] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  const [statsUser, setStatsUser] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsTab, setStatsTab] = useState("tasks")

  const userStr = localStorage.getItem("user")
  const currentUser = userStr ? JSON.parse(userStr) : null
  const isAdmin = currentUser?.role === "ADMIN"
  const isManager = currentUser?.role === "PROJECT_MANAGER"

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedUsers = await api.getUsers()
        setUsers(fetchedUsers)
      } catch (err) {
        console.error("Failed to load users:", err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleCreate = async () => {
    if (!name || !email) { setError("Please fill in all fields"); return }
    if (!email.includes("@")) { setError("Please enter a valid email address"); return }
    setError(""); setCreating(true)
    try {
      const res = await api.createUser({ name, email, role })
      setTempPassword(res.tempPassword)
      setUsers(await api.getUsers())
    } catch (err) {
      setError(err.message || "Failed to create collaborator.")
    } finally { setCreating(false) }
  }

  const handleToggleStatus = async (e, u) => {
    e.stopPropagation()
    try {
      await api.toggleUserStatus(u.id, !u.is_active)
      setUsers(await api.getUsers())
    } catch (err) { alert(err.message || "Failed to update status.") }
  }

  const openDeleteDialog = (e, u) => {
    e.stopPropagation()
    setUserToDelete(u); setDeleteError(""); setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setDeleting(true); setDeleteError("")
    try {
      await api.deleteUser(userToDelete.id)
      setDeleteDialogOpen(false); setUserToDelete(null)
      setUsers(await api.getUsers())
    } catch (err) {
      setDeleteError(err.message || "Failed to delete user.")
    } finally { setDeleting(false) }
  }

  const handleRoleChange = async (e, u) => {
    e.stopPropagation()
    try {
      await api.updateUserRole(u.id, e.target.value)
      setUsers(await api.getUsers())
    } catch (err) { alert(err.message || "Failed to update role.") }
  }

  const openStatsDialog = async (e, user, tab) => {
    e.stopPropagation()
    setStatsUser(user); setStatsTab(tab); setStatsDialogOpen(true)
    setStatsData(null); setStatsLoading(true)
    try {
      setStatsData(await api.getUserStats(user.id))
    } catch (err) {
      setStatsData({ error: err.message || "Failed to load stats." })
    } finally { setStatsLoading(false) }
  }

  const canManageUser = (u) => {
    if (currentUser?.id === u.id) return false
    if (isAdmin && u.role !== "ADMIN") return true
    if (isManager && u.role === "COLLABORATOR") return true
    return false
  }

  const canDeleteUser = (u) =>
    isAdmin && currentUser?.id !== u.id && u.role !== "ADMIN"

  const renderRoleCell = (user) => {
    const color = roleColors[user.role] || THEME.colors.sidebarBg
    if (isAdmin && currentUser?.id !== user.id) {
      return (
        <Select size="small" value={user.role} onChange={(e) => handleRoleChange(e, user)} onClick={(e) => e.stopPropagation()}
          sx={{ fontSize: "0.8rem", height: 30, color: color, fontWeight: 600, borderRadius: 1.5,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.12)" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: color } }}>
          <MenuItem value="COLLABORATOR" sx={{ fontSize: "0.8rem" }}>Collaborator</MenuItem>
          <MenuItem value="PROJECT_MANAGER" sx={{ fontSize: "0.8rem" }}>Project Manager</MenuItem>
          <MenuItem value="ADMIN" sx={{ fontSize: "0.8rem" }}>Administrator</MenuItem>
        </Select>
      )
    }
    return (
      <Chip label={mapRoleToUI(user.role)} size="small" sx={{
        backgroundColor: `${color}15`,
        color: color,
        fontWeight: 700, fontSize: 11,
        border: `1px solid ${color}30`
      }} />
    )
  }

  const tabs = [
    { key: "tasks", label: "Assigned Tasks", icon: <AssignmentIcon sx={{ fontSize: 14 }} />, color: "#8890d3" },
    { key: "projects", label: "Projects", icon: <FolderIcon sx={{ fontSize: 14 }} />, color: THEME.colors.sidebarBg },
    { key: "comments", label: "Comments", icon: <CommentIcon sx={{ fontSize: 14 }} />, color: "#eb5e43" },
  ]

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: "100vh" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>Team Members</Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>Manage your team, roles, and activity</Typography>
          </Box>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => { setOpen(true); setTempPassword(""); setError(""); setName(""); setEmail(""); setRole("COLLABORATOR") }}
              sx={{ backgroundColor: THEME.colors.sidebarBg, textTransform: "none", borderRadius: 2.5, fontWeight: "bold", px: 3, py: 1.2, "&:hover": { backgroundColor: "#13463f" } }}>
              Add Collaborator
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: THEME.colors.sidebarBg }} />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{
            borderRadius: 3.5,
            border: "1px solid rgba(27,94,85,0.08)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            overflow: "hidden",
            backgroundColor: "#ffffff"
          }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: "rgba(27,94,85,0.03)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", color: THEME.colors.textMain }}>User Details</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: THEME.colors.textMain }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: THEME.colors.textMain }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: THEME.colors.textMain, textAlign: "center" }}>Assigned Projects</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: THEME.colors.textMain, textAlign: "center" }}>Assigned Tasks</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: THEME.colors.textMain }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const isActive = user.is_active !== false
                  const roleColor = roleColors[user.role] || THEME.colors.sidebarBg

                  return (
                    <TableRow key={user.id} hover sx={{
                      opacity: isActive ? 1 : 0.78,
                      backgroundColor: isActive ? "inherit" : "rgba(0,0,0,0.015)",
                      "&:hover": { backgroundColor: "rgba(27,94,85,0.02) !important" }
                    }}>
                      {/* User details */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{
                            width: 38,
                            height: 38,
                            fontSize: 15,
                            fontWeight: "bold",
                            background: isActive ? roleColor : "#bbb",
                            color: "white"
                          }}>
                            {user.name ? user.name[0].toUpperCase() : "U"}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: THEME.colors.textMain }} noWrap>
                              {user.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: THEME.colors.textMuted }} noWrap>
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {renderRoleCell(user)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            backgroundColor: isActive ? "rgba(46,125,50,0.08)" : "rgba(211,47,47,0.08)",
                            color: isActive ? "#2e7d32" : "#d32f2f",
                            fontWeight: 700,
                            fontSize: 11,
                            border: isActive ? "1px solid rgba(46,125,50,0.15)" : "1px solid rgba(211,47,47,0.15)"
                          }}
                        />
                      </TableCell>

                      {/* Assigned Projects count */}
                      <TableCell align="center">
                        <Tooltip title="Click to view assigned projects">
                          <Chip
                            label={`${user._count?.project_memberships || 0} Projects`}
                            onClick={(e) => openStatsDialog(e, user, "projects")}
                            size="small"
                            icon={<FolderIcon sx={{ fontSize: 13, color: `${THEME.colors.sidebarBg} !important` }} />}
                            sx={{
                              cursor: "pointer",
                              backgroundColor: "rgba(27,94,85,0.05)",
                              color: THEME.colors.sidebarBg,
                              fontWeight: 700,
                              fontSize: 11,
                              border: "1px solid rgba(27,94,85,0.15)",
                              transition: "all 0.2s",
                              "&:hover": {
                                backgroundColor: "rgba(27,94,85,0.12)",
                                transform: "translateY(-1px)"
                              }
                            }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Assigned Tasks count */}
                      <TableCell align="center">
                        <Tooltip title="Click to view assigned tasks">
                          <Chip
                            label={`${user._count?.tasks_assigned || 0} Tasks`}
                            onClick={(e) => openStatsDialog(e, user, "tasks")}
                            size="small"
                            icon={<AssignmentIcon sx={{ fontSize: 13, color: "#8890d3 !important" }} />}
                            sx={{
                              cursor: "pointer",
                              backgroundColor: "rgba(136,144,211,0.08)",
                              color: "#8890d3",
                              fontWeight: 700,
                              fontSize: 11,
                              border: "1px solid rgba(136,144,211,0.2)",
                              transition: "all 0.2s",
                              "&:hover": {
                                backgroundColor: "rgba(136,144,211,0.15)",
                                transform: "translateY(-1px)"
                              }
                            }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {canManageUser(user) && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={(e) => handleToggleStatus(e, user)}
                              sx={{
                                textTransform: "none",
                                fontWeight: "bold",
                                borderRadius: 1.5,
                                px: 2,
                                py: 0.6,
                                fontSize: "0.75rem",
                                backgroundColor: isActive ? "#ef4444" : "#22c55e", // red for active (deactivate option), green for inactive (activate option)
                                color: "#ffffff",
                                "&:hover": {
                                  backgroundColor: isActive ? "#dc2626" : "#16a34a"
                                }
                              }}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                          {canDeleteUser(user) && (
                            <Tooltip title="Delete user">
                              <IconButton
                                size="small"
                                onClick={(e) => openDeleteDialog(e, user)}
                                sx={{
                                  color: "#ef4444",
                                  backgroundColor: "rgba(239,68,68,0.06)",
                                  "&:hover": { backgroundColor: "rgba(239,68,68,0.15)" },
                                  borderRadius: 1.5,
                                  p: 0.8
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!canManageUser(user) && !canDeleteUser(user) && (
                            <Typography variant="caption" sx={{ color: THEME.colors.textMuted, fontStyle: "italic" }}>
                              No actions
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onClose={() => setStatsDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 0, maxWidth: 520, width: "100%", overflow: "hidden" } }}>
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1.5, pt: 2.5, px: 3, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 38, height: 38, fontSize: 15, fontWeight: "bold", background: statsUser ? (roleColors[statsUser.role] || THEME.colors.sidebarBg) : THEME.colors.sidebarBg, color: "white" }}>
              {statsUser?.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <Box>
              <Typography fontWeight="bold" sx={{ color: THEME.colors.textMain, lineHeight: 1.3 }}>{statsUser?.name}</Typography>
              <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}>{mapRoleToUI(statsUser?.role || "")}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setStatsDialogOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>

        <Box sx={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          {tabs.map(tab => (
            <Box key={tab.key} onClick={() => setStatsTab(tab.key)}
              sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, py: 1.4, cursor: "pointer",
                fontWeight: 700, fontSize: 12, color: statsTab === tab.key ? tab.color : THEME.colors.textMuted,
                borderBottom: statsTab === tab.key ? `2.5px solid ${tab.color}` : "2.5px solid transparent",
                transition: "all 0.15s", "&:hover": { backgroundColor: "rgba(0,0,0,0.02)" } }}>
              {tab.icon}{tab.label}
            </Box>
          ))}
        </Box>

        <DialogContent sx={{ p: 0, minHeight: 200, maxHeight: 380, overflowY: "auto" }}>
          {statsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 7 }}>
              <CircularProgress size={30} sx={{ color: THEME.colors.sidebarBg }} />
            </Box>
          ) : statsData?.error ? (
            <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>{statsData.error}</Alert>
          ) : statsData ? (
            <>
              {statsTab === "tasks" && (
                statsData.tasks?.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <AssignmentIcon sx={{ color: "rgba(0,0,0,0.1)", fontSize: 44, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: THEME.colors.textMuted }}>No tasks assigned</Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {statsData.tasks.map((task, i) => (
                      <ListItem key={task.id} divider={i < statsData.tasks.length - 1} sx={{ px: 3, py: 1.5 }}>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600} sx={{ color: THEME.colors.textMain }}>{task.title}</Typography>}
                          secondary={
                            <Box sx={{ display: "flex", gap: 1, mt: 0.5, alignItems: "center" }}>
                              <Chip label={mapStatusToUI(task.status)} size="small" sx={{
                                fontSize: 10, height: 20,
                                backgroundColor: `${statusColors[task.status]}18`,
                                color: statusColors[task.status], fontWeight: 700 }} />
                              {task.due_date && <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}>Due {new Date(task.due_date).toLocaleDateString()}</Typography>}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )
              )}

              {statsTab === "projects" && (
                statsData.projects?.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <FolderIcon sx={{ color: "rgba(0,0,0,0.1)", fontSize: 44, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: THEME.colors.textMuted }}>Not in any projects</Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {statsData.projects.map((proj, i) => (
                      <ListItem key={proj.id} divider={i < statsData.projects.length - 1} sx={{ px: 3, py: 1.5 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: 1.5, backgroundColor: "rgba(27,94,85,0.08)", display: "flex", alignItems: "center", justifyContent: "center", mr: 2, flexShrink: 0 }}>
                          <FolderIcon sx={{ fontSize: 17, color: THEME.colors.sidebarBg }} />
                        </Box>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600} sx={{ color: THEME.colors.textMain }}>{proj.name}</Typography>}
                          secondary={proj.description && <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}>{proj.description}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                )
              )}

              {statsTab === "comments" && (
                statsData.comments?.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <CommentIcon sx={{ color: "rgba(0,0,0,0.1)", fontSize: 44, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: THEME.colors.textMuted }}>No comments yet</Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {statsData.comments.map((comment, i) => (
                      <ListItem key={comment.id} divider={i < statsData.comments.length - 1} sx={{ px: 3, py: 1.5, flexDirection: "column", alignItems: "flex-start" }}>
                        <Typography variant="caption" sx={{ color: THEME.colors.textMuted, mb: 0.5 }}>
                          On: <strong style={{ color: THEME.colors.sidebarBg }}>{comment.task?.title || "—"}</strong>
                        </Typography>
                        <Box sx={{ backgroundColor: "rgba(0,0,0,0.03)", borderRadius: 1.5, px: 1.5, py: 1, width: "100%" }}>
                          <Typography variant="body2" sx={{ color: THEME.colors.textMain }}>{comment.message}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>{new Date(comment.created_at).toLocaleString()}</Typography>
                      </ListItem>
                    ))}
                  </List>
                )
              )}
            </>
          ) : null}
        </DialogContent>

        {statsData && !statsData.error && (
          <Box sx={{ display: "flex", gap: 3, px: 3, py: 1.5, borderTop: "1px solid rgba(0,0,0,0.06)", backgroundColor: "rgba(0,0,0,0.015)" }}>
            <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}><strong style={{ color: "#8890d3" }}>{statsData.tasks?.length || 0}</strong> tasks</Typography>
            <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}><strong style={{ color: THEME.colors.sidebarBg }}>{statsData.projects?.length || 0}</strong> projects</Typography>
            <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}><strong style={{ color: "#eb5e43" }}>{statsData.comments?.length || 0}</strong> comments</Typography>
          </Box>
        )}
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1, maxWidth: 400, width: "100%" } }}>
        <DialogTitle sx={{ fontWeight: "bold", color: "#ef4444" }}>Delete User</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>{deleteError}</Alert>}
          <DialogContentText sx={{ color: THEME.colors.textMain }}>
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>? Task assignments will be cleared. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ textTransform: "none", color: THEME.colors.textMuted }}>Cancel</Button>
          <Button onClick={handleDelete} disabled={deleting} variant="contained"
            sx={{ backgroundColor: "#ef4444", borderRadius: 2.5, textTransform: "none", fontWeight: "bold", "&:hover": { backgroundColor: "#dc2626" } }}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Collaborator Dialog */}
      <Dialog open={open} onClose={() => !creating && setOpen(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1, maxWidth: 450, width: "100%" } }}>
        <DialogTitle sx={{ fontWeight: "bold", color: THEME.colors.textMain }}>Add Team Member</DialogTitle>
        <DialogContent>
          {tempPassword ? (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Alert severity="success" sx={{ borderRadius: 2.5, mb: 2 }}>Collaborator created successfully!</Alert>
              <Typography variant="body2" sx={{ color: THEME.colors.textMain, mb: 2 }}>Share this temporary password:</Typography>
              <Box sx={{ p: 2, backgroundColor: "rgba(27,94,85,0.06)", border: "1px dashed rgba(27,94,85,0.3)", borderRadius: 2, fontFamily: "monospace", fontSize: 18, textAlign: "center", fontWeight: "bold", color: THEME.colors.sidebarBg, letterSpacing: 1 }}>
                {tempPassword}
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 3 }}>Enter the name and email. A temporary password will be generated.</Typography>
              {error && <Alert severity="error" sx={{ borderRadius: 2.5, mb: 2 }}>{error}</Alert>}
              <TextField autoFocus margin="dense" label="Full Name" type="text" fullWidth variant="outlined" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              <TextField margin="dense" label="Email Address" type="email" fullWidth variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              <FormControl fullWidth variant="outlined" sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select labelId="role-select-label" value={role} onChange={(e) => setRole(e.target.value)} label="Role">
                  <MenuItem value="COLLABORATOR">Collaborator</MenuItem>
                  <MenuItem value="PROJECT_MANAGER">Project Manager</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {tempPassword ? (
            <Button onClick={() => setOpen(false)} variant="contained" sx={{ backgroundColor: THEME.colors.sidebarBg, borderRadius: 2.5, textTransform: "none", "&:hover": { backgroundColor: "#13463f" } }}>Close</Button>
          ) : (
            <>
              <Button onClick={() => setOpen(false)} disabled={creating} sx={{ textTransform: "none", color: THEME.colors.textMuted }}>Cancel</Button>
              <Button onClick={handleCreate} variant="contained" disabled={creating} sx={{ backgroundColor: THEME.colors.sidebarBg, borderRadius: 2.5, textTransform: "none", "&:hover": { backgroundColor: "#13463f" } }}>
                {creating ? "Creating..." : "Create Member"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default UsersPage
