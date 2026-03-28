import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Trong lúc đang parse Auth Firebase, AuthProvider đã render màn hình chờ.
    // Nếu vẫn lọt vào đây (ví dụ loading = false) thì kiểm tra.
    if (loading) {
        return null;
    }

    // Nếu rỗng (chưa đăng nhập), điều hướng về trang Auth kèm theo URL đang cố truy cập (tùy chọn)
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
