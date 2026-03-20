import api from './axiosInstance';

// Customer
export const createBooking = (eventId, numberOfSeats) =>
  api.post('/bookings', { eventId, numberOfSeats });

export const getMyBookings = () => api.get('/bookings/my');

export const cancelBooking = (id) => api.delete(`/bookings/${id}`);

// Admin
export const getAllBookings = () => api.get('/bookings');

export const getBookingsByEvent = (eventId) =>
  api.get(`/bookings/event/${eventId}`);

export const updateBookingStatus = (id, status) =>
  api.put(`/bookings/${id}/status`, { status });

export const getEventBookingSummary = (eventId) =>
  api.get(`/bookings/event/${eventId}/summary`);
