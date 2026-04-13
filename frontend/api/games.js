const pool = require('./_db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticate(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('No token provided');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

module.exports = async function handler(req, res) {
  }

  try {
    const userId = authenticate(req);
    const { score, correct_answers, wrong_answers, duration_seconds } = req.body;

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
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}