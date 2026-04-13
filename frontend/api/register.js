import { addUser, findUserByEmail } from './_db';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (findUserByEmail(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = {
    id: Date.now(),
    username,
    email,
    password,
    best_score: 0,
    games_played: 0,
  };

  addUser(user);

  return res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      best_score: user.best_score,
      games_played: user.games_played,
    },
    token: 'mock-token-' + Date.now(),
  });
}