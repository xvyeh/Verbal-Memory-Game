import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, GameResult } from '../types';

interface ProfileProps {
  userId: string;
}

const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch user data
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setUser(userData);

      // Fetch game history
      const { data: historyData } = await supabase
        .from('game_results')
        .select('*')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(10);
      setHistory(historyData || []);

      setLoading(false);
    };
    fetchData();
  }, [userId]);

  if (loading || !user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 {user.username}</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{user.elo || 1000}</div>
            <div className="stat-label">ELO</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user.best_score || 0}</div>
            <div className="stat-label">Best Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user.games_played || 0}</div>
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
