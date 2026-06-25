# Daminī API — Backend Proxy Layer

Node.js/Express server that silently proxies scraped upstream sources. All upstream identities are hidden from the client.

## Structure

```
backend/
├── server.js       # Express proxy — 14 routes across 4 categories
└── package.json    # Dependencies: express, axios, cors
```

## Local Development

```bash
cd backend
npm install
npm run dev        # nodemon hot-reload
# or
npm start          # production
```

Server runs on `http://localhost:3000` by default.

## Endpoints

| Method | Route | Category |
|--------|-------|----------|
| GET | `/api/ai/tts` | Audio |
| GET | `/api/ai/text2speech-v3` | Audio |
| GET | `/api/Search/Spotify` | Search |
| GET | `/api/Search/soundcloud` | Search |
| GET | `/api/ai/Ai-research` | Intelligence |
| GET | `/blackbox` | Intelligence |
| GET | `/metaai` | Intelligence |
| GET | `/perplexity` | Intelligence |
| GET | `/mubert` | Creative |
| GET | `/writecream` | Creative |
| GET | `/api/Maker/fake-tweet` | Creative |
| GET | `/anime-schedule` | Anime |
| GET | `/anime-character` | Anime |
| GET | `/anime` | Anime |

## Render Deployment

Deploy as a **Web Service** (not Static Site):
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node

Once deployed, set your frontend's `dynamicBase` (in `Index.tsx`) to point to the Render backend URL instead of `window.location.origin` for the scraped endpoints — or configure a custom domain that routes both frontend and backend under one apex.
