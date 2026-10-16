const socket = io();
const joinScreen = document.querySelector('#join-screen');
const chatScreen = document.querySelector('#chat-screen');
const joinForm = document.querySelector('#join-form');
const usernameInput = document.querySelector('#username');
const messageForm = document.querySelector('#message-form');
const messageInput = document.querySelector('#message-input');
const messages = document.querySelector('#messages');
const membersList = document.querySelector('#members-list');
const roomTitle = document.querySelector('#room-title');
const typingIndicator = document.querySelector('#typing-indicator');
const connectionState = document.querySelector('#connection-state');
let username = '';
let currentRoom = 'general';
let typingTimer;

socket.on('connect', () => { connectionState.textContent = 'connected'; });
socket.on('disconnect', () => { connectionState.textContent = 'disconnected'; });
socket.on('connect_error', () => { connectionState.textContent = 'connection error'; });

joinForm.addEventListener('submit', (event) => {
  event.preventDefault();
  username = usernameInput.value.trim();
  if (!username) return;
  socket.emit('join room', { username, room: currentRoom });
});

document.querySelectorAll('.channel').forEach((button) => {
  button.addEventListener('click', () => {
    currentRoom = button.dataset.room;
    document.querySelectorAll('.channel').forEach((item) => item.classList.toggle('active', item === button));
    roomTitle.textContent = `# ${currentRoom}`;
    messageInput.placeholder = `Message #${currentRoom}…`;
    messages.replaceChildren();
    if (username) socket.emit('join room', { username, room: currentRoom });
  });
});

socket.on('joined room', ({ room, history }) => {
  currentRoom = room;
  roomTitle.textContent = `# ${room}`;
  joinScreen.hidden = true;
  chatScreen.hidden = false;
  document.querySelectorAll('.channel').forEach((button) => button.classList.toggle('active', button.dataset.room === room));
  messages.replaceChildren();
  history.forEach(renderMessage);
  messages.scrollTop = messages.scrollHeight;
  messageInput.focus();
});
socket.on('join error', showError);
socket.on('chat error', showError);
socket.on('chat message', (message) => { renderMessage(message); messages.scrollTop = messages.scrollHeight; });
socket.on('users update', (users) => {
  document.querySelector('#online-count').textContent = `${users.length} online`;
  document.querySelector('#member-count').textContent = users.length;
  membersList.replaceChildren();
  if (!users.length) { const empty = document.createElement('p'); empty.className = 'empty-members'; empty.textContent = 'Nobody here yet.'; membersList.append(empty); }
  users.forEach((name, index) => {
    const item = document.createElement('div'); item.className = 'member';
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = name.slice(0, 1).toUpperCase();
    const label = document.createElement('span'); label.className = 'member-name'; label.textContent = name + (name === username ? ' (you)' : '');
    item.append(avatar, label); membersList.append(item);
  });
});
socket.on('typing', ({ username: name, isTyping }) => { typingIndicator.textContent = isTyping ? `${name} is typing…` : ''; });

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('chat message', text);
  socket.emit('typing', false);
  messageInput.value = '';
});
messageInput.addEventListener('input', () => {
  socket.emit('typing', Boolean(messageInput.value.trim()));
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit('typing', false), 900);
});

function renderMessage(message) {
  if (message.type === 'system') {
    const row = document.createElement('div'); row.className = 'system-message';
    const span = document.createElement('span'); span.textContent = message.text; row.append(span); messages.append(row); return;
  }
  const row = document.createElement('article'); row.className = 'message';
  const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = (message.username || '?').slice(0, 1).toUpperCase();
  const body = document.createElement('div'); body.className = 'message-body';
  const meta = document.createElement('div'); meta.className = 'message-meta';
  const name = document.createElement('span'); name.className = 'message-name'; name.textContent = message.username;
  const time = document.createElement('time'); time.className = 'message-time';
  const date = new Date(message.timestamp); time.dateTime = date.toISOString(); time.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const text = document.createElement('div'); text.className = 'message-text'; text.textContent = message.text;
  meta.append(name, time); body.append(meta, text); row.append(avatar, body); messages.append(row);
}
function showError(message) { window.alert(message); }
