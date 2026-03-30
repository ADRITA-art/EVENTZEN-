import api from './axiosInstance';
import { toList, toPage } from './pagination';

export const updateProfile = (name) => api.put('/users/me', { name });

export const getAllUsers = (params) =>
	api.get('/admin/users', { params }).then((res) => ({
		...res,
		data: params ? toPage(res.data) : toList(res.data),
	}));

export const getUserById = (id) => api.get(`/users/${id}`);

export const deleteUser = (id) => api.delete(`/users/${id}`);
