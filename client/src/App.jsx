import { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import './index.css';

function App() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const [inputRoom, setInputRoom] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputUsername.trim() && inputRoom.trim()) {
      setUsername(inputUsername);
      setRoom(inputRoom);
      setJoined(true);
      setInputUsername('');
      setInputRoom('');
    }
  };

  const handleLeave = () => {
    setJoined(false);
    setUsername('');
    setRoom('');
  };

  if (!joined) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>💬 リアルタイムチャット</h1>
          <form onSubmit={handleJoin} className="login-form">
            <input
              type="text"
              placeholder="ユーザー名"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              maxLength="20"
              required
            />
            <input
              type="text"
              placeholder="ルーム名"
              value={inputRoom}
              onChange={(e) => setInputRoom(e.target.value)}
              maxLength="30"
              required
            />
            <button type="submit">チャットに参加</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <ChatRoom username={username} room={room} onLeave={handleLeave} />
    </div>
  );
}

export default App;
