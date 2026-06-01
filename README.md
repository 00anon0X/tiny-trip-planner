# Tiny Trip Planner

A polished browser-only trip planner that turns a destination, dates, pace, budget, and interests into a practical editable itinerary.

- No login
- No backend/API keys
- Deterministic generation
- Editable activities
- LocalStorage persistence
- Copy/download/print export

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run lint
```

## Production

```bash
HOST=127.0.0.1 PORT=3852 npm start
```

Health check:

```bash
curl http://127.0.0.1:3852/health
```

## Deploy target

Current VPS deployment target:

```text
https://free2.thesimplifiedcrew.com
```

Caddy should reverse proxy `free2.thesimplifiedcrew.com` to `127.0.0.1:3852`.
