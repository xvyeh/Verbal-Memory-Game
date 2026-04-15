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

  // -----------------------------
  // SEED GENERATOR
  // -----------------------------
  const seedFromString = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
  };

  // -----------------------------
  // REAL SHUFFLE (FIX)
  // -----------------------------
  const shuffleArray = (array: string[], seed: number) => {
    const arr = [...array];
    let rng = seed;

    for (let i = arr.length - 1; i > 0; i--) {
      rng = (rng * 1664525 + 1013904223) >>> 0;
      const j = rng % (i + 1);

      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  };

  // -----------------------------
  // SCORE HELPERS
  // -----------------------------
  const extractScores = (matchData: any) => {
    if (!matchData) return { my: 0, opponent: 0 };
    const isP1 = matchData.player1_id === userId;

    return {
      my: isP1 ? matchData.player1_score ?? 0 : matchData.player2_score ?? 0,
      opponent: isP1 ? matchData.player2_score ?? 0 : matchData.player1_score ?? 0,
    };
  };

  // -----------------------------
  // INIT MATCH
  // -----------------------------
  useEffect(() => {
    const initMatch = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (!data) return;

      setMatch(data);

      const { my, opponent } = extractScores(data);
      setMyScore(my);
      setOpponentScore(opponent);

      const { data: allWords } = await supabase
        .from('words')
        .select('word')
        .order('id', { ascending: true });

      const words = (allWords || [])
        .map((item: any) => item.word)
        .filter(Boolean);

      // -----------------------------
      // APPLY FIX HERE
      // -----------------------------
      const seed = seedFromString(matchId || '');
      const shuffled = shuffleArray(words, seed);

      setWordList(shuffled.slice(0, 20));
    };

    initMatch();

    const sub = supabase
      .channel(`live_match_${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => {
          setMatch(payload.new);

          const { my, opponent } = extractScores(payload.new);
          setMyScore(my);
          setOpponentScore(opponent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [matchId, userId]);

  const currentWord = wordList[round] || '';

  // -----------------------------
  // GAME LOGIC (UNCHANGED)
  // -----------------------------
  const handleChoice = async (choice: 'seen' | 'new') => {
    if (!match || gameOver || waitingForOpponent) return;

    const alreadySeen = seenWords.has(currentWord);
    const isCorrect =
      (choice === 'seen' && alreadySeen) ||
      (choice === 'new' && !alreadySeen);

    const nextSeen = new Set(seenWords);
    nextSeen.add(currentWord);
    setSeenWords(nextSeen);

    if (!isCorrect) {
      setGameOver(true);
      setWaitingForOpponent(true);
      return;
    }

    const updatedScore = myScore + 1;
    setMyScore(updatedScore);

    const isP1 = match.player1_id === userId;
    const update = isP1
      ? { player1_score: updatedScore }
      : { player2_score: updatedScore };

    await supabase.from('matches').update(update).eq('id', matchId);

    if (round >= 19) {
      setGameOver(true);
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
        <button onClick={() => handleChoice('seen')} disabled={waitingForOpponent}>
          SEEN
        </button>
        <button onClick={() => handleChoice('new')} disabled={waitingForOpponent}>
          NEW
        </button>
      </div>

      {waitingForOpponent && (
        <div className="waiting-text">Waiting for opponent...</div>
      )}
    </div>
  );
};

export default OneVsOne;
