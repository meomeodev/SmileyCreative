import { useState, useEffect } from 'react';
import { Download, Search, AlertCircle, Calendar, Clock, Filter } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import PageTransition from '../components/PageTransition';

interface Employee {
    id: string;
    name: string;
    avatar: string;
    department: string;
}

interface LogEntry {
    id: string;
    userId: string;
    dateStr: string;
    dayStr: string;
    in: string;
    out: string;
    total: string;
    type: string;
    tColor: string;
    bg: string;
    createdAt: any;
    // Joined data
    employee?: Employee;
}

export default function AttendanceTracking() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [monthFilter, setMonthFilter] = useState('Tất cả');

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 1. Lấy danh sách nhân viên
                const empSnap = await getDocs(collection(db, 'employees'));
                const employeesMap: Record<string, Employee> = {};
                empSnap.docs.forEach(doc => {
                    const data = doc.data();
                    employeesMap[doc.id] = {
                        id: doc.id,
                        name: data.name || 'Người dùng Ẩn danh',
                        avatar: data.avatar || 'https://ui-avatars.com/api/?name=NV',
                        department: data.department || 'Nhân viên'
                    };
                });

                // 2. Lấy toàn bộ lịch sử chấm công
                const logsRef = collection(db, 'timekeeping_logs');
                // Chưa filter query sâu để tránh Firebase đòi Index, tạm lấy hết rồi sort JS
                const logsSnap = await getDocs(logsRef);
                
                const allLogs: LogEntry[] = logsSnap.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        userId: data.userId,
                        dateStr: data.dateStr || '',
                        dayStr: data.dayStr || '',
                        in: data.in || '--:--',
                        out: data.out || '--:--',
                        total: data.total || '--',
                        type: data.type || 'Không rõ',
                        tColor: data.tColor || '#6B7280',
                        bg: data.bg || '#F3F4F6',
                        createdAt: data.createdAt,
                        employee: employeesMap[data.userId] || { id: data.userId, name: 'Nhân sự đã nghỉ', avatar: 'https://ui-avatars.com/api/?name=?', department: 'Cũ' }
                    };
                });

                // 3. Sắp xếp mới nhất lên đầu (fall back nếu createdAt bị rỗng ở local chưa kịp sync server)
                allLogs.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

                setLogs(allLogs);
                setFilteredLogs(allLogs);
            } catch (error) {
                console.error("Lỗi khi tải lịch sử chấm công tổng:", error);
                toast.error("Không thể tải dữ liệu chấm công. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Xử lý Lọc dữ liệu
    useEffect(() => {
        let result = logs;

        if (searchQuery.trim() !== '') {
            const term = searchQuery.toLowerCase();
            result = result.filter(log => 
                log.employee?.name.toLowerCase().includes(term) ||
                log.dateStr.toLowerCase().includes(term) ||
                log.employee?.department.toLowerCase().includes(term)
            );
        }

        if (monthFilter !== 'Tất cả') {
            result = result.filter(log => log.dateStr.includes(monthFilter));
        }

        setFilteredLogs(result);
    }, [searchQuery, monthFilter, logs]);


    const handleExportCSV = () => {
        const headers = ['Nhân sự', 'Phòng ban', 'Ngày', 'Thứ', 'Giờ vào', 'Giờ ra', 'Tổng giờ', 'Trạng thái'];
        const rows = filteredLogs.map((log: LogEntry) => [
            `"${log.employee?.name || ''}"`,
            `"${log.employee?.department || ''}"`,
            `"${log.dateStr}"`,
            `"${log.dayStr}"`,
            `"${log.in}"`,
            `"${log.out}"`,
            `"${log.total}"`,
            // Xác định đi muộn cơ bản dựa trên giờ vào
            `"${(log.in.includes('AM') && parseInt(log.in.split(':')[0]) >= 8 && parseInt(log.in.split(':')[1]) > 0 && log.in.split(':')[0] !== '12') ? 'Đi muộn' : 'Đúng giờ'}"`
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(',') + '\n' 
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Bao_cao_cham_cong_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Parse logic đi muộn (chỉ mang tính tham khảo nhanh trên UI)
    const checkIsLate = (timeStr: string) => {
        if (!timeStr || timeStr === '--:--') return false;
        if (timeStr.includes('PM')) return true; // auto trưa là muộn
        if (timeStr.includes('AM')) {
            const [time, ] = timeStr.split(' ');
            const [hourStr, minStr] = time.split(':');
            const h = parseInt(hourStr);
            const m = parseInt(minStr);
            if (h === 12) return false; // 12AM is midnight
            if (h === 8 && m > 0) return true; // Sau 8:00 AM
            if (h > 8 && h < 12) return true;
        }
        return false;
    };

    // Tạo danh sách các tháng có trong dữ liệu
    const availableMonths = Array.from(new Set(logs.map(log => {
        const parts = log.dateStr.split(',');
        if (parts.length > 0) {
            const mParts = parts[0].split(' ');
            if (mParts.length >= 3) return `${mParts[1]} ${mParts[2]}`; // "Tháng 10"
        }
        return '';
    }))).filter(Boolean);


    return (
        <PageTransition style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>Giám sát Chấm công</h2>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>Báo cáo tổng hợp tình trạng chuyên cần, ra vào của toàn bộ nhân viên.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', background: 'var(--color-surface)',
                        padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', width: '280px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <Search size={16} color="var(--color-text-light)" />
                        <input 
                            type="text" 
                            placeholder="Tìm nhân viên, chức vụ, ngày..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', width: '100%', marginLeft: '0.75rem', fontSize: '0.9rem' }} 
                        />
                    </div>
                    <button onClick={handleExportCSV} className="btn hover-lift" style={{ 
                        padding: '0.6rem 1.25rem', background: 'var(--color-success)', color: 'white', fontSize: '0.9rem', 
                        fontWeight: 600, border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                    }}>
                        <Download size={16} style={{ marginRight: '0.5rem' }} />
                        Xuất Excel (CSV)
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, backgroundColor: 'var(--color-surface)', overflow: 'hidden' }}>
                {/* Thanh lọc nâng cao */}
                <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', backgroundColor: '#F9FAFB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', fontWeight: 500 }}>
                            <Filter size={16} /> Lọc bằng Bộ Lọc:
                        </div>
                        <select 
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            style={{ 
                                padding: '0.4rem 1rem', borderRadius: '2rem', border: '1px solid var(--color-border)', outline: 'none', 
                                backgroundColor: 'white', color: 'var(--color-text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                            }}
                        >
                            <option value="Tất cả">Lọc theo Tháng: Tất cả</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 500 }}>
                        Hiển thị <strong style={{color: 'var(--color-primary)'}}>{filteredLogs.length}</strong> bản ghi
                    </div>
                </div>

                {/* Bảng dữ liệu */}
                <div style={{ overflowX: 'auto', padding: '0 2rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: '1.25rem 0', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', width: '25%' }}>Nhân sự</th>
                                <th style={{ padding: '1.25rem 0', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Thời gian</th>
                                <th style={{ padding: '1.25rem 0', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Giờ vào</th>
                                <th style={{ padding: '1.25rem 0', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Giờ ra</th>
                                <th style={{ padding: '1.25rem 0', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', textAlign: 'center' }}>Tổng giờ</th>
                                <th style={{ padding: '1.25rem 0', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', textAlign: 'right' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '32px', height: '32px', border: '3px solid #ff7d0d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                            <span style={{ fontWeight: 500 }}>Đang phân tích và đồng bộ dữ liệu toàn hệ thống...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                                        <AlertCircle size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-text)' }}>Không tìm thấy dữ liệu</div>
                                        <div style={{ marginTop: '0.25rem' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</div>
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log, index) => {
                                const isLate = checkIsLate(log.in);
                                return (
                                <tr key={index} className="table-row-hover" style={{ borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background-color 0.2s' }}>
                                    <td style={{ padding: '1.25rem 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {log.employee?.avatar.startsWith('http') || log.employee?.avatar.startsWith('data:') ? (
                                                <img src={log.employee.avatar} alt={log.employee.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', backgroundColor: '#E0E7FF', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                    {log.employee?.avatar}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{log.employee?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, marginTop: '0.2rem' }}>{log.employee?.department.toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 0' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={14} color="#f59e0b" /> {log.dateStr}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '0.25rem' }}>{log.dayStr}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 0' }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isLate ? '#ef4444' : 'var(--color-text)' }}>{log.in}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 0' }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>{log.out}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 0', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '0.3rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700,
                                            backgroundColor: log.total !== '--' ? '#f0fdf4' : '#f3f4f6',
                                            color: log.total !== '--' ? '#166534' : '#6b7280', border: log.total !== '--' ? '1px solid #bbf7d0' : 'none'
                                        }}>
                                            {log.total !== '--' ? log.total : 'Đang làm...'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 0', textAlign: 'right' }}>
                                        {isLate ? (
                                            <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Clock size={12} /> Đi muộn
                                            </span>
                                        ) : (
                                            <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Clock size={12} /> Đúng giờ
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageTransition>
    );
}
