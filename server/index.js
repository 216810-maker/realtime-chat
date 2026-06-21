import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const users = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`ユーザー接続: ${socket.id}`);

  socket.on('join', (data) => {
    const { username, room } = data;
    
    users.set(socket.id, { username, room, socketId: socket.id });
    socket.join(room);

    if (!rooms.has(room)) {
      rooms.set(room, []);
    }
    rooms.get(room).push({ username, socketId: socket.id });

    io.to(room).emit('userJoined', {
      username,
      message: `${username}がチャットルームに参加しました`,
      users: Array.from(rooms.get(room) || [])
    });

    console.log(`${username}がルーム${room}に参加しました`);
  });

  socket.on('message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      username: user.username,
      text: data,
      timestamp: new Date().toLocaleTimeString('ja-JP'),
      userId: socket.id
    };

    io.to(user.room).emit('message', message);
    console.log(`[${user.room}] ${user.username}: ${data}`);
  });

  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(user.room).emit('typing', { username: user.username });
    }
  });

  socket.on('stopTyping', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(user.room).emit('stopTyping', { username: user.username });
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const roomUsers = rooms.get(user.room);
      if (roomUsers) {
        const index = roomUsers.findIndex(u => u.socketId === socket.id);
        if (index > -1) {
          roomUsers.splice(index, 1);
        }
      }

      io.to(user.room).emit('userLeft', {
        username: user.username,
        message: `${user.username}がチャットルームから退出しました`,
        users: Array.from(roomUsers || [])
      });

      users.delete(socket.id);
      console.log(`ユーザー切断: ${user.username}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
