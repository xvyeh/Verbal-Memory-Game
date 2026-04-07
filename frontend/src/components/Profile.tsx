import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, GameResult } from '../types';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [history, setHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/games/history')
      .then(res => setHistory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 {user.username}</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{user.best_score}</div>
            <div className="stat-label">Best Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user.games_played}</div>
            <div className="stat-label">Games Played</div>
          </div>
        </div>
      </div>
      
      <div className="history-section">
        <h2>Recent Games</h2>
        {loading ? (
          <p>Loading history...</p>
        ) : history.length === 0 ? (
          <p>No games played yet. Start playing!</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr><th>Date</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Duration</th></tr>
            </thead>
            <tbody>
              {history.map(game => (
                <tr key={game.id}>
                  <td>{new Date(game.played_at).toLocaleDateString()}</td>
                  <td className="score-cell">{game.score}</td>
                  <td className="correct-cell">{game.correct_answers}</td>
                  <td className="wrong-cell">{game.wrong_answers}</td>
                  <td>{Math.floor(game.duration_seconds / 60)}:{(game.duration_seconds % 60).toString().padStart(2, '0')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Profile;
