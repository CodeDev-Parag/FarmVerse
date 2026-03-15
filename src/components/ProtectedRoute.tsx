import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface ProtectedRouteProps {
  requiredRole?: 'farmer' | 'customer' | 'admin';
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, userRole, isAuthInitialized } = useStore();
  const location = useLocation();

  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen bg-farm-green flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-farm-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
