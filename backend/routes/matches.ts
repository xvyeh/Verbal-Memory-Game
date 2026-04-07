const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticate } = require('../middleware/auth');

const pool = new Pool({ /* config */ });

// POST /api/matches/invite - Send 1v1 challenge
router.post('/invite', authenticate, async (req, res) => {
  const { friendId } = req.body;
  const player1Id = req.user.id;
  
  // Check if users are friends
  const friendCheck = await pool.query(
    'SELECT * FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = $3',
    [player1Id, friendId, 'accepted']
  );
  
  if (friendCheck.rows.length === 0) {
    return res.status(403).json({ error: 'You can only challenge friends' });
  }
  
  // Create match
  const result = await pool.query(
    `INSERT INTO matches (player1_id, player2_id, status, created_at) 
     VALUES ($1, $2, 'pending', NOW()) RETURNING *`,
    [player1Id, friendId]
  );
  
  res.json({ matchId: result.rows[0].id, message: 'Challenge sent!' });
});

// GET /api/matches/pending - Get pending challenges
router.get('/pending', authenticate, async (req, res) => {
  const result = await pool.query(
    `SELECT m.*, u.username as challenger_name 
     FROM matches m 
     JOIN users u ON m.player1_id = u.id 
     WHERE m.player2_id = $1 AND m.status = 'pending'`,
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/matches/:matchId/accept - Accept challenge
router.post('/:matchId/accept', authenticate, async (req, res) => {
  const { matchId } = req.params;
  
  // Get 10 random words for the match
  const words = await pool.query(
    'SELECT word FROM words ORDER BY RANDOM() LIMIT 10'
  );
  
  // Update match status and store words
  await pool.query(
    `UPDATE matches SET status = 'active' WHERE id = $1 AND player2_id = $2`,
    [matchId, req.user.id]
  );
  
  // Store match words in a separate table
  for (let i = 0; i < words.rows.length; i++) {
    await pool.query(
      `INSERT INTO match_words (match_id, word, round_number) VALUES ($1, $2, $3)`,
      [matchId, words.rows[i].word, i + 1]
    );
  }
  
  res.json({ matchId, words: words.rows });
});

// POST /api/matches/:matchId/answer - Submit answer for 1v1
router.post('/:matchId/answer', authenticate, async (req, res) => {
  const { matchId } = req.params;
  const { roundNumber, word, answer } = req.body; // answer: 'seen' or 'new'
  const userId = req.user.id;
  
  // Get match info
  const match = await pool.query(
    'SELECT * FROM matches WHERE id = $1',
    [matchId]
  );
  
  if (match.rows.length === 0) {
    return res.status(404).json({ error: 'Match not found' });
  }
  
  const matchData = match.rows[0];
  const isPlayer1 = matchData.player1_id === userId;
  
  // Get word history for this player in this match
  const history = await pool.query(
    `SELECT word FROM match_word_answers 
     WHERE match_id = $1 AND player_id = $2 AND round_number < $3`,
    [matchId, userId, roundNumber]
  );
  
  const seenWords = new Set(history.rows.map(r => r.word));
  const isSeen = seenWords.has(word);
  const isCorrect = (answer === 'seen' && isSeen) || (answer === 'new' && !isSeen);
  
  // Record answer
  await pool.query(
    `INSERT INTO match_word_answers (match_id, player_id, round_number, word, answer, is_correct)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [matchId, userId, roundNumber, word, answer, isCorrect]
  );
  
  // Update score if correct
  if (isCorrect) {
    const column = isPlayer1 ? 'player1_score' : 'player2_score';
    await pool.query(
      `UPDATE matches SET ${column} = ${column} + 1 WHERE id = $1`,
      [matchId]
    );
  }
  
  // Check if match is complete (all 10 rounds)
  const answers = await pool.query(
    `SELECT DISTINCT round_number FROM match_word_answers 
     WHERE match_id = $1 AND player_id IN ($2, $3)`,
    [matchId, matchData.player1_id, matchData.player2_id]
  );
  
  let winnerId = null;
  let matchComplete = false;
  
  if (answers.rowCount >= 20) { // 10 rounds × 2 players
    matchComplete = true;
    const finalScores = await pool.query(
      `SELECT player1_score, player2_score FROM matches WHERE id = $1`,
      [matchId]
    );
    const p1Score = finalScores.rows[0].player1_score;
    const p2Score = finalScores.rows[0].player2_score;
    winnerId = p1Score > p2Score ? matchData.player1_id : 
               p2Score > p1Score ? matchData.player2_id : null;
    
    await pool.query(
      `UPDATE matches SET status = 'completed', winner_id = $1, completed_at = NOW() 
       WHERE id = $2`,
      [winnerId, matchId]
    );
  }
  
  res.json({ 
    isCorrect, 
    matchComplete,
    winnerId,
    yourScore: isPlayer1 ? matchData.player1_score + (isCorrect ? 1 : 0) : matchData.player2_score + (isCorrect ? 1 : 0)
  });
});

// GET /api/matches/:matchId/status - Get match status
router.get('/:matchId/status', authenticate, async (req, res) => {
  const result = await pool.query(
    `SELECT m.*, 
            u1.username as player1_name, 
            u2.username as player2_name,
            u3.username as winner_name
     FROM matches m
     JOIN users u1 ON m.player1_id = u1.id
     JOIN users u2 ON m.player2_id = u2.id
     LEFT JOIN users u3 ON m.winner_id = u3.id
     WHERE m.id = $1`,
    [req.params.matchId]
  );
  res.json(result.rows[0]);
});

module.exports = router;
