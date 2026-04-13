import { getUsers } from './_db';

export default function handler(req, res) {
  const users = getUsers();

  const leaderboard = users
    .sort((a, b) => b.best_score - a.best_score)
    .map(u => ({
      username: u.username,
      best_score: u.best_score,
      games_played: u.games_played,
    }));

  return res.status(200).json(leaderboard);
}