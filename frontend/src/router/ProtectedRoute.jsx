import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

/**
 * allowedRoles: array of 'ADMIN' | 'CUSTOMER', or empty to allow any authenticated user
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to the home page for their role
    return <Navigate to={role === 'ADMIN' ? '/admin' : '/events'} replace />;
  }

  return children;
}
