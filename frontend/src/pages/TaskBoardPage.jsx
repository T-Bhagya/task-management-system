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

const columns = [
  { key: 'todo', label: 'To Do', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', dbStatus: 'TODO' },
  { key: 'inProgress', label: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', dbStatus: 'IN_PROGRESS' },
  { key: 'completed', label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.1)', dbStatus: 'COMPLETED' },
]

const priorityColors = {
  High: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  Medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  Low: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
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
    // Current user context
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
      const fetchedTasks = await api.getTasks();
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

    // Identify details
    const taskId = parseInt(draggableId);
    const fromColKey = source.droppableId;
    const toColKey = destination.droppableId;
    const newStatus = mapColKeyToStatus(toColKey);

    // Optimistic local state update
    const sourceCol = [...tasks[fromColKey]]
    const destCol = fromColKey === toColKey ? sourceCol : [...tasks[toColKey]]

    const [moved] = sourceCol.splice(source.index, 1)
    moved.status = newStatus; // update status locally
    destCol.splice(destination.index, 0, moved)

    setTasks({
      ...tasks,
      [fromColKey]: sourceCol,
      [toColKey]: destCol,
    })

    // Persist to API
    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to persist task status update:', error.message);
      // Revert in case of API failure
      loadTasks();
    }
  }

  const openTask = async (task) => {
    setSelectedTask(task)
    setComments([])
    try {
      // Re-fetch comments dynamically to make sure we see latest comments
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
      
      // Update comment count on task card locally
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
      <Box sx={{ p: 4, backgroundColor: '#0f1117', minHeight: '100vh' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
              Task Board
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
              Drag and drop tasks • Click to view comments
            </Typography>
          </Box>
          <Button startIcon={<AddIcon />} variant="contained"
            onClick={() => navigate('/create-task')} sx={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3,
              '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #2563eb)' }
            }}>
            Add Task
          </Button>
        </Box>

        {loading && Object.keys(tasks).every(k => tasks[k].length === 0) ? (
          <Typography sx={{ color: 'white', textAlign: 'center', py: 8 }}>
            Loading board tasks...
          </Typography>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              {columns.map((col) => (
                <Box key={col.key} sx={{ flex: 1, minWidth: 280, width: '100%' }}>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color }} />
                    <Typography fontWeight="bold" sx={{ color: '#f1f5f9' }}>
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
                          minHeight: 300,
                          backgroundColor: snapshot.isDraggingOver
                            ? `${col.color}10` : 'transparent',
                          borderRadius: 2,
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
                                    p: 2.5, mb: 2, borderRadius: 2.5,
                                    background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
                                    border: snapshot.isDragging
                                      ? `1px solid ${col.color}80`
                                      : '1px solid rgba(255,255,255,0.07)',
                                    cursor: 'pointer',
                                    boxShadow: snapshot.isDragging
                                      ? `0 8px 25px ${col.color}30` : 'none',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      border: `1px solid ${col.color}50`,
                                      transform: 'translateY(-2px)',
                                    }
                                  }}
                                >
                                  <Typography variant="body2" sx={{
                                    color: '#e2e8f0', fontWeight: 500, mb: 2
                                  }}>
                                    {task.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip label={uiPriority} size="small" sx={{
                                      backgroundColor: priorityColors[uiPriority]?.bg || 'rgba(255,255,255,0.1)',
                                      color: priorityColors[uiPriority]?.color || 'white',
                                      fontWeight: 600, fontSize: 11, height: 22,
                                      border: `1px solid ${priorityColors[uiPriority]?.color || 'white'}40`
                                    }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {commentsCount > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <CommentIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                                            {commentsCount}
                                          </Typography>
                                        </Box>
                                      )}
                                      <Avatar sx={{
                                        width: 28, height: 28, fontSize: 12, fontWeight: 'bold',
                                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
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
            background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3, p: 3,
            display: 'flex', flexDirection: 'column'
          }}>
            {selectedTask && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
                    {selectedTask.title}
                  </Typography>
                  <Box onClick={closeTask} sx={{
                    cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                    '&:hover': { color: 'white' }
                  }}>
                    <CloseIcon />
                  </Box>
                </Box>

                {selectedTask.description && (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                    {selectedTask.description}
                  </Typography>
                )}

                <Chip label={mapPriorityToUI(selectedTask.priority)} size="small" sx={{
                  alignSelf: 'flex-start', mb: 2,
                  backgroundColor: priorityColors[mapPriorityToUI(selectedTask.priority)]?.bg || 'rgba(255,255,255,0.1)',
                  color: priorityColors[mapPriorityToUI(selectedTask.priority)]?.color || 'white',
                  fontWeight: 600, fontSize: 11,
                }} />

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                <Typography variant="body2" fontWeight="bold"
                  sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                  Comments ({comments.length})
                </Typography>

                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, maxHeight: 280, pr: 0.5 }}>
                  {comments.length === 0 ? (
                    <Typography variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', py: 3 }}>
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
                            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                          }}>{letter}</Avatar>
                          <Box sx={{
                            flex: 1, p: 1.5, borderRadius: 2,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.07)'
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" fontWeight="bold" sx={{ color: '#a78bfa' }}>
                                {commentUser}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                                {date}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>
                              {c.message}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Avatar sx={{
                    width: 32, height: 32, fontSize: 13, fontWeight: 'bold', flexShrink: 0,
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                  }}>{currentUser?.name?.[0].toUpperCase() || 'U'}</Avatar>
                  <TextField
                    fullWidth placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                        '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.5)' },
                        '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
                      },
                      '& input': { color: 'white' },
                      '& input::placeholder': { color: 'rgba(255,255,255,0.3)' },
                    }}
                  />
                  <Button variant="contained" onClick={handlePostComment} sx={{
                    minWidth: 42, px: 1.5,
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                    borderRadius: 2,
                    '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #2563eb)' }
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