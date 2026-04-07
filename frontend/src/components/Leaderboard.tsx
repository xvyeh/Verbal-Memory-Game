import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LeaderboardEntry } from '../types';

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/leaderboard')
      .then(res => setEntries(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="leaderboard-container">
      <h1>🏆 Leaderboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : entries.length === 0 ? (
        <p>No scores yet. Be the first!</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr><th>Rank</th><th>Player</th><th>Best Score</th><th>Games Played</th></tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={idx} className={idx < 3 ? `rank-${idx + 1}` : ''}>
                <td className="rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</td>
                <td>{entry.username}</td>
                <td className="score">{entry.best_score}</td>
                <td>{entry.games_played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leaderboard;
