import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Lobby: React.FC<{ userId: string }> = ({ userId }) => {
  const [isQueuing, setIsQueuing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for a match being created where I am a player
    const matchSubscription = supabase
      .channel('match-found')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'matches',
          filter: `player1_id=eq.${userId}` 
        }, (payload) => navigate(`/match/${payload.new.id}`))
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'matches',
          filter: `player2_id=eq.${userId}` 
        }, (payload) => navigate(`/match/${payload.new.id}`))
      .subscribe();

    return () => { supabase.removeChannel(matchSubscription); };
  }, [userId, navigate]);

  const joinQueue = async () => {
    setIsQueuing(true);
    
    // Check if someone is already waiting
    const { data: waiting } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (waiting && waiting.player_id !== userId) {
      // Found a match! Create the game and remove opponent from queue
      await supabase.from('matches').insert([
        { player1_id: waiting.player_id, player2_id: userId }
      ]);
      await supabase.from('matchmaking_queue').delete().eq('player_id', waiting.player_id);
    } else {
      // Nobody waiting, join the queue
      await supabase.from('matchmaking_queue').upsert([{ player_id: userId }]);
    }
  };

  return (
    <div className="lobby">
      <h2>{isQueuing ? "Searching for Opponent..." : "Ready to Play?"}</h2>
      <button onClick={joinQueue} disabled={isQueuing}>
        {isQueuing ? "In Queue..." : "Find 1v1 Match"}
      </button>
    </div>
  );
};

export default Lobby;
