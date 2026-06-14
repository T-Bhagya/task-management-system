import { useState } from 'react'
import {
  Box, Typography, Paper, Button, Grid, Avatar, Chip, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, List,
  ListItem, ListItemAvatar, ListItemText, CircularProgress, IconButton
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CircleIcon from '@mui/icons-material/Circle'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import CommentIcon from '@mui/icons-material/Comment'
import { api } from '../services/api'

// Helper to format Date to YYYY-MM-DD
const getLocalDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const priorityColors = {
  HIGH: '#f87171',
  MEDIUM: '#fbbf24',
  LOW: '#34d399',
};

const mapPriorityToUI = (priority) => {
  if (priority === 'HIGH') return 'High';
  if (priority === 'MEDIUM') return 'Medium';
  if (priority === 'LOW') return 'Low';
  return priority;
};

const mapStatusToUI = (status) => {
  if (status === 'TODO') return 'To Do';
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'COMPLETED') return 'Completed';
  return status;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarCard({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('Month') // Day, Week, Month, Year

  // Task Details Modal State
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [newCommentText, setNewCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  // Day Selector Modal State (when clicked day has multiple tasks)
  const [daySelectorOpen, setDaySelectorOpen] = useState(false)
  const [daySelectorTasks, setDaySelectorTasks] = useState([])
  const [daySelectorTitle, setDaySelectorTitle] = useState('')

  // Group tasks by due date
  const tasksByDate = {};
  tasks.forEach(task => {
    if (task.due_date) {
      const dateStr = getLocalDateString(task.due_date);
      if (!tasksByDate[dateStr]) {
        tasksByDate[dateStr] = [];
      }
      tasksByDate[dateStr].push(task);
    }
  });

  const getDayTasks = (date) => {
    return tasksByDate[getLocalDateString(date)] || [];
  };

  const handlePrev = () => {
    const nextDate = new Date(currentDate)
    if (viewMode === 'Month') {
      nextDate.setMonth(currentDate.getMonth() - 1)
    } else if (viewMode === 'Week') {
      nextDate.setDate(currentDate.getDate() - 7)
    } else if (viewMode === 'Day') {
      nextDate.setDate(currentDate.getDate() - 1)
    } else if (viewMode === 'Year') {
      nextDate.setFullYear(currentDate.getFullYear() - 1)
    }
    setCurrentDate(nextDate)
  }

  const handleNext = () => {
    const nextDate = new Date(currentDate)
    if (viewMode === 'Month') {
      nextDate.setMonth(currentDate.getMonth() + 1)
    } else if (viewMode === 'Week') {
      nextDate.setDate(currentDate.getDate() + 7)
    } else if (viewMode === 'Day') {
      nextDate.setDate(currentDate.getDate() + 1)
    } else if (viewMode === 'Year') {
      nextDate.setFullYear(currentDate.getFullYear() + 1)
    }
    setCurrentDate(nextDate)
  }

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }

  // Handle clicking on a calendar date
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayTasks = getDayTasks(date);
    if (dayTasks.length === 1) {
      handleOpenTaskModal(dayTasks[0]);
    } else if (dayTasks.length > 1) {
      setDaySelectorTasks(dayTasks);
      setDaySelectorTitle(`Deadlines on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`);
      setDaySelectorOpen(true);
    }
  };

  // Open Task Modal & Load Comments
  const handleOpenTaskModal = (task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
    fetchComments(task.id);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setSelectedTask(null);
    setComments([]);
    setNewCommentText('');
  };

  const fetchComments = async (taskId) => {
    setLoadingComments(true);
    try {
      const fetched = await api.getComments(taskId);
      setComments(fetched || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err.message);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedTask) return;
    setSubmittingComment(true);
    try {
      await api.addComment(selectedTask.id, newCommentText);
      await fetchComments(selectedTask.id);
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // MONTH VIEW HELPERS
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();

    const dayCells = [];

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      dayCells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      dayCells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding (up to 42 cells)
    const totalCells = 42;
    const nextMonthPadding = totalCells - dayCells.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
      dayCells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    const todayStr = getLocalDateString(new Date());
    const selectedStr = getLocalDateString(selectedDate);

    return (
      <Box>
        {/* Days of Week header */}
        <Grid container columns={7} sx={{ mb: 1, textAlign: 'center' }}>
          {dayNames.map(d => (
            <Grid item xs={1} key={d}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                {d}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Grid */}
        <Grid container columns={7} spacing={0.6}>
          {dayCells.map((cell, idx) => {
            const cellDateStr = getLocalDateString(cell.date);
            const cellTasks = tasksByDate[cellDateStr] || [];
            const isToday = cellDateStr === todayStr;
            const isSelected = cellDateStr === selectedStr;

            return (
              <Grid item xs={1} key={idx}>
                <Box
                  onClick={() => handleDateClick(cell.date)}
                  sx={{
                    aspectRatio: '1/1',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s',
                    backgroundColor: isSelected
                      ? '#7c3aed'
                      : isToday
                      ? 'rgba(124,58,237,0.15)'
                      : 'transparent',
                    border: isToday && !isSelected ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                    '&:hover': {
                      backgroundColor: isSelected
                        ? '#7c3aed'
                        : 'rgba(255,255,255,0.06)',
                    }
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: isSelected
                        ? 'white'
                        : cell.isCurrentMonth
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(255,255,255,0.25)',
                      fontWeight: isToday || isSelected ? 'bold' : 'normal',
                      fontSize: 13
                    }}
                  >
                    {cell.date.getDate()}
                  </Typography>

                  {/* Deadline Indicator Dots */}
                  {cellTasks.length > 0 && (
                    <Box sx={{
                      display: 'flex',
                      gap: 0.4,
                      position: 'absolute',
                      bottom: 4
                    }}>
                      {cellTasks.slice(0, 3).map((t, i) => (
                        <CircleIcon
                          key={i}
                          sx={{
                            fontSize: 5,
                            color: isSelected ? 'white' : priorityColors[t.priority] || '#cbd5e1'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </Box>
    )
  }

  // WEEK VIEW
  const renderWeekView = () => {
    // Get start of the current week (Sunday)
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }

    const todayStr = getLocalDateString(new Date());
    const selectedStr = getLocalDateString(selectedDate);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {weekDays.map((date, idx) => {
          const dateStr = getLocalDateString(date);
          const cellTasks = getDayTasks(date);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedStr;

          return (
            <Box
              key={idx}
              onClick={() => handleDateClick(date)}
              sx={{
                p: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s',
                backgroundColor: isSelected
                  ? '#7c3aed'
                  : 'rgba(255,255,255,0.02)',
                border: isToday && !isSelected
                  ? '1px solid rgba(124,58,237,0.4)'
                  : isSelected
                  ? '1px solid #7c3aed'
                  : '1px solid rgba(255,255,255,0.05)',
                '&:hover': {
                  backgroundColor: isSelected ? '#7c3aed' : 'rgba(255,255,255,0.06)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'center', minWidth: 32 }}>
                  <Typography variant="caption" sx={{
                    display: 'block',
                    color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>
                    {dayNames[date.getDay()]}
                  </Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 'bold',
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.85)',
                    fontSize: 14
                  }}>
                    {date.getDate()}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                <Typography variant="body2" sx={{
                  color: isSelected ? 'white' : 'rgba(255,255,255,0.75)',
                  fontSize: 13,
                  fontWeight: cellTasks.length > 0 ? 600 : 400
                }}>
                  {cellTasks.length === 0
                    ? 'No deadlines'
                    : `${cellTasks.length} ${cellTasks.length === 1 ? 'task' : 'tasks'} due`
                  }
                </Typography>
              </Box>

              {cellTasks.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {cellTasks.slice(0, 3).map((t, i) => (
                    <CircleIcon
                      key={i}
                      sx={{
                        fontSize: 8,
                        color: isSelected ? 'white' : priorityColors[t.priority] || '#cbd5e1'
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    )
  }

  // DAY VIEW
  const renderDayView = () => {
    const dayTasks = getDayTasks(currentDate);
    const dateStr = currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <Box sx={{ minHeight: 180 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, fontWeight: 500 }}>
          {dateStr}
        </Typography>

        {dayTasks.length === 0 ? (
          <Box sx={{
            py: 4,
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.01)',
            borderRadius: 2,
            border: '1px dashed rgba(255,255,255,0.08)'
          }}>
            <CalendarMonthIcon sx={{ color: 'rgba(255,255,255,0.15)', fontSize: 32, mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              No tasks due on this day
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            {dayTasks.map(task => (
              <Box
                key={task.id}
                onClick={() => handleOpenTaskModal(task)}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `4px solid ${priorityColors[task.priority] || '#7c3aed'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.06)'
                  }
                }}
              >
                <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 600, mb: 0.5 }}>
                  {task.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={mapPriorityToUI(task.priority)}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 9,
                      fontWeight: 600,
                      color: priorityColors[task.priority],
                      backgroundColor: `${priorityColors[task.priority]}15`,
                      border: `1px solid ${priorityColors[task.priority]}35`
                    }}
                  />
                  <Chip
                    label={mapStatusToUI(task.status)}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 9,
                      fontWeight: 600,
                      color: '#94a3b8',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    )
  }

  // YEAR VIEW
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    
    return (
      <Grid container spacing={1.5}>
        {monthNames.map((m, index) => {
          let monthTaskCount = 0;
          tasks.forEach(t => {
            if (t.due_date) {
              const d = new Date(t.due_date);
              if (d.getFullYear() === year && d.getMonth() === index) {
                monthTaskCount++;
              }
            }
          });

          const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === year;

          return (
            <Grid item xs={6} key={index}>
              <Box
                onClick={() => {
                  const newD = new Date(currentDate);
                  newD.setMonth(index);
                  setCurrentDate(newD);
                  setViewMode('Month');
                }}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  backgroundColor: isCurrentMonth
                    ? 'rgba(124,58,237,0.1)'
                    : 'rgba(255,255,255,0.02)',
                  border: isCurrentMonth
                    ? '1px solid rgba(124,58,237,0.3)'
                    : '1px solid rgba(255,255,255,0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Typography variant="body2" sx={{
                  fontWeight: 'bold',
                  color: isCurrentMonth ? '#a78bfa' : '#f1f5f9',
                  fontSize: 13
                }}>
                  {m.substring(0, 3)}
                </Typography>
                <Typography variant="caption" sx={{
                  color: monthTaskCount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                  fontSize: 10,
                  fontWeight: monthTaskCount > 0 ? 600 : 400
                }}>
                  {monthTaskCount === 0 ? 'No deadlines' : `${monthTaskCount} deadline${monthTaskCount === 1 ? '' : 's'}`}
                </Typography>
              </Box>
            </Grid>
          )
        })}
      </Grid>
    )
  }

  // Header formatted text based on view mode
  const getHeaderTitle = () => {
    if (viewMode === 'Month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    } else if (viewMode === 'Week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()].substring(0, 3)}`
    } else if (viewMode === 'Day') {
      return currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } else if (viewMode === 'Year') {
      return currentDate.getFullYear().toString()
    }
    return ''
  }

  // Filter tasks for the visible active month (Month View agenda)
  const activeYear = currentDate.getFullYear();
  const activeMonth = currentDate.getMonth();

  const activeMonthTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const d = new Date(task.due_date);
    return d.getFullYear() === activeYear && d.getMonth() === activeMonth;
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(145deg, #1e2235, #1a1d2e)',
        border: '1px solid rgba(255,255,255,0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5
      }}
    >
      {/* Calendar View Controller & Mode Switcher */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
          Schedule
        </Typography>
        <Box sx={{
          display: 'flex',
          gap: 0.5,
          p: 0.4,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {['Day', 'Week', 'Month', 'Year'].map(mode => (
            <Box
              key={mode}
              onClick={() => setViewMode(mode)}
              sx={{
                px: 1.4,
                py: 0.6,
                borderRadius: 1.6,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.2s',
                color: viewMode === mode ? 'white' : 'rgba(255,255,255,0.45)',
                backgroundColor: viewMode === mode ? '#7c3aed' : 'transparent',
                '&:hover': {
                  color: 'white'
                }
              }}
            >
              {mode}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Date Navigation Bar */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        py: 0.8,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)'
      }}>
        <Button
          onClick={handlePrev}
          sx={{
            minWidth: 32, width: 32, height: 32, borderRadius: 2,
            color: 'rgba(255,255,255,0.6)', p: 0,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }
          }}
        >
          <ChevronLeftIcon size="small" />
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            onClick={handleToday}
            variant="body2"
            fontWeight={600}
            sx={{
              color: '#f1f5f9',
              cursor: 'pointer',
              fontSize: 13,
              '&:hover': { color: '#a78bfa' }
            }}
          >
            {getHeaderTitle()}
          </Typography>
        </Box>

        <Button
          onClick={handleNext}
          sx={{
            minWidth: 32, width: 32, height: 32, borderRadius: 2,
            color: 'rgba(255,255,255,0.6)', p: 0,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }
          }}
        >
          <ChevronRightIcon size="small" />
        </Button>
      </Box>

      {/* Calendar Area */}
      <Box sx={{ flexGrow: 1 }}>
        {viewMode === 'Month' && renderMonthView()}
        {viewMode === 'Week' && renderWeekView()}
        {viewMode === 'Day' && renderDayView()}
        {viewMode === 'Year' && renderYearView()}
      </Box>

      {/* Preview Panel: Month Deadlines (Fills Blank Space) */}
      {viewMode === 'Month' && (
        <Box sx={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          pt: 2.5,
          mt: 2
        }}>
          <Typography variant="body2" sx={{
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 600,
            mb: 1.5,
            fontSize: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Month's Deadlines ({monthNames[currentDate.getMonth()].substring(0, 3)})</span>
            <Chip
              label={`${activeMonthTasks.length} task${activeMonthTasks.length === 1 ? '' : 's'}`}
              size="small"
              sx={{
                height: 18,
                fontSize: 9,
                color: '#7c3aed',
                backgroundColor: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.25)',
                fontWeight: 600
              }}
            />
          </Typography>

          {activeMonthTasks.length === 0 ? (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', fontStyle: 'italic', py: 0.5 }}>
              No tasks due in this month.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 160, overflowY: 'auto', pr: 0.5 }}>
              {activeMonthTasks.map(task => {
                const taskDate = new Date(task.due_date);
                const dayNum = taskDate.getDate();
                const dayName = dayNames[taskDate.getDay()];
                return (
                  <Box
                    key={task.id}
                    onClick={() => handleOpenTaskModal(task)}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        transform: 'translateX(2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 38,
                        height: 22,
                        borderRadius: 1,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        <Typography variant="caption" sx={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
                          {dayName} {dayNum}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#e2e8f0', fontSize: 12.5, fontWeight: 500, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                      >
                        {task.title}
                      </Typography>
                    </Box>
                    <Chip
                      label={mapPriorityToUI(task.priority)}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 8.5,
                        fontWeight: 600,
                        color: priorityColors[task.priority],
                        backgroundColor: `${priorityColors[task.priority]}15`,
                        border: `1px solid ${priorityColors[task.priority]}35`,
                        flexShrink: 0
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Dialog for selecting from multiple tasks on a clicked day */}
      <Dialog
        open={daySelectorOpen}
        onClose={() => setDaySelectorOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1d2e',
            backgroundImage: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            color: 'white',
            maxWidth: 380,
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">{daySelectorTitle}</Typography>
          <IconButton onClick={() => setDaySelectorOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)', p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {daySelectorTasks.map(task => (
              <Box
                key={task.id}
                onClick={() => {
                  setDaySelectorOpen(false);
                  handleOpenTaskModal(task);
                }}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(124,58,237,0.5)'
                  }
                }}
              >
                <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                  {task.title}
                </Typography>
                <Chip
                  label={mapPriorityToUI(task.priority)}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 8.5,
                    color: priorityColors[task.priority],
                    backgroundColor: `${priorityColors[task.priority]}15`
                  }}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Task Details & Comments Popup Dialog */}
      <Dialog
        open={taskModalOpen}
        onClose={handleCloseTaskModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            backgroundColor: '#151724',
            backgroundImage: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3.5,
            color: 'white',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }
        }}
      >
        {selectedTask && (
          <>
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ pr: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', lineHeight: 1.3 }}>
                  {selectedTask.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center' }}>
                  <Chip
                    label={mapPriorityToUI(selectedTask.priority)}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      color: priorityColors[selectedTask.priority],
                      backgroundColor: `${priorityColors[selectedTask.priority]}15`,
                      border: `1px solid ${priorityColors[selectedTask.priority]}35`
                    }}
                  />
                  <Chip
                    label={mapStatusToUI(selectedTask.status)}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#60a5fa',
                      backgroundColor: 'rgba(96,165,250,0.1)',
                      border: '1px solid rgba(96,165,250,0.25)'
                    }}
                  />
                </Box>
              </Box>
              <IconButton onClick={handleCloseTaskModal} sx={{ color: 'rgba(255,255,255,0.4)', mt: -0.5 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.06)', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Description */}
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.8 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.6, backgroundColor: 'rgba(255,255,255,0.02)', p: 1.8, borderRadius: 2, border: '1px solid rgba(255,255,255,0.04)' }}>
                  {selectedTask.description || 'No description provided for this task.'}
                </Typography>
              </Box>

              {/* Task metadata (Due date & Assignee) */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                    Due Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                    {new Date(selectedTask.due_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                    Assignee
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: 10, fontWeight: 'bold', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
                      {(selectedTask.assignee?.name || 'U')[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                      {selectedTask.assignee?.name || 'Unassigned'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

              {/* Comments Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CommentIcon sx={{ fontSize: 14 }} /> Comments ({comments.length})
                </Typography>

                {/* Submit New Comment Box */}
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <TextField
                    placeholder="Write a comment..."
                    size="small"
                    fullWidth
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        fontSize: 13,
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                        '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.5)' },
                        '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
                      },
                      '& input::placeholder': { color: 'rgba(255,255,255,0.25)' }
                    }}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newCommentText.trim()}
                    sx={{
                      minWidth: 42,
                      width: 42,
                      height: 40,
                      borderRadius: 2.5,
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      boxShadow: '0 4px 10px rgba(124,58,237,0.2)',
                      '&:hover': { backgroundColor: '#6d28d9' },
                      '&:disabled': { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    {submittingComment ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                  </Button>
                </Box>

                {/* List of Comments */}
                {loadingComments ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={20} sx={{ color: '#7c3aed' }} />
                  </Box>
                ) : comments.length === 0 ? (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', py: 2 }}>
                    No comments yet. Start the conversation!
                  </Typography>
                ) : (
                  <List sx={{ maxHeight: 180, overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 1.5, p: 0 }}>
                    {comments.map((comment, i) => {
                      const name = comment.User?.name || 'User';
                      const initial = name[0].toUpperCase();
                      const dateStr = new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                      return (
                        <ListItem key={comment.id || i} alignItems="flex-start" sx={{ p: 0, gap: 1.2 }}>
                          <ListItemAvatar sx={{ minWidth: 'auto', mt: 0.5 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 'bold', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                              {initial}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                                <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: 11 }}>
                                  {name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>
                                  {dateStr}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.5 }}>
                                {comment.message}
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Button onClick={handleCloseTaskModal} sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontWeight: 600 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  )
}

export default CalendarCard
