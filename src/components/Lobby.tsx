import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Lobby: React.FC<{ userId: string }> = ({ userId }) => {
  const [isQueuing, setIsQueuing] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
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

  const getMatchWords = async () => {
    const { data: words, error: wordsError } = await supabase.rpc('get_random_words', { cnt: 20 });
    if (wordsError || !words) {
      const { data: storedWords, error: storedWordsError } = await supabase
        .from('words')
        .select('word');
      if (storedWordsError || !storedWords?.length) {
        throw wordsError || storedWordsError || new Error('No words available.');
      }
      return Array.from({ length: 20 }, () => {
        const index = Math.floor(Math.random() * storedWords.length);
        return storedWords[index].word;
      });
    }
    return words.map((w: any) => w.word);
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
        .select('player_id, created_at')
        .neq('player_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (waitingError) throw waitingError;

      if (waiting && userId > waiting.player_id) {
        const words = await getMatchWords();

        const { error: insertError } = await supabase.from('matches').insert({
          player1_id: waiting.player_id,
          player2_id: userId,
          match_words: words,
          status: 'active'
        });
        if (insertError) throw insertError;

        const { error: deleteError } = await supabase
          .from('matchmaking_queue')
          .delete()
          .in('player_id', [waiting.player_id, userId]);
        if (deleteError) throw deleteError;
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
      <button onClick={startMatchmaking} disabled={isQueuing}>
        {isQueuing ? "Finding Opponent..." : "Enter Queue"}
      </button>
      {queueError && <p className="error">Queue error: {queueError}</p>}
    </div>
  );
};

export default Lobby;