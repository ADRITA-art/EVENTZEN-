import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/auth/ProfilePage';

// Customer pages
import EventsPage from './pages/customer/EventsPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';

// Admin pages
import UsersPage from './pages/admin/UsersPage';
import VenuesPage from './pages/admin/VenuesPage';
import VendorsPage from './pages/admin/VendorsPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer routes — includes /profile for customers */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/events" element={<EventsPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin routes — includes /admin/profile for admins */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="venues" element={<VenuesPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Smart /profile redirect: sends admins to /admin/profile, customers stay at /profile */}
          <Route
            path="/profile"
            element={<Navigate to="/login" replace />}
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
