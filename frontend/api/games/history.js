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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = authenticate(req);
    const result = await pool.query(
      'SELECT id, score, correct_answers, wrong_answers, duration_seconds, played_at FROM games WHERE user_id = $1 ORDER BY played_at DESC LIMIT 20',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}