const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Something went wrong');
    error.status = response.status;
    error.details = errorData.details || null;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Auth API
  login: (email, password) => 
    request('/auth/login', { method: 'POST', body: { email, password } }),
  
  signup: (name, email, password, role) => 
    request('/auth/register', { method: 'POST', body: { name, email, password, role } }),

  changePassword: (newPassword) =>
    request('/auth/change-password', { method: 'PUT', body: { newPassword } }),

  // Tasks API
  getTasks: (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.status) query.append('status', filters.status);
    if (filters.priority) query.append('priority', filters.priority);
    if (filters.assignedTo) query.append('assignedTo', filters.assignedTo);
    if (filters.projectId) query.append('projectId', filters.projectId);
    const queryString = query.toString();
    return request(`/tasks${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  getTaskById: (id) => 
    request(`/tasks/${id}`, { method: 'GET' }),

  createTask: (taskData) => 
    request('/tasks', { method: 'POST', body: taskData }),

  updateTask: (id, taskData) => 
    request(`/tasks/${id}`, { method: 'PUT', body: taskData }),

  deleteTask: (id) => 
    request(`/tasks/${id}`, { method: 'DELETE' }),

  // Projects API
  getProjects: () =>
    request('/projects', { method: 'GET' }),

  getProjectById: (id) =>
    request(`/projects/${id}`, { method: 'GET' }),

  createProject: (projectData) =>
    request('/projects', { method: 'POST', body: projectData }),

  updateProject: (id, projectData) =>
    request(`/projects/${id}`, { method: 'PUT', body: projectData }),

  deleteProject: (id) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

  addProjectMembers: (id, userIds) =>
    request(`/projects/${id}/members`, { method: 'POST', body: { user_ids: userIds } }),

  removeProjectMember: (id, userId) =>
    request(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),

  // Comments API
  getComments: (taskId) => 
    request(`/tasks/${taskId}/comments`, { method: 'GET' }),

  addComment: (taskId, message) => 
    request(`/tasks/${taskId}/comments`, { method: 'POST', body: { message } }),

  // Users API
  getUsers: () => 
    request('/users', { method: 'GET' }),

  createUser: (userData) =>
    request('/users', { method: 'POST', body: userData }),

  deleteUser: (id) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  getProfile: () => 
    request('/users/profile', { method: 'GET' }),

  // Notifications API
  getNotifications: () => 
    request('/users/notifications', { method: 'GET' }),

  markNotificationAsRead: (id) => 
    request(`/users/notifications/${id}/read`, { method: 'PUT' }),
};
