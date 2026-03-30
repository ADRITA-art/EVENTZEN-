import api from './axiosInstance';
import { toList, toPage } from './pagination';

// Customer
export const createBooking = (eventId, numberOfSeats) =>
  api.post('/bookings', { eventId, numberOfSeats });

export const getMyBookings = (params) =>
  api.get('/bookings/my', { params }).then((res) => ({
    ...res,
    data: params ? toPage(res.data) : toList(res.data),
  }));

export const cancelBooking = (id) => api.delete(`/bookings/${id}`);

// Admin
export const getAllBookings = (params) =>
  api.get('/bookings', { params }).then((res) => ({
    ...res,
    data: params ? toPage(res.data) : toList(res.data),
  }));

export const getBookingsByEvent = (eventId, params) =>
  api.get(`/bookings/event/${eventId}`, { params }).then((res) => ({
    ...res,
    data: params ? toPage(res.data) : toList(res.data),
  }));

export const updateBookingStatus = (id, status) =>
  api.put(`/bookings/${id}/status`, { status });

export const getEventBookingSummary = (eventId) =>
  api.get(`/bookings/event/${eventId}/summary`);
