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

  const user = {
    id: 1,
    username,
    email,
    best_score: 0,
    games_played: 0,
  };

  const token = 'mock-token-' + Date.now();

  return res.status(201).json({ user, token });
}