const pool = require('../_db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await pool.query(
      'SELECT u.username, u.best_score, u.games_played FROM users u ORDER BY u.best_score DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}