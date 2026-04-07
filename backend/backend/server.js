require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'verbal_memory',
  password: process.env.DB_PASSWORD || 'postgres',
  port: 5432,
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ============ DATABASE SCHEMA ============
/*
-- Run these SQL commands in PostgreSQL:

CREATE DATABASE verbal_memory;

\c verbal_memory;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  best_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  duration_seconds INTEGER,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(100) UNIQUE NOT NULL
);

-- Insert seed words for the game (100 common words)
INSERT INTO words (word) VALUES 
('apple'), ('house'), ('car'), ('dog'), ('cat'), ('tree'), ('book'), ('phone'), ('computer'), ('water'),
('fire'), ('earth'), ('wind'), ('sun'), ('moon'), ('star'), ('flower'), ('grass'), ('cloud'), ('rain'),
('happy'), ('sad'), ('big'), ('small'), ('fast'), ('slow'), ('hot'), ('cold'), ('new'), ('old'),
('good'), ('bad'), ('high'), ('low'), ('long'), ('short'), ('wide'), ('narrow'), ('deep'), ('shallow'),
('red'), ('blue'), ('green'), ('yellow'), ('black'), ('white'), ('purple'), ('orange'), ('pink'), ('brown'),
('mother'), ('father'), ('brother'), ('sister'), ('friend'), ('teacher'), ('doctor'), ('nurse'), ('driver'), ('cook'),
('school'), ('office'), ('hospital'), ('store'), ('park'), ('beach'), ('mountain'), ('river'), ('lake'), ('forest'),
('morning'), ('afternoon'), ('evening'), ('night'), ('today'), ('tomorrow'), ('yesterday'), ('week'), ('month'), ('year'),
('one'), ('two'), ('three'), ('four'), ('five'), ('six'), ('seven'), ('eight'), ('nine'), ('ten'),
('run'), ('walk'), ('jump'), ('swim'), ('fly'), ('eat'), ('drink'), ('sleep'), ('work'), ('play');
*/
// ========================================

// Middleware to verify JWT
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, username, email, best_score, games_played FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ API ENDPOINTS ============

// POST /api/register - Register new user
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// POST /api/login - Login user
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        best_score: user.best_score,
        games_played: user.games_played,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user - Get current user info
app.get('/api/user', authenticate, async (req, res) => {
  res.json(req.user);
});

// GET /api/words - Get random word for game
app.get('/api/words', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT word FROM words ORDER BY RANDOM() LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'No words in database' });
    }
    res.json({ word: result.rows[0].word });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/games - Save game result
app.post('/api/games', authenticate, async (req, res) => {
  const { score, correct_answers, wrong_answers, duration_seconds } = req.body;
  const userId = req.user.id;
  
  try {
    await pool.query(
      'INSERT INTO games (user_id, score, correct_answers, wrong_answers, duration_seconds) VALUES ($1, $2, $3, $4, $5)',
      [userId, score, correct_answers, wrong_answers, duration_seconds]
    );
    
    // Update user's best score and games played
    const userResult = await pool.query('SELECT best_score, games_played FROM users WHERE id = $1', [userId]);
    const currentBest = userResult.rows[0].best_score;
    const newBest = Math.max(currentBest, score);
    
    await pool.query(
      'UPDATE users SET best_score = $1, games_played = games_played + 1 WHERE id = $2',
      [newBest, userId]
    );
    
    res.json({ success: true, new_best: newBest > currentBest });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/games/history - Get user's game history
app.get('/api/games/history', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, score, correct_answers, wrong_answers, duration_seconds, played_at FROM games WHERE user_id = $1 ORDER BY played_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leaderboard - Get top scores
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.username, u.best_score, u.games_played FROM users u ORDER BY u.best_score DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
