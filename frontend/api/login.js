export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Mock user
  const user = {
    id: 1,
    username: email.split('@')[0],
    email,
    best_score: 25,
    games_played: 5,
  };

  const token = 'mock-token-' + Date.now();

  return res.status(200).json({ user, token });
}