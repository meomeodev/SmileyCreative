import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would handle registration here
        navigate('/timekeeping');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F7F7F7',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '460px',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1A1A1A', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
                        Đăng ký thành viên
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.95rem' }}>
                        Tham gia cùng đội ngũ Smiley Agency
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#333', marginBottom: '0.5rem' }}>
                            Họ và tên
                        </label>
                        <input
                            type="text"
                            placeholder="Nhập họ và tên của bạn"
                            required
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #E5E5E5',
                                outline: 'none',
                                fontSize: '0.95rem',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ff7d0d'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E5E5'}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#333', marginBottom: '0.5rem' }}>
                            Email công việc
                        </label>
                        <input
                            type="email"
                            placeholder="name@smileyagency.com"
                            required
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #E5E5E5',
                                outline: 'none',
                                fontSize: '0.95rem',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ff7d0d'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E5E5'}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#333', marginBottom: '0.5rem' }}>
                            Phòng ban
                        </label>
                        <select
                            required
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #E5E5E5',
                                outline: 'none',
                                fontSize: '0.95rem',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                color: '#555',
                                appearance: 'none', // removes default OS arrow
                                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 1rem center',
                                backgroundSize: '1em'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ff7d0d'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E5E5'}
                        >
                            <option value="" disabled selected hidden>Chọn phòng ban</option>
                            <option value="sangtao">Sáng tạo</option>
                            <option value="chienluoc">Chiến lược</option>
                            <option value="kythuat">Kỹ thuật</option>
                            <option value="khachhang">Khách hàng</option>
                            <option value="vanhanh">Vận hành</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#333', marginBottom: '0.5rem' }}>
                            Mật khẩu
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Tối thiểu 8 ký tự"
                                required
                                minLength={8}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 2.5rem 0.8rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #E5E5E5',
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#ff7d0d'}
                                onBlur={(e) => e.target.style.borderColor = '#E5E5E5'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 0
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            marginTop: '1rem',
                            backgroundColor: '#ff7d0d',
                            color: 'white',
                            padding: '0.8rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e66c00'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff7d0d'}
                    >
                        Đăng ký →
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: '#888' }}>
                    Đã có tài khoản?{' '}
                    <a
                        href="/login"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/login');
                        }}
                        style={{ color: '#ff7d0d', fontWeight: 600, textDecoration: 'none' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        Đăng nhập ngay
                    </a>
                </div>
            </div>
        </div>
    );
}
