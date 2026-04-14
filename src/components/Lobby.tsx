import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Lobby: React.FC<{ userId: string }> = ({ userId }) => {
  const [isQueuing, setIsQueuing] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for a match created for me
    const channel = supabase.channel('match_lobby')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `player1_id=eq.${userId}`
      }, (payload) => {
        setMatchFound(true);
        setMatchId(payload.new.id);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `player2_id=eq.${userId}`
      }, (payload) => {
        setMatchFound(true);
        setMatchId(payload.new.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    if (!isQueuing) return;

    const interval = window.setInterval(() => {
      checkForMatch();
    }, 2000);

    return () => window.clearInterval(interval);
  }, [isQueuing, userId]);

  useEffect(() => {
    if (matchFound && matchId) {
      setTimeout(() => {
        navigate(`/1v1/${matchId}`);
      }, 2000);
    }
  }, [matchFound, matchId, navigate]);

  const checkForMatch = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('id')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data?.id) {
        setIsQueuing(false);
        setMatchFound(true);
        setMatchId(data.id);
      }
    } catch (error: any) {
      console.error('Match polling error', error);
    }
  };

  const startMatchmaking = async () => {
    setIsQueuing(true);
    setQueueError(null);

    try {
      const { error: upsertError } = await supabase
        .from('matchmaking_queue')
        .upsert({ player_id: userId }, { onConflict: 'player_id' });
      if (upsertError) throw upsertError;

      const { data: waiting, error: waitingError } = await supabase
        .from('matchmaking_queue')
        .select('player_id')
        .neq('player_id', userId)
        .order('player_id', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (waitingError) throw waitingError;

      if (waiting) {
        const { data: insertedMatch, error: insertError } = await supabase.from('matches')
          .insert({
            player1_id: waiting.player_id,
            player2_id: userId,
            player1_score: 0,
            player2_score: 0,
            status: 'active',
            winner_id: null
          })
          .select('id')
          .single();
        if (insertError) throw insertError;

        const { error: deleteError } = await supabase
          .from('matchmaking_queue')
          .delete()
          .in('player_id', [waiting.player_id, userId]);
        if (deleteError) throw deleteError;

        if (insertedMatch?.id) {
          setIsQueuing(false);
          setMatchFound(true);
          setMatchId(insertedMatch.id);
          return;
        }
      } else {
        await checkForMatch();
      }
    } catch (error: any) {
      console.error('Matchmaking error', error);
      setQueueError(error?.message || JSON.stringify(error));
      setIsQueuing(false);
    }
  };

  return (
    <div className="lobby-container">
      <h2>Global Arena</h2>
      {matchFound ? (
        <div className="match-found">
          <h3>Match found!</h3>
          <p>Preparing your game...</p>
        </div>
      ) : (
        <button onClick={startMatchmaking} disabled={isQueuing}>
          {isQueuing ? "Finding Opponent..." : "Enter Queue"}
        </button>
      )}
      {queueError && <p className="error">Queue error: {queueError}</p>}
    </div>
  );
};

export default Lobby;