import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const OneVsOne: React.FC<{ userId: string }> = ({ userId }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [wordList, setWordList] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [gameOver, setGameOver] = useState(false);

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

  const extractScores = (matchData: any) => {
    if (!matchData) return { my: 0, opponent: 0 };
    const isP1 = matchData.player1_id === userId;
    return {
      my: isP1 ? matchData.player1_score ?? 0 : matchData.player2_score ?? 0,
      opponent: isP1 ? matchData.player2_score ?? 0 : matchData.player1_score ?? 0,
    };
  };

  useEffect(() => {
    const initMatch = async () => {
      const { data } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (!data) return;
      setMatch(data);
      const { my, opponent } = extractScores(data);
      setMyScore(my);
      setOpponentScore(opponent);

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
        (payload) => {
          setMatch(payload.new);
          const { my, opponent } = extractScores(payload.new);
          setMyScore(my);
          setOpponentScore(opponent);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [matchId, userId]);

  const currentWord = wordList[round] || '';

  const finalizeMatch = async (finalMyScore: number, finalOppScore: number, latestMatch: any) => {
    const currentMatch = latestMatch || match;
    if (!currentMatch) return;

    const isP1 = currentMatch.player1_id === userId;
    const winnerId = finalMyScore > finalOppScore
      ? userId
      : finalOppScore > finalMyScore
        ? isP1 ? currentMatch.player2_id : currentMatch.player1_id
        : null;

    await supabase.from('matches').update({ status: 'completed', winner_id: winnerId }).eq('id', matchId);

    if (winnerId) {
      const loserId = winnerId === currentMatch.player1_id ? currentMatch.player2_id : currentMatch.player1_id;
      const { data: winnerProfile } = await supabase.from('profiles').select('elo').eq('id', winnerId).single();
      const { data: loserProfile } = await supabase.from('profiles').select('elo').eq('id', loserId).single();
      if (winnerProfile && loserProfile) {
        await supabase.from('profiles').update({ elo: (winnerProfile.elo || 1000) + 25 }).eq('id', winnerId);
        await supabase.from('profiles').update({ elo: Math.max(0, (loserProfile.elo || 1000) - 25) }).eq('id', loserId);
      }
    }

    const resultText = finalMyScore === finalOppScore
      ? `Tie game! Your Score: ${finalMyScore}, Opponent Score: ${finalOppScore}`
      : finalMyScore > finalOppScore
        ? `You won! Your Score: ${finalMyScore}, Opponent Score: ${finalOppScore} (+25 ELO)`
        : `You lost. Your Score: ${finalMyScore}, Opponent Score: ${finalOppScore} (-25 ELO)`;

    setGameOver(true);
    alert(resultText);
    navigate('/leaderboard');
  };

  const submitCompletion = async (finalMyScore: number) => {
    if (!match || gameOver) return;
    const isP1 = match.player1_id === userId;
    const scoreUpdate = isP1 ? { player1_score: finalMyScore } : { player2_score: finalMyScore };

    const { data: freshMatch } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!freshMatch) return;

    const nextStatus = freshMatch.status === 'waiting' ? 'completed' : 'waiting';
    const updatePayload: any = { ...scoreUpdate, status: nextStatus };

    const { data: updatedMatch } = await supabase.from('matches').update(updatePayload).eq('id', matchId).select('*').single();
    if (!updatedMatch) return;

    setMatch(updatedMatch);
    setFinished(true);

    if (updatedMatch.status === 'waiting') {
      setWaitingForOpponent(true);
    } else if (updatedMatch.status === 'completed') {
      const otherScore = isP1 ? updatedMatch.player2_score ?? 0 : updatedMatch.player1_score ?? 0;
      await finalizeMatch(finalMyScore, otherScore, updatedMatch);
    }
  };

  useEffect(() => {
    if (!finished || gameOver || !match) return;
    if (match.status === 'waiting') {
      const isP1 = match.player1_id === userId;
      const otherScore = isP1 ? match.player2_score ?? 0 : match.player1_score ?? 0;
      finalizeMatch(myScore, otherScore, match);
    }
  }, [finished, gameOver, match, myScore]);

  const handleChoice = async (choice: 'seen' | 'new') => {
    if (!match || gameOver || waitingForOpponent) return;
    const alreadySeen = seenWords.has(currentWord);
    const isCorrect = (choice === 'seen' && alreadySeen) || (choice === 'new' && !alreadySeen);
    const nextSeen = new Set(seenWords);
    nextSeen.add(currentWord);
    setSeenWords(nextSeen);

    if (!isCorrect) {
      await submitCompletion(myScore);
      return;
    }

    const updatedScore = myScore + 1;
    const isP1 = match.player1_id === userId;
    const update = isP1
      ? { player1_score: updatedScore }
      : { player2_score: updatedScore };

    await supabase.from('matches').update(update).eq('id', matchId);
    setMyScore(updatedScore);

    if (round >= 19) {
      await submitCompletion(updatedScore);
      return;
    }

    setRound((prev) => prev + 1);
  };

  if (!match || !wordList.length) return <div>Loading...</div>;

  return (
    <div className="game-screen">
      <div className="hud">
        <div>Your Score: {myScore}</div>
        <div>Opponent Score: {opponentScore}</div>
        <div>Round: {round + 1}/20</div>
      </div>
      <h1 className="word-display">{currentWord}</h1>
      <div className="controls">
        <button onClick={() => handleChoice('seen')} disabled={waitingForOpponent}>SEEN</button>
        <button onClick={() => handleChoice('new')} disabled={waitingForOpponent}>NEW</button>
      </div>
      {waitingForOpponent && <div className="waiting-text">Waiting for opponent to finish...</div>}
    </div>
  );
};

export default OneVsOne;