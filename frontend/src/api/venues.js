import api from './axiosInstance';

export const getVenues = () => api.get('/venues');

export const getVenueById = (id) => api.get(`/venues/${id}`);

export const searchVenues = (location, capacity) =>
  api.get('/venues/search', { params: { location, capacity } });

export const createVenue = (data) => api.post('/venues', data);

export const updateVenue = (id, data) => api.put(`/venues/${id}`, data);

export const deleteVenue = (id) => api.delete(`/venues/${id}`);
