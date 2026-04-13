import { addGame, getUsers } from './_db';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    score,
    correct_answers,
    wrong_answers,
    duration_seconds,
    userEmail,
  } = req.body;

  const game = {
    id: Date.now(),
    score,
    correct_answers,
    wrong_answers,
    duration_seconds,
    userEmail,
    created_at: new Date(),
  };

  addGame(game);

  const users = getUsers();
  const user = users.find(u => u.email === userEmail);

  if (user) {
    user.games_played += 1;
    if (score > user.best_score) {
      user.best_score = score;
    }
  }

  return res.status(200).json({ message: 'Game saved' });
}