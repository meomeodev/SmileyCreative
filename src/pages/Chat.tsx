import { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, MoreVertical, Image as ImageIcon, Paperclip, Smile, Plus, X } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc, where, setDoc } from 'firebase/firestore';
import PageTransition from '../components/PageTransition';
import Avatar from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Chat() {
    const { currentUser } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSearchingUser, setIsSearchingUser] = useState(false);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Lắng nghe danh sách phòng chat mà user hiện tại tham gia
    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUser.id)
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
            // Sắp xếp local để tránh yêu cầu index phức tạp cho order & where hỗn hợp
            fetched.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
            setChats(fetched);
            // Auto select chat đầu tiên nếu chưa chọn gì
            if (!activeChat && fetched.length > 0) setActiveChat(fetched[0]);
            // Nếu chat đang actie được cập nhật thì nối lại dữ liệu mới nhất
            else if (activeChat) {
                const refreshedActive = fetched.find(f => f.id === activeChat.id);
                if (refreshedActive) setActiveChat(refreshedActive);
            }
        });
        return () => unsub();
    }, [currentUser, activeChat?.id]); // Thêm optional activeChat.id logic để không mất focus

    // Lắng nghe sub-collection tin nhắn (messages) của phòng chat đang active
    useEffect(() => {
        if (!activeChat) return;
        const q = query(
            collection(db, 'chats', activeChat.id, 'messages'),
            orderBy('createdAt', 'asc')
        );
        const unsub = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            // Scroll to bottom
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        return () => unsub();
    }, [activeChat?.id]);

    // Tải danh bạ hệ thống khi người dùng bấm dấu "+" để tạo đoạn hội thoại
    useEffect(() => {
        if (isSearchingUser) {
            getDocs(collection(db, 'users')).then(snap => {
                const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Loại bản thân mình ra khỏi list tìm kết nối
                setUsersList(allUsers.filter(u => u.id !== currentUser?.id));
            }).catch(e => {
                console.error("Lỗi lấy danh bạ:", e);
                toast.error("Không thể tải danh bạ nhân sự");
            });
        }
    }, [isSearchingUser, currentUser]);

    // Format tên và avatar từ Dữ liệu Chat rút gọn
    const getChatDetails = (chat: any) => {
        if (!currentUser || !chat) return { name: 'Đang tải...', avatar: '', isGroup: false };
        if (chat.isGroup) return { name: chat.name || 'Nhóm', avatar: chat.avatar, isGroup: true };
        
        // Tìm thông tin của người đối diện trong cuộc thảo luận 1-1
        const otherId = chat.participants?.find((id: string) => id !== currentUser.id);
        const otherDetail = chat.participantDetails?.[otherId] || {};
        return {
            name: otherDetail.name || 'Người dùng ẩn danh',
            avatar: otherDetail.avatar || '',
            isGroup: false
        };
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleStartChat = async (user: any) => {
        if (!currentUser) return;
        // Check nếu đã tồn tại chat cá nhân giữa 2 UID
        const existingChat = chats.find(c => !c.isGroup && c.participants.includes(user.id));
        if (existingChat) {
            setActiveChat(existingChat);
            setIsSearchingUser(false);
            return;
        }

        // Khởi tạo Chat ID theo chuỗi Alphabet để không bị trùng lặp
        try {
            toast.loading('Đang khởi tạo kết nối...', { id: 'create_chat' });
            const chatId = currentUser.id < user.id ? `${currentUser.id}_${user.id}` : `${user.id}_${currentUser.id}`;
            const chatRef = doc(collection(db, 'chats'), chatId);
            
            await setDoc(chatRef, {
                participants: [currentUser.id, user.id],
                participantDetails: {
                    [currentUser.id]: { name: currentUser.name || currentUser.email || 'You', avatar: currentUser.avatar || '' },
                    [user.id]: { name: user.name || user.email || 'Họ', avatar: user.avatar || '' }
                },
                isGroup: false,
                lastMessage: 'Đã kết nối lần đầu',
                updatedAt: serverTimestamp(),
                unread: {
                    [currentUser.id]: 0,
                    [user.id]: 0
                }
            });
            
            toast.success('Bắt đầu trò chuyện!', { id: 'create_chat' });
            setIsSearchingUser(false);
            // setActiveChat sẽ tự động được set ở Listener onSnapshot vì chats[] list sẽ có thêm chat này
        } catch (err) {
            console.error(err);
            toast.error('Gặp lỗi khi thử kết nối Chat', { id: 'create_chat' });
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !activeChat || !currentUser) return;

        const text = inputValue.trim();
        setInputValue(''); // Xóa input mượt mà trước khi chờ gửi

        try {
            await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
                text,
                senderId: currentUser.id,
                senderName: currentUser.name || currentUser.email || 'You',
                senderAvatar: currentUser.avatar || '',
                createdAt: serverTimestamp()
            });

            // Cập nhật lên Document tổng để list ngoài Sidebar nảy lên trên cùng
            await updateDoc(doc(db, 'chats', activeChat.id), {
                lastMessage: text,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error(err);
            toast.error('Gửi tin nhắn thất bại');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    // Filter chat list 
    const displayedChats = chats.filter(c => {
        const details = getChatDetails(c);
        return details.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    // Details của Header đang chat
    const activeChatDetails = getChatDetails(activeChat);

    return (
        <PageTransition style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - var(--header-height) - 7rem)', margin: '-1rem' }}>

            {/* Sidebar - Chat List */}
            <div style={{ width: '320px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Chat Nội bộ</h2>
                        <button 
                            className="icon-btn hover-bg" style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--color-primary)' }}
                            onClick={() => setIsSearchingUser(true)}
                            title="Tạo cuộc hội thoại mới"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', background: 'var(--color-background)',
                        padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--color-border)'
                    }}>
                        <Search size={16} color="var(--color-text-light)" />
                        <input 
                            type="text" 
                            placeholder="Tìm cuộc trò chuyện..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', width: '100%', marginLeft: '0.5rem', fontSize: '0.9rem' }} 
                        />
                    </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {displayedChats.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                            Chưa có cuộc trò chuyện nào. Bấm dấu `+` để kết nối!
                        </div>
                    ) : (displayedChats.map(chat => {
                        const details = getChatDetails(chat);
                        const isUnread = false; // Logic chưa đọc có thể phát triển thêm thông qua chat.unread map
                        return (
                            <div key={chat.id} onClick={() => setActiveChat(chat)} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem',
                                cursor: 'pointer', background: activeChat?.id === chat.id ? 'var(--color-background)' : 'transparent',
                                borderLeft: activeChat?.id === chat.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                                transition: 'background 0.2s'
                            }} className="chat-item">
                                <div style={{ position: 'relative' }}>
                                    <Avatar src={details.avatar} name={details.name} size={48} style={{ borderRadius: details.isGroup ? '16px' : '50%' }} />
                                    {!details.isGroup && <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-success)', border: '2px solid var(--color-surface)' }}></div>}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <h4 style={{ fontWeight: 600, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '1rem' }}>{details.name}</h4>
                                        <span style={{ fontSize: '0.75rem', color: isUnread ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: isUnread ? 600 : 400 }}>{formatTime(chat.updatedAt)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: isUnread ? 'var(--color-text)' : 'var(--color-text-light)', fontWeight: isUnread ? 600 : 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{chat.lastMessage}</p>
                                        {isUnread && <span style={{ background: 'var(--color-danger)', color: 'white', fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '1rem', marginLeft: '0.5rem' }}>1</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    }))}
                </div>
            </div>

            {/* Main Chat Area */}
            {activeChat ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* Chat Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Avatar src={activeChatDetails.avatar} name={activeChatDetails.name} size={40} style={{ borderRadius: activeChatDetails.isGroup ? '12px' : '50%' }} />
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{activeChatDetails.name}</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>{activeChatDetails.isGroup ? `${activeChat.participants?.length || 0} thành viên` : 'Đang hoạt động trên hệ thống'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="icon-btn" title="Cuộc gọi thoại"><Phone size={20} /></button>
                            <button className="icon-btn" title="Gọi Video mượt mà"><Video size={20} /></button>
                            <button className="icon-btn" title="Cài đặt riêng tư"><MoreVertical size={20} /></button>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.01)' }}>
                        <div style={{ textAlign: 'center', margin: '1rem 0' }}><span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', background: 'var(--color-background)', padding: '0.3rem 1rem', borderRadius: '1rem' }}>Lịch sử trò chuyện bắt đầu</span></div>

                        {messages.map((msg: any) => {
                            const isMine = msg.senderId === currentUser?.id;
                            return (
                                <div key={msg.id} style={{ display: 'flex', gap: '1rem', alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                                    {!isMine && (
                                        <Avatar src={msg.senderAvatar} name={msg.senderName} size={32} />
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{isMine ? 'Bạn' : msg.senderName}, {formatTime(msg.createdAt)}</span>
                                        <div style={{
                                            wordBreak: 'break-word',
                                            background: isMine ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'var(--color-background)',
                                            color: isMine ? 'white' : 'var(--color-text)',
                                            padding: '0.75rem 1rem',
                                            borderRadius: isMine ? '1rem 0 1rem 1rem' : '0 1rem 1rem 1rem',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                        }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Empty div for semantic anchor to auto-scroll */}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="icon-btn hover-bg"><Paperclip size={20} /></button>
                        <button className="icon-btn hover-bg"><ImageIcon size={20} /></button>
                        <div style={{ flex: 1, background: 'var(--color-background)', borderRadius: '2rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn để gửi đi..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)' }}
                            />
                            <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer' }}><Smile size={20} /></button>
                        </div>
                        <button
                            onClick={handleSendMessage}
                            style={{ 
                                width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', 
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                border: 'none', cursor: inputValue.trim() ? 'pointer' : 'default', transition: 'all 0.2s',
                                opacity: inputValue.trim() ? 1 : 0.6
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = inputValue.trim() ? 'scale(0.95)' : 'none'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Send size={18} style={{ marginLeft: '2px' }} />
                        </button>
                    </div>

                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)', background: 'rgba(0,0,0,0.01)' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '50%', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                        <MessageSquarePlaceholder size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>Ứng dụng Nhắn tin Doanh nghiệp</h2>
                    <p style={{ maxWidth: '400px', textAlign: 'center', lineHeight: 1.6 }}>Lựa chọn một cuộc trò chuyện bất kỳ bên trái, hoặc bấm dấu "+" để tạo đoạn kết nối mới trực tiếp (P2P).</p>
                </div>
            )}

            {/* Modal Tìm kiếm/Tạo đoạn hội thoại mới */}
            {isSearchingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s'
                }} onClick={() => setIsSearchingUser(false)}>
                    <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--color-surface)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Bắt đầu cuộc trò chuyện</h3>
                            <button onClick={() => setIsSearchingUser(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={20} color="var(--color-text-light)"/></button>
                        </div>
                        <div style={{ padding: '1rem 1.5rem' }}>
                            {usersList.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '2rem 0' }}>Không còn ai khác trong công ty.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                                    {usersList.map(user => (
                                        <div key={user.id} onClick={() => handleStartChat(user)} className="hover-bg" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                                            <Avatar src={user.avatar} name={user.name || user.email} size={40} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name || 'Thành viên mới'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{user.email} • {user.role || 'Chưa cập nhật VT'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .chat-item:hover { background: rgba(0,0,0,0.02) !important; }
        .icon-btn { background: transparent; border: none; color: var(--color-text-light); padding: 0.5rem; border-radius: 50%; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .icon-btn:hover { background: var(--color-background); color: var(--color-text); }
        .hover-bg:hover { background: var(--color-background); }
        @media (prefers-color-scheme: dark) {
          .chat-item:hover { background: rgba(255,255,255,0.02) !important; }
        }
      `}</style>
        </PageTransition>
    );
}

// Icon phụ cho Placeholder screen
function MessageSquarePlaceholder({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    )
}
