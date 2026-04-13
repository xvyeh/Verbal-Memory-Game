export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mock leaderboard data
  const mockLeaderboard = [
    { username: 'nettspend', best_score: 52, games_played: 20 },
    { username: 'kuba', best_score: 37, games_played: 15 },
    { username: 'grajchlopieckartezjusz', best_score: 27, games_played: 12 },
    { username: 'drake', best_score: 13, games_played: 5 },
  ];

  res.json(mockLeaderboard);
}