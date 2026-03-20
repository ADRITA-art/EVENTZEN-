import api from './axiosInstance';

export const getUpcomingEvents = () => api.get('/events/upcoming');

export const getAllEvents = () => api.get('/events');

export const getEventById = (id) => api.get(`/events/${id}`);

export const searchEvents = (date, location) =>
  api.get('/events/search', { params: { date, location } });

export const createEvent = (data) => api.post('/events', data);

export const updateEvent = (id, data) => api.put(`/events/${id}`, data);

export const cancelEvent = (id) => api.delete(`/events/${id}`);
