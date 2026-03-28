import api from './axiosInstance';

export const getBudgetByEvent = (eventId) => api.get(`/admin/budget/event/${eventId}`);
export const setBudgetForEvent = (eventId, totalBudget) => api.post('/admin/budget/set', { eventId, totalBudget });
export const getExpensesByEvent = (eventId) => api.get(`/admin/budget/expense/event/${eventId}`);
export const addExpense = (payload) => api.post('/admin/budget/expense', payload);
export const deleteExpense = (expenseId) => api.delete(`/admin/budget/expense/${expenseId}`);
