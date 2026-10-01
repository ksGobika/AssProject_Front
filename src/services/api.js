import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('csrm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.response?.data?.data && JSON.stringify(error.response.data.data)) ||
      error.message ||
      'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const resourceAPI = {
  getAll: () => api.get('/resources'),
  getById: (id) => api.get(`/resources/${id}`),
  getAvailable: (params) => api.get('/resources/available', { params }),
};

export const bookingAPI = {
  getBookings: () => api.get('/bookings'),
  getMyBookings: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (bookingData) => api.post('/bookings', bookingData),
  modify: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  checkConflict: (params) => api.get('/bookings/conflict-check', { params }),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getPendingUsers: () => api.get('/admin/users/pending'),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  rejectUser: (id) => api.put(`/admin/users/${id}/reject`),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, null, { params: { role } }),
  createResource: (resourceData) => api.post('/admin/resources', resourceData),
  updateResource: (id, resourceData) => api.put(`/admin/resources/${id}`, resourceData),
  deleteResource: (id) => api.delete(`/admin/resources/${id}`),
  getUtilizationReport: (params) => api.get('/admin/reports/utilization', { params }),
  getAnalytics: () => api.get('/admin/reports/analytics'),
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit', { params }),
};

export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
