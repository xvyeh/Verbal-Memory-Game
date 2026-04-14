import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Lobby: React.FC<{ userId: string }> = ({ userId }) => {
  const [isQueuing, setIsQueuing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for a match created for ME
    const channel = supabase.channel('match_lobby')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'matches',
        filter: `player1_id=eq.${userId}` 
      }, (payload) => navigate(`/1v1/${payload.new.id}`))
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'matches',
        filter: `player2_id=eq.${userId}` 
      }, (payload) => navigate(`/1v1/${payload.new.id}`))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, navigate]);

  const startMatchmaking = async () => {
    setIsQueuing(true);
    
    // 1. Check if anyone is waiting
    const { data: waiting } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (waiting && waiting.player_id !== userId) {
      // 2. Someone is waiting! Create match & remove them from queue
      const { data: words } = await supabase.rpc('get_random_words', { cnt: 20 });
      
      await supabase.from('matches').insert({
        player1_id: waiting.player_id,
        player2_id: userId,
        match_words: words.map((w: any) => w.word),
        status: 'active'
      });
      
      await supabase.from('matchmaking_queue').delete().eq('player_id', waiting.player_id);
    } else {
      // 3. No one there, I'm the first one. Join queue.
      await supabase.from('matchmaking_queue').upsert({ player_id: userId });
    }
  };

  return (
    <div className="lobby-container">
      <h2>Global Arena</h2>
      <button onClick={startMatchmaking} disabled={isQueuing}>
        {isQueuing ? "Finding Opponent..." : "Enter Queue"}
      </button>
    </div>
  );
};

export default Lobby;