# SigmaGPT

A full-stack ChatGPT-style MERN app with JWT authentication, protected chat history, MongoDB persistence, streaming OpenAI-compatible AI responses, Markdown/code rendering, dark mode, message editing, message deletion, regeneration, and rate limiting.

## Project Structure

```text
SigmaGPT-main/
  Backend/
    middleware/
      auth.js
      rateLimiter.js
    models/
      Chat.js
      User.js
    routes/
      ai.js
      auth.js
      chats.js
    utils/
      openai.js
    .env.example
    package.json
    server.js
  Frontend/
    src/
      api.js
      App.jsx
      AuthPage.jsx
      Chat.jsx
      ChatWindow.jsx
      Sidebar.jsx
      *.css
    .env.example
    package.json
```

## Features

- Register/login with JWT
- Password hashing with bcrypt
- Protected Express routes
- MongoDB `User` and `Chat` models
- Create, view, rename, and delete chats
- Store full message history in MongoDB
- Streaming assistant responses from an OpenAI-compatible provider
- Markdown rendering and code highlighting
- Loading and error states
- Edit user messages
- Delete individual messages
- Regenerate latest assistant response
- Assistant message rating
- API rate limiting
- Responsive dark UI

## Setup

### 1. Backend

```bash
cd Backend
npm install
copy .env.example .env
npm run dev
```

Edit `Backend/.env`:

```env
PORT=8081
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/sigmagpt?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
OPENAI_API_KEY=your_openrouter_api_key_here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openrouter/free
OPENAI_APP_URL=http://localhost:5173
OPENAI_APP_NAME=SigmaGPT Local
```

Use a MongoDB Atlas database user, not your Atlas website login. For free AI testing, create an OpenRouter key at `https://openrouter.ai/keys`.

### 2. Frontend

```bash
cd Frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## API Overview

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Chats:

- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/:chatId`
- `PATCH /api/chats/:chatId`
- `DELETE /api/chats/:chatId`
- `PATCH /api/chats/:chatId/messages/:messageId`
- `DELETE /api/chats/:chatId/messages/:messageId`

AI:

- `POST /api/ai/stream`

All chat and AI routes require:

```http
Authorization: Bearer <jwt>
```
