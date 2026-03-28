import { useState } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function AIAssistant() {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Xin chào! Tôi là Trợ lý AI HR. Tôi có thể giúp gì cho bạn hôm nay?\n\nBạn có thể hỏi tôi về:\n- Chính sách công ty\n- Số ngày phép còn lại\n- Tạo thông báo/email nhân sự\n- Thống kê dữ liệu chấm công' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', content: input }]);
        const currentInput = input;
        setInput('');

        // Simulate AI typing
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: `Đây là thông tin về "${currentInput}". Do đây là chế độ Demo nên tôi chưa thể kết nối CSDL thực tế. Bạn có muốn xem thêm biểu mẫu nào không?`
            }]);
        }, 1500);
    };

    return (
        <PageTransition style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height) - 5rem)', maxWidth: '900px', margin: '0 auto', gap: '1.5rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{
                    width: '50px', height: '50px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
                }}>
                    <Sparkles size={28} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #8B5CF6, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        HR AI Assistant
                    </h2>
                    <p style={{ color: 'var(--color-text-light)', margin: 0 }}>Trợ lý thông minh hỗ trợ nghiệp vụ nhân sự</p>
                </div>
            </div>

            {/* Chat History */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }} className="custom-scrollbar">
                {messages.map((msg, index) => (
                    <div key={index} style={{
                        display: 'flex', gap: '1rem', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: msg.role === 'ai' ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'var(--color-surface)',
                            color: msg.role === 'ai' ? 'white' : 'var(--color-primary)',
                            border: msg.role === 'user' ? '2px solid var(--color-primary)' : 'none',
                            boxShadow: msg.role === 'ai' ? '0 0 15px rgba(236, 72, 153, 0.3)' : 'none'
                        }}>
                            {msg.role === 'ai' ? <Bot size={24} /> : <User size={20} />}
                        </div>

                        <div style={{
                            background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--glass-bg)',
                            color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                            padding: '1.25rem',
                            borderRadius: msg.role === 'user' ? '1rem 0 1rem 1rem' : '0 1rem 1rem 1rem',
                            border: msg.role === 'ai' ? '1px solid rgba(139, 92, 246, 0.2)' : 'none',
                            boxShadow: 'var(--glass-shadow)',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {/* Glowing effect container for AI typing */}
            </div>

            {/* Input Area */}
            <div style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
                    background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #8B5CF6)',
                    backgroundSize: '200% auto',
                    borderRadius: '1.5rem',
                    zIndex: -1,
                    opacity: 0.15,
                    animation: 'gradientFlow 3s linear infinite'
                }}></div>
                <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderRadius: '1.2rem', alignItems: 'center', background: 'var(--color-surface)' }}>
                    <input
                        type="text"
                        placeholder="Mô tả công việc bạn cần AI hỗ trợ..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '1rem', fontSize: '1.05rem', color: 'var(--color-text)' }}
                    />
                    <button
                        onClick={handleSend}
                        style={{
                            width: '48px', height: '48px', borderRadius: '1rem',
                            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                            color: 'white', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'transform 0.2s', boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Send size={20} style={{ marginLeft: '2px' }} />
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes gradientFlow {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
        </PageTransition>
    );
}
