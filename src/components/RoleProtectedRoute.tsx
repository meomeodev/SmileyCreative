import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAccess } from '../hooks/useAdminAccess';
import toast from 'react-hot-toast';

interface RoleProtectedRouteProps {
    redirectPath?: string;
}

export default function RoleProtectedRoute({ redirectPath = '/' }: RoleProtectedRouteProps) {
    const { currentUser, loading } = useAuth();
    const hasAccess = useAdminAccess();
    const location = useLocation();

    if (loading) {
        return null;
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!hasAccess) {
        // Debounce toast
        setTimeout(() => toast.error('Bạn không có đủ quyền để xem nội dung này!', { id: 'permission-denied' }), 100);
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
}
