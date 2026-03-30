import api from './axiosInstance';
import { toList, toPage } from './pagination';

export const getUpcomingEvents = (params) =>
  api.get('/events/upcoming', { params }).then((res) => ({
    ...res,
    data: params ? toPage(res.data) : toList(res.data),
  }));

export const getAllEvents = (params) =>
  api.get('/events', { params }).then((res) => ({
    ...res,
    data: params ? toPage(res.data) : toList(res.data),
  }));

export const getEventById = (id) => api.get(`/events/${id}`);

export const searchEvents = (date, location, params) =>
  api.get('/events/search', { params: { date, location, ...params } }).then((res) => ({
    ...res,
    data: params ? toPage(res.data) : toList(res.data),
  }));

export const createEvent = (data) => api.post('/events', data);

export const updateEvent = (id, data) => api.put(`/events/${id}`, data);

export const cancelEvent = (id) => api.delete(`/events/${id}`);

export const getEventVendors = (id) => api.get(`/events/${id}/vendors`);

export const attachVendorsToEvent = (id, payload) => api.post(`/events/${id}/vendors`, payload);

export const removeVendorFromEvent = (eventId, vendorId) => api.delete(`/events/${eventId}/vendors/${vendorId}`);
