import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Chip, Avatar, Button, TextField, Divider, Modal } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CommentIcon from '@mui/icons-material/Comment'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
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
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const taskId = parseInt(draggableId);
    const fromColKey = source.droppableId;
    const toColKey = destination.droppableId;
    const newStatus = mapColKeyToStatus(toColKey);

    const sourceCol = [...tasks[fromColKey]]
    const destCol = fromColKey === toColKey ? sourceCol : [...tasks[toColKey]]

    const [moved] = sourceCol.splice(source.index, 1)
    moved.status = newStatus;
    destCol.splice(destination.index, 0, moved)

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

  return (
    <Layout>
      <Box sx={{ p: 4, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
            onClick={() => navigate('/create-task')}
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

        {loading && Object.keys(tasks).every(k => tasks[k].length === 0) ? (
          <Typography sx={{ color: THEME.colors.textMuted, textAlign: 'center', py: 8 }}>
            Loading board tasks...
          </Typography>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              {columns.map((col) => (
                <Box key={col.key} sx={{ flex: 1, minWidth: 280, width: '100%', backgroundColor: 'rgba(27,94,85,0.03)', p: 2, borderRadius: 4, border: '1px solid rgba(27,94,85,0.05)' }}>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color }} />
                    <Typography fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
                      {col.label}
                    </Typography>
                    <Chip label={tasks[col.key]?.length || 0} size="small" sx={{
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
                        {tasks[col.key]?.map((task, index) => {
                          const uiPriority = mapPriorityToUI(task.priority);
                          const commentsCount = task.comments?.length || 0;
                          const assigneeName = task.assignee?.name || 'Unassigned';
                          const avatarLetter = assigneeName[0].toUpperCase();

                          return (
                            <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <Paper
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  elevation={0}
                                  onClick={() => openTask(task)}
                                  sx={{
                                    p: 2.5, mb: 2, borderRadius: 3,
                                    backgroundColor: '#ffffff',
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
                                  <Typography variant="body2" sx={{
                                    color: THEME.colors.textMain, fontWeight: 600, mb: 2
                                  }}>
                                    {task.title}
                                  </Typography>
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
                                      <Avatar sx={{
                                        width: 28, height: 28, fontSize: 12, fontWeight: 'bold',
                                        background: THEME.colors.sidebarBg, color: 'white'
                                      }} title={assigneeName}>
                                        {avatarLetter}
                                      </Avatar>
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