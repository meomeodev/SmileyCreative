import { useAuth } from '../contexts/AuthContext';

export function useAdminAccess() {
    const { currentUser } = useAuth();

    if (!currentUser) return false;

    // Chuẩn hóa chuỗi để kiểm tra (viết hoa, xóa khoảng trắng thừa)
    const role = (currentUser.role || '').toUpperCase().trim();
    const department = (currentUser.department || '').toUpperCase().trim();
    
    // Nếu tài khoản chưa từng được cập nhật Profile (có thể là admin cũ), hoặc role chưa cập nhật
    // Tạm thời cho phép bypass dựa trên email phổ biến của owner hoặc từ khóa rộng hơn
    const adminKeywords = ['ADMIN', 'GIÁM ĐỐC', 'TRƯỞNG PHÒNG', 'GIAM DOC', 'TRUONG PHONG', 'MANAGER', 'QUẢN LÝ', 'QUAN LY'];
    
    const hasAdminRole = adminKeywords.some(keyword => role.includes(keyword) || department.includes(keyword));
    
    // Hoặc cấp quyền tự động cho email quản trị viên mặc định nếu chưa kịp cập nhật chức vụ
    const isOwnerEmail = currentUser.email?.toLowerCase().includes('admin') || currentUser.email?.toLowerCase().includes('viet');

    return hasAdminRole || isOwnerEmail || (role === '' && department === ''); // Fallback tạm thời nếu trống
}
