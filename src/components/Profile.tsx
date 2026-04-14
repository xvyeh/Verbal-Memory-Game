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
        </div>
      </div>
    </div>
  );
};

export default Profile;
