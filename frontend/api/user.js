// Mock user data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  best_score: 25,
  games_played: 5
};

export default async function handler(req, res) {
  try {
    // Mock authentication - just check if token exists
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    res.json(mockUser);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
}

module.exports = async function handler(req, res) {