# Snake Game (Frontend)
## Demo
[https://snake-game-self-five.vercel.app/](https://snake-game-self-five.vercel.app/)

## Tech Stack
* React 18
* Vite
* Canvas API
* Lucide Icons
* Fetch API (REST communication with backend)

## Features
* Classic Snake gameplay using Canvas
* Mobile swipe controls
* Keyboard controls (Arrow keys / WASD)
* Live leaderboard (fetched from backend API)
* Auto-refresh leaderboard
* Score submission to backend
* Responsive UI with modern styling
* Optional sound effects

## Backend Integration
Frontend communicates with a Spring Boot API:

### GET leaderboard
```bash
GET https://snakegame-api-fefxc8b8bcguajd0.polandcentral-01.azurewebsites.net/api/scores
```

### POST score
```json
POST /api/scores
Content-Type: application/json

{
  "playerName": "TestPlayer",
  "score": 120
}
```

## State Flow
* Game runs fully on client side (React state + Canvas rendering)
* Leaderboard is fetched every 10 seconds
* On Game Over → score is sent to backend
* UI updates automatically after response

## How to Run Locally
```bash
cd frontend
npm install
npm run dev
```

App runs on:
```
http://localhost:5173
```

## Build
```bash
npm run build
```

## Deployment
* Hosted on **Vercel**
* CI/CD from GitHub main branch
* Backend hosted separately on **Azure App Service**

## Notes
* No authentication (public demo project)
* Leaderboard rank is calculated on frontend (`index + 1`)
* Backend returns raw score data
* Designed for mobile + desktop

## License
MIT
