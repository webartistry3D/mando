import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: Array<'OWNER' | 'MANAGER' | 'STAFF' | 'DISPATCH'>;
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Dispatch users fallback to deliveries, others to invoices
    const fallback = user.role === 'DISPATCH' ? '/deliveries' : '/invoices';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
