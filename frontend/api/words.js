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
    authenticate(req);
    const result = await pool.query('SELECT word FROM words ORDER BY RANDOM() LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'No words in database' });
    }
    res.json({ word: result.rows[0].word });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}