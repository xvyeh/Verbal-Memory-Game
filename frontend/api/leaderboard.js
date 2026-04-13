export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mock leaderboard data
  const mockLeaderboard = [
    { username: 'champion', best_score: 50, games_played: 20 },
    { username: 'player2', best_score: 45, games_played: 15 },
    { username: 'player3', best_score: 40, games_played: 12 },
    { username: 'testuser', best_score: 25, games_played: 5 },
  ];

  res.json(mockLeaderboard);
}