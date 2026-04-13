import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User, Loader2 } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'agent';
  time: string;
}

export default function AdminChat({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [chats, setChats] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_panel_code');
    fetch('/api/admin/chats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch chats');
        return res.json();
      })
      .then(data => setChats(data.chats || []))
      .catch(err => {
        console.error(err);
        showToast("চ্যাট লিস্ট লোড করতে সমস্যা হয়েছে", "error");
      });
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    const token = localStorage.getItem('admin_panel_code');
    fetch(`/api/admin/chats/${selectedUser}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
      })
      .then(data => {
        setMessages(data.history || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        showToast("চ্যাট হিস্ট্রি লোড করতে সমস্যা হয়েছে", "error");
        setLoading(false);
      });
  }, [selectedUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const text = newMessage.trim();
    setNewMessage("");

    const token = localStorage.getItem('admin_panel_code');
    try {
      const res = await fetch(`/api/admin/chats/${selectedUser}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.msg]);
      } else {
        showToast("মেসেজ পাঠানো যায়নি", "error");
      }
    } catch (err) {
      showToast("মেসেজ পাঠানো যায়নি", "error");
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-[600px]">
      <div className="col-span-1 bg-gray-900 rounded-2xl p-4 border border-white/10 overflow-y-auto">
        <h3 className="font-bold mb-4">Active Chats</h3>
        {Array.isArray(chats) && chats.map(userId => (
          <button 
            key={userId}
            onClick={() => setSelectedUser(userId)}
            className={`w-full p-3 rounded-xl text-left ${selectedUser === userId ? 'bg-yellow-500 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            User: {userId}
          </button>
        ))}
      </div>
      <div className="col-span-3 bg-gray-900 rounded-2xl p-4 border border-white/10 flex flex-col">
        {selectedUser ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Array.isArray(messages) && messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[70%] ${msg.sender === 'agent' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>
                    {msg.text}
                    <p className="text-[10px] opacity-70 mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Reply..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
              />
              <button type="submit" className="bg-yellow-500 text-black p-2 rounded-xl"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat to start</div>
        )}
      </div>
    </div>
  );
}
