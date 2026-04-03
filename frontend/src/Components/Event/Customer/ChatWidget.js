// src/components/ChatWidget.jsx
import React, { useState, useRef, useEffect } from 'react';

export default function ChatWidget({ userId = 'guest' }) {
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hi! I am EventBot. Try "show events" or "register: Name, 1"' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { from: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: text })
      });
      const data = await res.json();
      setMessages(m => [...m, { from: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(m => [...m, { from: 'bot', text: 'Server error — try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, width: 320, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', borderRadius: 8, background: '#fff', zIndex: 999 }}>
      <div style={{ height: 320, overflowY: 'auto', padding: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.from === 'user' ? 'right' : 'left', margin: '6px 0' }}>
            <div style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 16, background: m.from === 'user' ? '#DCF8C6' : '#eee' }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', padding: 8, borderTop: '1px solid #ddd' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type message..." style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <button onClick={sendMessage} disabled={loading} style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6 }}>{loading ? '...' : 'Send'}</button>
      </div>
    </div>
  );
}
