How to Run the Application
1. Setup Database (PostgreSQL)
bash
# Install PostgreSQL, then run:
createdb verbal_memory
psql -d verbal_memory -f schema.sql  # Run the SQL commands from the server.js comments
2. Run Backend
bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
3. Run Frontend
bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
4. Test Functionality
Register a new account

Login with credentials

Play game by clicking SEEN/NEW

View profile to see stats and history

Check leaderboard for global scores

Read documentation at /docs

The game implements the exact same mechanics as Human Benchmark's Verbal Memory test - players must remember if they've seen each word before, and the game ends on the first mistake. All scores are saved and tracked per user with a global leaderboard.

