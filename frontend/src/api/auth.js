import api from './axiosInstance';

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (name, email, password, role) =>
  api.post('/auth/register', { name, email, password, role });

export const getMe = () => api.get('/auth/me');

export const changePassword = (oldPassword, newPassword) =>
  api.put('/auth/change-password', { oldPassword, newPassword });
