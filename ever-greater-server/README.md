# ever-greater-server

Simple Express + WebSocket server for the global ticket pool.

## Scripts

- `npm start` - run the server
- `npm run dev` - run the server

## Endpoints

- `GET /api/count` - returns the current global ticket pool count
- `POST /api/increment` - increments the count by 1 and returns the new count
- WebSocket `ws://localhost:4000/ws` - pushes `{ "count": number }` updates
