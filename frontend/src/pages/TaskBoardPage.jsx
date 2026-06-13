import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Chip, Avatar, Button, TextField, Divider, Modal } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CommentIcon from '@mui/icons-material/Comment'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const initialTasks = {
  todo: [
    { id: '1', title: 'Design login page', priority: 'High', assignee: 'N', comments: [] },
    { id: '2', title: 'Setup database', priority: 'Medium', assignee: 'J', comments: [] },
    { id: '3', title: 'Write test cases', priority: 'Low', assignee: 'S', comments: [] },
  ],
  inProgress: [
    { id: '4', title: 'Build dashboard', priority: 'High', assignee: 'N', comments: [] },
    { id: '5', title: 'Create API endpoints', priority: 'Medium', assignee: 'J', comments: [] },
  ],
  completed: [
    { id: '6', title: 'Project setup', priority: 'Low', assignee: 'S', comments: [] },
    { id: '7', title: 'Install dependencies', priority: 'Low', assignee: 'N', comments: [] },
  ]
}

const columns = [
  { key: 'todo', label: 'To Do', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  { key: 'inProgress', label: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  { key: 'completed', label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
]

const priorityColors = {
  High: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  Medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  Low: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
}

function TaskBoardPage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedCol, setSelectedCol] = useState(null)
  const [comment, setComment] = useState('')
  const navigate = useNavigate()

  const onDragEnd = (result) => {
    const { source, destination } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourceCol = [...tasks[source.droppableId]]
    const destCol = source.droppableId === destination.droppableId
      ? sourceCol : [...tasks[destination.droppableId]]

    const [moved] = sourceCol.splice(source.index, 1)
    destCol.splice(destination.index, 0, moved)

    setTasks({
      ...tasks,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol,
    })
  }

  const openTask = (task, colKey) => {
    setSelectedTask(task)
    setSelectedCol(colKey)
  }

  const closeTask = () => {
    setSelectedTask(null)
    setSelectedCol(null)
    setComment('')
  }

  const addComment = () => {
    if (!comment.trim()) return
    const newComment = {
      id: Date.now(),
      text: comment,
      author: 'Nadeesha',
      avatar: 'N',
      time: 'Just now'
    }
    const updatedTasks = { ...tasks }
    const colTasks = [...updatedTasks[selectedCol]]
    const taskIndex = colTasks.findIndex(t => t.id === selectedTask.id)
    colTasks[taskIndex] = {
      ...colTasks[taskIndex],
      comments: [...colTasks[taskIndex].comments, newComment]
    }
    updatedTasks[selectedCol] = colTasks
    setTasks(updatedTasks)
    setSelectedTask(colTasks[taskIndex])
    setComment('')
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
              Drag and drop tasks • Click to comment
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

        <DragDropContext onDragEnd={onDragEnd}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            {columns.map((col) => (
              <Box key={col.key} sx={{ flex: 1, minWidth: 0 }}>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: col.color }} />
                  <Typography fontWeight="bold" sx={{ color: '#f1f5f9' }}>
                    {col.label}
                  </Typography>
                  <Chip label={tasks[col.key].length} size="small" sx={{
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
                        minHeight: 100,
                        backgroundColor: snapshot.isDraggingOver
                          ? `${col.color}10` : 'transparent',
                        borderRadius: 2,
                        transition: 'background-color 0.2s',
                        p: 0.5
                      }}
                    >
                      {tasks[col.key].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              elevation={0}
                              onClick={() => openTask(task, col.key)}
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
                                <Chip label={task.priority} size="small" sx={{
                                  backgroundColor: priorityColors[task.priority].bg,
                                  color: priorityColors[task.priority].color,
                                  fontWeight: 600, fontSize: 11, height: 22,
                                  border: `1px solid ${priorityColors[task.priority].color}40`
                                }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {task.comments.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <CommentIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                                        {task.comments.length}
                                      </Typography>
                                    </Box>
                                  )}
                                  <Avatar sx={{
                                    width: 28, height: 28, fontSize: 12, fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                                  }}>
                                    {task.assignee}
                                  </Avatar>
                                </Box>
                              </Box>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>

              </Box>
            ))}
          </Box>
        </DragDropContext>

        {/* Comment Modal */}
        <Modal open={!!selectedTask} onClose={closeTask}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500, maxHeight: '80vh',
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

                <Chip label={selectedTask.priority} size="small" sx={{
                  alignSelf: 'flex-start', mb: 2,
                  backgroundColor: priorityColors[selectedTask.priority].bg,
                  color: priorityColors[selectedTask.priority].color,
                  fontWeight: 600, fontSize: 11,
                }} />

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                <Typography variant="body2" fontWeight="bold"
                  sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                  Comments ({selectedTask.comments.length})
                </Typography>

                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, maxHeight: 250 }}>
                  {selectedTask.comments.length === 0 ? (
                    <Typography variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', py: 3 }}>
                      No comments yet. Be the first to comment!
                    </Typography>
                  ) : (
                    selectedTask.comments.map((c) => (
                      <Box key={c.id} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                        <Avatar sx={{
                          width: 32, height: 32, fontSize: 13, fontWeight: 'bold', flexShrink: 0,
                          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                        }}>{c.avatar}</Avatar>
                        <Box sx={{
                          flex: 1, p: 1.5, borderRadius: 2,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.07)'
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#a78bfa' }}>
                              {c.author}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                              {c.time}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>
                            {c.text}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Avatar sx={{
                    width: 32, height: 32, fontSize: 13, fontWeight: 'bold', flexShrink: 0,
                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                  }}>N</Avatar>
                  <TextField
                    fullWidth placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
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
                  <Button variant="contained" onClick={addComment} sx={{
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