import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Projects API
export const projectsAPI = {
  getAll: (params = {}) => axios.get(`${API}/projects`, { params }),
  getById: (id) => axios.get(`${API}/projects/${id}`),
  create: (data) => axios.post(`${API}/projects`, data),
  update: (id, data) => axios.put(`${API}/projects/${id}`, data),
  submit: (id) => axios.post(`${API}/projects/${id}/submit`),
  validate: (id) => axios.post(`${API}/projects/${id}/validate`),
  approve: (id) => axios.post(`${API}/projects/${id}/approve`),
  reject: (id, reason) => {
    const formData = new FormData();
    formData.append('reason', reason);
    return axios.post(`${API}/projects/${id}/reject`, formData);
  },
  requestDocuments: (id, reason) => {
    const formData = new FormData();
    formData.append('reason', reason);
    return axios.post(`${API}/projects/${id}/request-documents`, formData);
  },
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API}/projects/${id}/upload-document`, formData);
  },
  deleteDocument: (projectId, documentId) => 
    axios.delete(`${API}/projects/${projectId}/documents/${documentId}`),
  getHistory: (id) => axios.get(`${API}/projects/${id}/history`),
  getComments: (id) => axios.get(`${API}/projects/${id}/comments`),
  addComment: (id, content) => axios.post(`${API}/projects/${id}/comments`, { content })
};

// Admin API
export const adminAPI = {
  getUsers: (params = {}) => axios.get(`${API}/admin/users`, { params }),
  updateUser: (id, data) => axios.put(`${API}/admin/users/${id}`, data),
  getStats: () => axios.get(`${API}/admin/stats`),
  exportProjects: (format = 'json') => axios.get(`${API}/admin/export/projects`, { params: { format } })
};

// Categories API
export const categoriesAPI = {
  getAll: () => axios.get(`${API}/categories`)
};

// Users API
export const usersAPI = {
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API}/users/upload-avatar`, formData);
  },
  uploadIdentityDocument: (data) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('doc_type', data.doc_type);
    formData.append('doc_number', data.doc_number);
    formData.append('issue_date', data.issue_date);
    formData.append('expiry_date', data.expiry_date);
    return axios.post(`${API}/users/upload-identity-document`, formData);
  }
};

export default {
  projects: projectsAPI,
  admin: adminAPI,
  categories: categoriesAPI,
  users: usersAPI
};
