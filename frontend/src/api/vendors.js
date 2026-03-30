import api from './axiosInstance';
import { toList, toPage } from './pagination';

export const getAllVendors = (params) =>
	api.get('/vendors', { params }).then((res) => ({
		...res,
		data: params ? toPage(res.data) : toList(res.data),
	}));
export const getVendorById = (id) => api.get(`/vendors/${id}`);
export const createVendor = (data) => api.post('/vendors', data);
export const updateVendor = (id, data) => api.put(`/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/vendors/${id}`);
