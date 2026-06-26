import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Chip, Avatar, Button, TextField, Divider, Modal, ToggleButton, ToggleButtonGroup, Select, MenuItem, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, FormControlLabel, Switch } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CommentIcon from '@mui/icons-material/Comment'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import DeleteIcon from '@mui/icons-material/Delete'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { api } from '../services/api'
import { THEME } from '../theme'

const columns = [
  { key: 'todo', label: 'To Do', color: '#627575', bg: 'rgba(98,117,117,0.1)', dbStatus: 'TODO' },
  { key: 'inProgress', label: 'In Progress', color: '#8890d3', bg: 'rgba(136,144,211,0.1)', dbStatus: 'IN_PROGRESS' },
  { key: 'completed', label: 'Completed', color: '#1b5e55', bg: 'rgba(27,94,85,0.1)', dbStatus: 'COMPLETED' },
]

const priorityColors = {
  High: { color: '#eb5e43', bg: 'rgba(235,94,67,0.12)' },
  Medium: { color: '#8890d3', bg: 'rgba(136,144,211,0.12)' },
  Low: { color: '#1b5e55', bg: 'rgba(27,94,85,0.12)' },
}

const assigneeShades = [
  '#f0f7f6',
  '#e2efed',
  '#d4e7e4',
  '#c6dfdc',
  '#b8d7d3',
  '#aacceb',
];

const getAssigneeColor = (name) => {
  if (!name || name === 'Unassigned') return '#ffffff';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % assigneeShades.length;
  return assigneeShades[index];
};

const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };

const mapPriorityToUI = (priority) => {
  if (priority === 'HIGH') return 'High';
  if (priority === 'MEDIUM') return 'Medium';
  if (priority === 'LOW') return 'Low';
  return priority;
};

const mapStatusToColKey = (status) => {
  if (status === 'TODO') return 'todo';
  if (status === 'IN_PROGRESS') return 'inProgress';
  if (status === 'COMPLETED') return 'completed';
  return 'todo';
};

const mapColKeyToStatus = (colKey) => {
  if (colKey === 'todo') return 'TODO';
  if (colKey === 'inProgress') return 'IN_PROGRESS';
  if (colKey === 'completed') return 'COMPLETED';
  return 'TODO';
};

function TaskBoardPage() {
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], completed: [] })
  const [selectedTask, setSelectedTask] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [viewMode, setViewMode] = useState('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    loadTasks();
  }, [])

  const loadTasks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const projectId = queryParams.get('projectId');
      const filters = {};
      if (projectId) {
        filters.projectId = projectId;
      }
      
      const fetchedTasks = await api.getTasks(filters);
      const categorized = { todo: [], inProgress: [], completed: [] };
      fetchedTasks.forEach(task => {
        const colKey = mapStatusToColKey(task.status);
        categorized[colKey].push(task);
      });
      Object.keys(categorized).forEach(key => {
        categorized[key].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
      });
      setTasks(categorized);
    } catch (error) {
      console.error('Failed to load tasks:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    const taskId = parseInt(draggableId);
    const fromColKey = source.droppableId;
    const toColKey = destination.droppableId;
    const newStatus = mapColKeyToStatus(toColKey);

    const sourceCol = [...tasks[fromColKey]]
    const destCol = [...tasks[toColKey]]

    const taskIndex = sourceCol.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const [moved] = sourceCol.splice(taskIndex, 1)
    moved.status = newStatus;
    
    destCol.push(moved);
    destCol.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    setTasks({
      ...tasks,
      [fromColKey]: sourceCol,
      [toColKey]: destCol,
    })

    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to persist task status update:', error.message);
      loadTasks();
    }
  }

  const openTask = async (task) => {
    setSelectedTask(task)
    setComments([])
    try {
      const fetchedComments = await api.getComments(task.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Failed to load comments:', error.message);
    }
  }

  const closeTask = () => {
    setSelectedTask(null)
    setComments([])
    setCommentText('')
  }

  const handlePostComment = async () => {
    if (!commentText.trim() || !selectedTask) return

    try {
      const newComment = await api.addComment(selectedTask.id, commentText);
      setComments([...comments, newComment]);
      setCommentText('');

      const colKey = mapStatusToColKey(selectedTask.status);
      const updatedColTasks = tasks[colKey].map(t => {
        if (t.id === selectedTask.id) {
          return {
            ...t,
            comments: [...(t.comments || []), newComment]
          };
        }
        return t;
      });
      setTasks({
        ...tasks,
        [colKey]: updatedColTasks
      });
    } catch (error) {
      console.error('Failed to post comment:', error.message);
    }
  }

  const getFilteredTasks = (taskList) => {
    let filtered = taskList.filter(task => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = task.title.toLowerCase().includes(query) || 
                            (task.description && task.description.toLowerCase().includes(query)) ||
                            (task.project?.name && task.project.name.toLowerCase().includes(query)) ||
                            (task.assignee?.name && task.assignee.name.toLowerCase().includes(query));
      const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
      const matchesMyTasks = !showMyTasksOnly || (task.assignee && task.assignee.id === currentUser?.id);
      return matchesSearch && matchesPriority && matchesMyTasks;
    });

    filtered.sort((a, b) => {
      if (currentUser?.role === 'COLLABORATOR') {
        const aIsMine = a.assignee?.id === currentUser.id ? 1 : 0;
        const bIsMine = b.assignee?.id === currentUser.id ? 1 : 0;
        if (aIsMine !== bIsMine) return bIsMine - aIsMine;
      }
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    return filtered;
  };

  const handleDeleteTask = async (e, taskId, colKey) => {
    e.stopPropagation(); // Prevent opening the task modal
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.deleteTask(taskId);
      // Update local state
      setTasks(prev => ({
        ...prev,
        [colKey]: prev[colKey].filter(t => t.id !== taskId)
      }));
    } catch (error) {
      console.error('Failed to delete task:', error.message);
      alert('Failed to delete task. You might not have permission.');
    }
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
              Task Board
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
              Drag and drop tasks • Click to view comments
            </Typography>
          </Box>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => {
              const queryParams = new URLSearchParams(window.location.search);
              const projectId = queryParams.get('projectId');
              navigate(projectId ? `/create-task?projectId=${projectId}` : '/create-task');
            }}
            sx={{
              backgroundColor: THEME.colors.darkBtnBg,
              color: 'white',
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: '#272936'
              }
            }}
          >
            Add Task
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search tasks..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: THEME.colors.textMuted }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200, backgroundColor: 'white', borderRadius: 1 }}
          />
          <Select
            size="small"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            sx={{ minWidth: 150, backgroundColor: 'white', borderRadius: 1 }}
          >
            <MenuItem value="ALL">All Priorities</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </Select>

          {currentUser?.role === 'COLLABORATOR' && (
            <FormControlLabel
              control={
                <Switch 
                  checked={showMyTasksOnly} 
                  onChange={(e) => setShowMyTasksOnly(e.target.checked)} 
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: THEME.colors.sidebarBg,
                      '& + .MuiSwitch-track': {
                        backgroundColor: THEME.colors.sidebarBg,
                      },
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: THEME.colors.textMain }}>
                  Show My Tasks
                </Typography>
              }
              sx={{ ml: 1, mr: 2, userSelect: 'none' }}
            />
          )}

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => { if (val) setViewMode(val) }}
            size="small"
            sx={{ backgroundColor: 'white' }}
          >
            <ToggleButton value="kanban"><ViewKanbanIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="table"><ViewListIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading && Object.keys(tasks).every(k => tasks[k].length === 0) ? (
          <Typography sx={{ color: THEME.colors.textMuted, textAlign: 'center', py: 8 }}>
            Loading board tasks...
          </Typography>
        ) : viewMode === 'table' ? (
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(27,94,85,0.05)', overflowX: 'auto' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'rgba(27,94,85,0.03)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Task Name</TableCell>
                  {currentUser?.role === 'ADMIN' && (
                    <TableCell sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Project</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Assignee</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Due Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Comments</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: THEME.colors.textMain }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredTasks([...tasks.todo, ...tasks.inProgress, ...tasks.completed])
                  .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
                  .map((task) => {
                    const uiPriority = mapPriorityToUI(task.priority);
                    return (
                      <TableRow key={task.id} hover onClick={() => openTask(task)} sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ color: THEME.colors.textMain }}>{task.title}</TableCell>
                        {currentUser?.role === 'ADMIN' && (
                          <TableCell sx={{ color: THEME.colors.textMain }}>{task.project?.name || 'N/A'}</TableCell>
                        )}
                        <TableCell>
                          <Chip label={mapPriorityToUI(task.status === 'IN_PROGRESS' ? 'In Progress' : task.status === 'TODO' ? 'To Do' : 'Completed')} size="small" sx={{
                            backgroundColor: columns.find(c => c.dbStatus === task.status)?.bg || 'rgba(0,0,0,0.05)',
                            color: columns.find(c => c.dbStatus === task.status)?.color || THEME.colors.textMuted,
                            fontWeight: 600, fontSize: 11
                          }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={uiPriority} size="small" sx={{
                            backgroundColor: priorityColors[uiPriority]?.bg || 'rgba(0,0,0,0.05)',
                            color: priorityColors[uiPriority]?.color || THEME.colors.textMuted,
                            fontWeight: 700, fontSize: 11, height: 22,
                          }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 11, backgroundColor: THEME.colors.sidebarBg }}>
                              {(task.assignee?.name || 'U')[0].toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">{task.assignee?.name || 'Unassigned'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: THEME.colors.textMain }}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}
                        </TableCell>
                        <TableCell align="right">
                          {task.comments?.length || 0}
                        </TableCell>
                        <TableCell align="center">
                          {(currentUser?.role === 'ADMIN' || 
                           (currentUser?.role === 'PROJECT_MANAGER' && task.project?.manager_id === currentUser.id)) && (
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={(e) => handleDeleteTask(e, task.id, mapStatusToColKey(task.status))}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {getFilteredTasks([...tasks.todo, ...tasks.inProgress, ...tasks.completed]).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={currentUser?.role === 'ADMIN' ? 8 : 7} align="center" sx={{ py: 4, color: THEME.colors.textMuted }}>No tasks found matching filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              {columns.map((col) => (
                <Box key={col.key} sx={{ flex: 1, minWidth: { xs: '100%', sm: 280 }, width: '100%', backgroundColor: 'rgba(27,94,85,0.03)', p: 2, borderRadius: 4, border: '1px solid rgba(27,94,85,0.05)' }}>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color }} />
                    <Typography fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
                      {col.label}
                    </Typography>
                    <Chip label={getFilteredTasks(tasks[col.key] || []).length} size="small" sx={{
                      backgroundColor: col.bg, color: col.color,
                      fontWeight: 700, height: 22, fontSize: 12
                    }} />
                  </Box>

                  <Droppable droppableId={col.key}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          minHeight: 400,
                          backgroundColor: snapshot.isDraggingOver
                            ? 'rgba(27,94,85,0.06)' : 'transparent',
                          borderRadius: 3,
                          transition: 'background-color 0.2s',
                          p: 0.5
                        }}
                      >
                        {getFilteredTasks(tasks[col.key] || []).map((task, index) => {
                          const uiPriority = mapPriorityToUI(task.priority);
                          const commentsCount = task.comments?.length || 0;
                          const assigneeName = task.assignee?.name || 'Unassigned';
                          const avatarLetter = assigneeName[0].toUpperCase();

                          const isDragDisabled = currentUser?.role === 'COLLABORATOR' && task.assignee?.id !== currentUser?.id;

                          return (
                            <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index} isDragDisabled={isDragDisabled}>
                              {(provided, snapshot) => (
                                <Paper
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  elevation={0}
                                  onClick={() => openTask(task)}
                                  sx={{
                                    p: 2.5, mb: 2, borderRadius: 3,
                                    backgroundColor: getAssigneeColor(assigneeName),
                                    border: snapshot.isDragging
                                      ? `1px solid ${THEME.colors.sidebarBg}`
                                      : '1px solid rgba(27,94,85,0.08)',
                                    cursor: 'pointer',
                                    boxShadow: snapshot.isDragging
                                      ? `0 6px 20px rgba(27,94,85,0.1)` : 'none',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      border: `1px solid ${THEME.colors.sidebarBg}`,
                                      transform: 'translateY(-2px)',
                                    }
                                  }}
                                >
                                  <Box sx={{ position: 'relative' }}>
                                    {task.project?.name && (
                                      <Typography variant="caption" sx={{ color: THEME.colors.textMuted, display: 'block', mb: 0.5, fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {task.project.name}
                                      </Typography>
                                    )}
                                    <Typography variant="body2" sx={{
                                      color: THEME.colors.textMain, fontWeight: 600, mb: 1, pr: 3
                                    }}>
                                      {task.title}
                                    </Typography>
                                    {(currentUser?.role === 'ADMIN' || 
                                     (currentUser?.role === 'PROJECT_MANAGER' && task.project?.manager_id === currentUser.id)) && (
                                      <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={(e) => handleDeleteTask(e, task.id, mapStatusToColKey(task.status))}
                                        sx={{ position: 'absolute', top: -8, right: -8 }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    )}
                                  </Box>
                                  {task.due_date && (
                                    <Typography variant="caption" sx={{ display: 'block', color: THEME.colors.textMuted, mb: 1.5, fontWeight: 500 }}>
                                      Due: {new Date(task.due_date).toLocaleDateString()}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip label={uiPriority} size="small" sx={{
                                      backgroundColor: priorityColors[uiPriority]?.bg || 'rgba(0,0,0,0.05)',
                                      color: priorityColors[uiPriority]?.color || THEME.colors.textMuted,
                                      fontWeight: 700, fontSize: 11, height: 22,
                                    }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {commentsCount > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <CommentIcon sx={{ fontSize: 14, color: THEME.colors.textMuted }} />
                                          <Typography variant="caption" sx={{ color: THEME.colors.textMuted, fontSize: 11 }}>
                                            {commentsCount}
                                          </Typography>
                                        </Box>
                                      )}
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <Avatar sx={{
                                          width: 24, height: 24, fontSize: 11, fontWeight: 'bold',
                                          background: THEME.colors.sidebarBg, color: 'white'
                                        }} title={assigneeName}>
                                          {avatarLetter}
                                        </Avatar>
                                        <Typography variant="caption" sx={{ color: THEME.colors.textMain, fontWeight: 500, fontSize: 11 }}>
                                          {assigneeName}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </Paper>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>

                </Box>
              ))}
            </Box>
          </DragDropContext>
        )}

        {/* Comment Modal */}
        <Modal open={!!selectedTask} onClose={closeTask}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500, maxWidth: '95vw', maxHeight: '85vh',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(27,94,85,0.1)',
            borderRadius: 4, p: 3,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
            {selectedTask && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
                    {selectedTask.title}
                  </Typography>
                  <Box onClick={closeTask} sx={{
                    cursor: 'pointer', color: THEME.colors.textMuted,
                    '&:hover': { color: THEME.colors.textMain }
                  }}>
                    <CloseIcon />
                  </Box>
                </Box>

                {selectedTask.description && (
                  <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 2 }}>
                    {selectedTask.description}
                  </Typography>
                )}

                <Chip label={mapPriorityToUI(selectedTask.priority)} size="small" sx={{
                  alignSelf: 'flex-start', mb: 2,
                  backgroundColor: priorityColors[mapPriorityToUI(selectedTask.priority)]?.bg || 'rgba(0,0,0,0.05)',
                  color: priorityColors[mapPriorityToUI(selectedTask.priority)]?.color || THEME.colors.textMuted,
                  fontWeight: 700, fontSize: 11,
                }} />

                <Divider sx={{ borderColor: 'rgba(27,94,85,0.1)', mb: 2 }} />

                <Typography variant="body2" fontWeight="bold"
                  sx={{ color: THEME.colors.textMain, mb: 2 }}>
                  Comments ({comments.length})
                </Typography>

                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, maxHeight: 280, pr: 0.5 }}>
                  {comments.length === 0 ? (
                    <Typography variant="body2"
                      sx={{ color: THEME.colors.textMuted, textAlign: 'center', py: 3 }}>
                      No comments yet. Be the first to comment!
                    </Typography>
                  ) : (
                    comments.map((c) => {
                      const commentUser = c.user?.name || 'User';
                      const letter = commentUser[0].toUpperCase();
                      const date = new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                      return (
                        <Box key={c.id} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <Avatar sx={{
                            width: 32, height: 32, fontSize: 13, fontWeight: 'bold', flexShrink: 0,
                            background: THEME.colors.sidebarBg, color: 'white'
                          }}>{letter}</Avatar>
                          <Box sx={{
                            flex: 1, p: 1.5, borderRadius: 2.5,
                            backgroundColor: 'rgba(27,94,85,0.03)',
                            border: '1px solid rgba(27,94,85,0.06)'
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" fontWeight="bold" sx={{ color: THEME.colors.sidebarBg }}>
                                {commentUser}
                              </Typography>
                              <Typography variant="caption" sx={{ color: THEME.colors.textMuted }}>
                                {date}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: THEME.colors.textMain, fontSize: 13 }}>
                              {c.message}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>

                <Divider sx={{ borderColor: 'rgba(27,94,85,0.1)', mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Avatar sx={{
                    width: 32, height: 32, fontSize: 13, fontWeight: 'bold', flexShrink: 0,
                    background: THEME.colors.sidebarBg, color: 'white'
                  }}>{currentUser?.name?.[0].toUpperCase() || 'U'}</Avatar>
                  <TextField
                    fullWidth placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: 'rgba(27,94,85,0.03)',
                        color: THEME.colors.textMain,
                        '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                        '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                        '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
                      },
                      '& input::placeholder': { color: 'rgba(27,94,85,0.4)' },
                    }}
                  />
                  <Button variant="contained" onClick={handlePostComment} sx={{
                    minWidth: 42, px: 1.5,
                    backgroundColor: THEME.colors.sidebarBg,
                    color: 'white',
                    borderRadius: 2.5,
                    boxShadow: '0 4px 10px rgba(27,94,85,0.15)',
                    '&:hover': { backgroundColor: '#13463f' }
                  }}>
                    <SendIcon sx={{ fontSize: 18 }} />
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Modal>

      </Box>
    </Layout>
  )
}

export default TaskBoardPage