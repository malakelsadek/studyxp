# Study XP

A gamified, pixel-art social study space. Move a character around a shared 2D room, run a synced study timer with the people around you, and keep each other accountable — all in the browser.

<img width="1287" height="880" alt="image" src="https://github.com/user-attachments/assets/2ae4204c-36c6-4517-bba2-fe60aebba08b" />


## Features

### Shared rooms
- Real-time 2D room rendered with Phaser, with everyone's character visible and moving live via Socket.IO
- Create your own room or join an existing one, protected by a password
- Per-room capacity limits, so a room only holds as many people as it's meant to
- Rename a room and upload a custom background image
- Live player count per room on the dashboard

### Study timer
- Pomodoro mode with configurable work/break durations and automatic phase switching
- Stopwatch mode for open-ended sessions
- Toggle between a **shared** timer (synced for everyone in the room) and a **personal** one
- Study sessions are logged and feed into your personal stats

### To-do lists
- Shared room to-do list, or a personal one just for you
- See everyone else's personal to-do progress at a glance (a live completion percentage per person), so you know what the room is working on

### Character customization
- Six pixel-art character presets to choose from
- Pick your look from the dashboard; it's saved to your profile and shown to everyone in the room

### Chat & shortcuts
- Lightweight in-room chat overlay
- Keyboard-driven UX: `Alt+C` to chat, `Alt+T` to toggle the timer, `Alt+D` for the to-do list, `Esc` to close chat
- In-app shortcuts reference panel

### Profiles & stats
- Editable display name, bio, and interests
- Activity heatmap of study time, plus overall study stats
- Guest login for trying the app without creating an account, or a full email/password account

## Tech stack

| | |
|---|---|
| **Client** | React 19, TypeScript, Vite, Phaser 3, Socket.IO client, React Router |
| **Server** | Node.js, Express, TypeScript, Socket.IO, Prisma, PostgreSQL |
| **Auth** | JWT, bcrypt-hashed passwords |

## Project structure

```
client/            React + Phaser frontend
  src/
    auth/          Login page, auth context
    dashboard/      Room browser, character picker
    game/           Phaser scene, character sprites/presets
    room/           In-room UI: timer, to-do, chat, settings, side nav
    profile/        Profile modal, activity heatmap
    socket/         Socket.IO client + shared types
    lib/            API client

server/            Express + Socket.IO backend
  src/
    auth/           Register/login, JWT issuing, auth middleware
    rooms/          Room CRUD, password/capacity changes, background upload
    users/           Profile endpoints
    stats/           Study session logging
    socket/          Realtime room state (players, timer, chat, todos)
  prisma/           Database schema & migrations

assets/             Repo-level images (README preview, design references)
```

## Getting started

This is an npm workspaces monorepo (`client` + `server`).

```bash
npm install

# copy env files and fill in DATABASE_URL / JWT secret / etc.
cp client/.env.example client/.env
cp server/.env.example server/.env

npm run dev          # runs client + server together
# or individually:
npm run dev:client
npm run dev:server
```

## Roadmap

Ideas not yet built:
- Friends list and one-on-one / table chat
- Cosmetic microtransactions, earnable via study time
- Free tile-based layout for rearranging room features
- Calendar integration to plan and see study blocks
- A study-topic label above each character's head
