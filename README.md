# 🧠 Verbal Memory Game

A full-stack verbal memory game inspired by [HumanBenchmark.com](https://humanbenchmark.com/tests/verbal-memory) - test how many words you can remember before making a mistake!

Link to the current website is: [Word Memorise](https://word-memorise.vercel.app/)

## ✨ Features

- **Solo Mode** - Infinite words, game ends on first mistake
- **Leaderboard** - Global top scores
- **User Profiles** - Track your stats and game history(currently does not work)
- **Authentication** - Secure login/registration

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, CSS3 |
| Backend | Vercel API Routes, Node.js |
| Database | PostgreSQL |
| Auth | bcrypt |

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### Installation

```bash
# Clone repo
git clone https://github.com/xvyeh/Verbal-Memory-Game.git
cd Verbal-Memory-Game

# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm start
