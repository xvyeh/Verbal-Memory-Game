import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const OneVsOne: React.FC<{ userId: string }> = ({ userId }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [wordList, setWordList] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [history] = useState(new Set<string>());

  const seedFromString = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
  };

  const buildWordSequence = (words: string[], seedValue: number) => {
    if (!words.length) return [];
    let state = seedValue;
    const result: string[] = [];
    for (let i = 0; i < 20; i++) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const index = Math.floor((state / 2 ** 32) * words.length);
      result.push(words[index]);
    }
    return result;
  };

  useEffect(() => {
    const initMatch = async () => {
      const { data } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (!data) return;
      setMatch(data);

      if (Array.isArray(data.words) && data.words.length) {
        setWordList(data.words);
        return;
      }

      const { data: allWords } = await supabase
        .from('words')
        .select('word')
        .order('id', { ascending: true });

      const words = (allWords || []).map((item: any) => item.word).filter(Boolean);
      setWordList(buildWordSequence(words, seedFromString(matchId || '')));
    };
    initMatch();

    const sub = supabase.channel(`live_match_${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      (payload) => setMatch(payload.new))
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [matchId]);

  const currentWord = wordList[round] || '';

  const handleChoice = async (choice: 'seen' | 'new') => {
    const isCorrect = (choice === 'seen' && history.has(currentWord)) || (choice === 'new' && !history.has(currentWord));
    
    if (choice === 'new') history.add(currentWord);

    if (!isCorrect) {
      await finalize();
      return;
    }

    const isP1 = match.player1_id === userId;
    const update = isP1 ? { player1_score: match.player1_score + 1 } 
                       : { player2_score: match.player2_score + 1 };

    await supabase.from('matches').update(update).eq('id', matchId);

    if (round < 19) setRound(r => r + 1);
    else await finalize();
  };

  const finalize = async () => {
    const p1Score = match.player1_score;
    const p2Score = match.player2_score;
    const isP1 = match.player1_id === userId;
    const myScore = isP1 ? p1Score : p2Score;
    const oppScore = isP1 ? p2Score : p1Score;
    const win = myScore > oppScore;
    const tie = myScore === oppScore;

    let winnerId = null;
    if (!tie) {
      winnerId = win ? userId : (isP1 ? match.player2_id : match.player1_id);
    }

    // Update match
    await supabase.from('matches').update({ status: 'completed', winner_id: winnerId }).eq('id', matchId);

    // Update ELO
    if (!tie) {
      const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;
      const { data: winnerProfile } = await supabase.from('profiles').select('elo').eq('id', winnerId).single();
      const { data: loserProfile } = await supabase.from('profiles').select('elo').eq('id', loserId).single();
      if (winnerProfile && loserProfile) {
        await supabase.from('profiles').update({ elo: (winnerProfile.elo || 1000) + 25 }).eq('id', winnerId);
        await supabase.from('profiles').update({ elo: Math.max(0, (loserProfile.elo || 1000) - 25) }).eq('id', loserId);
      }
    }

    alert(`Game Over!\nYour Score: ${myScore}\nOpponent Score: ${oppScore}\n${win ? '+25 ELO' : tie ? 'Tie' : '-25 ELO'}`);
    navigate('/leaderboard');
  };

  if (!match || !wordList.length) return <div>Loading...</div>;

  return (
    <div className="game-screen">
      <div className="hud">Opponent Score: {userId === match.player1_id ? match.player2_score : match.player1_score}</div>
      <h1 className="word-display">{currentWord}</h1>
      <div className="controls">
        <button onClick={() => handleChoice('seen')}>SEEN</button>
        <button onClick={() => handleChoice('new')}>NEW</button>
      </div>
    </div>
  );
};

export default OneVsOne;