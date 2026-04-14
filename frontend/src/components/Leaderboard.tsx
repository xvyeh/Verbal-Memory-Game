import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, elo')
        .order('elo', { ascending: false })
        .limit(10);
      
      if (data) setLeaders(data);
    };
    fetchLeaders();
  }, []);

  return (
    <div className="leaderboard">
      <h2>Top Players</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>ELO</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((player, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{player.username}</td>
              <td>{player.elo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;