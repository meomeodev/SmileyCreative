import { useAuth } from '../contexts/AuthContext';

export function useAdminAccess() {
    const { currentUser } = useAuth();

    if (!currentUser) return false;

    // We check both role and department just in case data is structured flexibly
    const role = (currentUser.role || '').toUpperCase();
    const department = (currentUser.department || '').toUpperCase();
    
    const adminRoles = ['ADMIN', 'GIÁM ĐỐC', 'TRƯỞNG PHÒNG'];
    
    return adminRoles.includes(department) || adminRoles.includes(role);
}
