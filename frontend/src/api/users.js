import api from './axiosInstance';

export const updateProfile = (name) => api.put('/users/me', { name });

export const getAllUsers = () => api.get('/admin/users');

export const getUserById = (id) => api.get(`/users/${id}`);

export const deleteUser = (id) => api.delete(`/users/${id}`);
