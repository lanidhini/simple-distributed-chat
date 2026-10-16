# Simple Distributed Chat Website

A responsive real-time chat demo built with Node.js, Express, Socket.IO, and vanilla HTML/CSS/JavaScript. It is suitable as a starting point for the project proposal.

## Features

- Live chat using WebSockets (Socket.IO)
- Multiple channels: `general`, `random`, and `project`
- Connected-user list and join/leave notifications
- Typing indicators
- Timestamps and recent message history (last 100 messages per room, held in server memory)
- Health endpoint at `/health`
- Responsive layout for desktop and mobile

## Requirements

- Node.js 18 or newer
- npm (included with Node.js)

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000. Use two browser windows (or a normal and incognito window) with different usernames to demonstrate live chat. Open `/health` to see the service health response.

## Push to GitHub

1. Create an empty repository on GitHub named `simple-distributed-chat`.
2. In this folder, run:

```bash
git init
git add .
git commit -m "Build real-time chat website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/simple-distributed-chat.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## Demo checklist

1. Start the app and show `/health` returning `{"status":"ok",...}`.
2. Join `general` as one user in one browser window.
3. Join `general` as a different user in a second window.
4. Send messages in both directions and show they appear live.
5. Show the online user count and typing indicator.
6. Switch to `random` and show messages are separated by room.
7. Refresh a client and show recent in-memory message history is sent when it rejoins.

## Architecture and limitations

Browser clients connect to one Node.js server over Socket.IO. The server tracks active users, routes messages by room, and broadcasts events to all room members. Message history is in memory, so it is lost when the server restarts. This starter is a working real-time chat application, but it is **not yet a multi-instance distributed deployment**. To satisfy a strict distributed-systems requirement, a next phase would add Redis (for cross-instance Socket.IO pub/sub and shared history), persistent storage, and a deployment configuration with at least two app instances.

## Team

Project proposal contributors: Moriah Lane, Emmanuel Nsiah, Drake Madesian, and Suraj Shrestha.
