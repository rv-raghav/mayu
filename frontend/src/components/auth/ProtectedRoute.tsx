import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /signin page, but save the current location they were
    // trying to go to so we can drop them off there after they sign in.
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
