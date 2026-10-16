const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const HISTORY_LIMIT = 100;
const historyByRoom = new Map();
const users = new Map(); // socket.id -> { username, room }

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'simple-distributed-chat' }));

function cleanText(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function roomUsers(room) {
  return [...users.values()].filter((u) => u.room === room).map((u) => u.username);
}
function systemMessage(room, text) {
  const message = { type: 'system', text, timestamp: new Date().toISOString() };
  io.to(room).emit('chat message', message);
}

io.on('connection', (socket) => {
  socket.on('join room', ({ username, room } = {}) => {
    username = cleanText(username, 24).replace(/[<>]/g, '');
    room = cleanText(room, 32).replace(/[^\w -]/g, '') || 'general';
    if (!username) return socket.emit('join error', 'Please enter a username.');

    const existing = users.get(socket.id);
    if (existing) {
      socket.leave(existing.room);
      users.delete(socket.id);
      io.to(existing.room).emit('users update', roomUsers(existing.room));
    }
    users.set(socket.id, { username, room });
    socket.join(room);
    socket.emit('joined room', { username, room, history: historyByRoom.get(room) || [] });
    io.to(room).emit('users update', roomUsers(room));
    systemMessage(room, `${username} joined #${room}`);
  });

  socket.on('chat message', (rawText) => {
    const user = users.get(socket.id);
    if (!user) return socket.emit('chat error', 'Join a room before sending messages.');
    const text = cleanText(rawText, 1000);
    if (!text) return;
    const message = { type: 'message', username: user.username, text, timestamp: new Date().toISOString() };
    const history = historyByRoom.get(user.room) || [];
    history.push(message);
    historyByRoom.set(user.room, history.slice(-HISTORY_LIMIT));
    io.to(user.room).emit('chat message', message);
  });

  socket.on('typing', (isTyping) => {
    const user = users.get(socket.id);
    if (user) socket.to(user.room).emit('typing', { username: user.username, isTyping: Boolean(isTyping) });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;
    users.delete(socket.id);
    io.to(user.room).emit('users update', roomUsers(user.room));
    systemMessage(user.room, `${user.username} left #${user.room}`);
  });
});

server.listen(PORT, () => console.log(`Simple Distributed Chat running at http://localhost:${PORT}`));
