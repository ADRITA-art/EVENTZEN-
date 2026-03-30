import api from './axiosInstance';
import { toList, toPage } from './pagination';

export const getVenues = (params) =>
  api.get('/venues', { params }).then((res) => ({
    ...res,
    data: params ? toPage(res.data) : toList(res.data),
  }));

export const getVenueById = (id) => api.get(`/venues/${id}`);

export const searchVenues = (location, capacity, params) =>
  api.get('/venues/search', { params: { location, capacity, ...params } }).then((res) => ({
    ...res,
    data: params ? toPage(res.data) : toList(res.data),
  }));

export const createVenue = (data) => api.post('/venues', data);

export const updateVenue = (id, data) => api.put(`/venues/${id}`, data);

export const deleteVenue = (id) => api.delete(`/venues/${id}`);
