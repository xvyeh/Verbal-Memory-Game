export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Mock response - no database needed
  const mockUser = {
    id: 1,
    username: email.split('@')[0], // Use email prefix as username
    email,
    best_score: 25,
    games_played: 5
  };
  const mockToken = 'mock-jwt-token-' + Date.now();
  
  res.json({
    user: mockUser,
    token: mockToken,
  });
}
}