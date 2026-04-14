import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const OneVsOne: React.FC<{ userId: string }> = ({ userId }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [round, setRound] = useState(0);
  const [history] = useState(new Set<string>());

  useEffect(() => {
    const initMatch = async () => {
      const { data } = await supabase.from('matches').select('*').eq('id', matchId).single();
      setMatch(data);
    };
    initMatch();

    const sub = supabase.channel(`live_match_${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      (payload) => setMatch(payload.new))
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [matchId]);

  const handleChoice = async (choice: 'seen' | 'new') => {
    const word = match.match_words[round];
    const isCorrect = (choice === 'seen' && history.has(word)) || (choice === 'new' && !history.has(word));
    
    if (choice === 'new') history.add(word);

    const isP1 = match.player1_id === userId;
    const update = isP1 ? { player1_score: match.player1_score + (isCorrect ? 1 : 0) } 
                       : { player2_score: match.player2_score + (isCorrect ? 1 : 0) };

    await supabase.from('matches').update(update).eq('id', matchId);

    if (round < 19) setRound(r => r + 1);
    else finalize();
  };

  const finalize = async () => {
    const win = (userId === match.player1_id && match.player1_score > match.player2_score) || 
                (userId === match.player2_id && match.player2_score > match.player1_score);
    
    await supabase.from('matches').update({ status: 'completed', winner_id: win ? userId : null }).eq('id', matchId);
    alert(win ? "You Won! +25 ELO" : "Game Over!");
    navigate('/leaderboard');
  };

  if (!match) return <div>Loading...</div>;

  return (
    <div className="game-screen">
      <div className="hud">Opponent Score: {userId === match.player1_id ? match.player2_score : match.player1_score}</div>
      <h1 className="word-display">{match.match_words[round]}</h1>
      <div className="controls">
        <button onClick={() => handleChoice('seen')}>SEEN</button>
        <button onClick={() => handleChoice('new')}>NEW</button>
      </div>
    </div>
  );
};

export default OneVsOne;