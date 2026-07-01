import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ChatRoom({ username, room, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // ユーザーをリストに追加
  useEffect(() => {
    const addUser = async () => {
      await supabase.from('users').insert([
        { username, room, online_at: new Date() }
      ]);
    };
    addUser();

    return async () => {
      await supabase.from('users')
        .delete()
        .eq('username', username)
        .eq('room', room);
    };
  }, [username, room]);

  // メッセージをリッスン
  useEffect(() => {
    const subscription = supabase
      .channel(`room:${room}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${room}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // 初期メッセージを読み込む
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room', room)
        .order('timestamp', { ascending: true });
      if (data) setMessages(data);
    };

    loadMessages();

    return () => {
      subscription.unsubscribe();
    };
  }, [room]);

  // ユーザーをリッスン
  useEffect(() => {
    const subscription = supabase
      .channel(`users:${room}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `room=eq.${room}` },
        () => {
          loadUsers();
        }
      )
      .subscribe();

    const loadUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('room', room);
      if (data) setUsers(data);
    };

    loadUsers();

    return () => {
      subscription.unsubscribe();
    };
  }, [room]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      await supabase.from('messages').insert([
        {
          username,
          text: inputMessage,
          room,
          timestamp: new Date()
        }
      ]);
      setInputMessage('');
    }
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <div>
          <h2>#{room}</h2>
          <p>{users.length}人がオンライン</p>
        </div>
        <button className="leave-btn" onClick={onLeave}>退出</button>
      </div>

      <div className="chat-container">
        <aside className="users-list">
          <h3>ユーザー</h3>
          <ul>
            {users.map((user, idx) => (
              <li key={idx} className={user.username === username ? 'current-user' : ''}>
                ✓ {user.username}
              </li>
            ))}
          </ul>
        </aside>

        <main className="chat-main">
          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.username === username ? 'own' : ''}`}>
                <strong>{msg.username}</strong>
                <p>{msg.text}</p>
                <span className="timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString('ja-JP')}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="message-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="メッセージを入力..."
              maxLength="500"
            />
            <button type="submit">送信</button>
          </form>
        </main>
      </div>
    </div>
  );
}

export default ChatRoom;
