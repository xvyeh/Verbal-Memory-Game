import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const OneVsOne: React.FC<{ userId: string }> = ({ userId }) => {
  const { matchId } = useParams();
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`match_${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, 
      (payload) => {
        const data = payload.new;
        if (data.player1_id === userId) {
          setOpponentScore(data.player2_score);
        } else {
          setOpponentScore(data.player1_score);
        }
        if (data.status === 'finished') setGameOver(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, userId]);

  const updateMyScore = async (newScore: number) => {
    setMyScore(newScore);
    const scoreField = await getMyPlayerField();
    await supabase.from('matches').update({ [scoreField]: newScore }).eq('id', matchId);
  };

  const getMyPlayerField = async () => {
    const { data } = await supabase.from('matches').select('player1_id').eq('id', matchId).single();
    return data?.player1_id === userId ? 'player1_score' : 'player2_score';
  };

  return (
    <div className="match-container">
      <div className="scoreboard">
        <div>You: {myScore}</div>
        <div>Opponent: {opponentScore}</div>
      </div>
      {/* Insert your Verbal Memory Logic here, calling updateMyScore(score) on each point */}
      {gameOver && <h1>Game Over!</h1>}
    </div>
  );
};

export default OneVsOne;
