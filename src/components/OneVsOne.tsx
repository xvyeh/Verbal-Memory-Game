import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Match status flow:
// 'active'       → both players still playing
// 'player1_done' → player1 finished (wrong answer or completed all rounds)
// 'player2_done' → player2 finished
// 'completed'    → both done, winner decided

const OneVsOne: React.FC<{ userId: string }> = ({ userId }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [wordList, setWordList] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false); // prevent double-finalize

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

  const isPlayer1 = (matchData: any) => matchData?.player1_id === userId;

  const extractScores = (matchData: any) => {
    if (!matchData) return { my: 0, opponent: 0 };
    const p1 = isPlayer1(matchData);
    return {
      my: p1 ? matchData.player1_score ?? 0 : matchData.player2_score ?? 0,
      opponent: p1 ? matchData.player2_score ?? 0 : matchData.player1_score ?? 0,
    };
  };

  // ─── Finalize: update ELO and navigate ───────────────────────────────────
  const finalizeMatch = async (myFinal: number, oppFinal: number, matchData: any) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);

    const p1 = isPlayer1(matchData);
    const myId = userId;
    const oppId = p1 ? matchData.player2_id : matchData.player1_id;

    const winnerId =
      myFinal > oppFinal ? myId :
      oppFinal > myFinal ? oppId :
      null; // tie

    // Only one player should write 'completed' + winner — use a guard
    await supabase
      .from('matches')
      .update({ status: 'completed', winner_id: winnerId })
      .eq('id', matchId)
      .neq('status', 'completed'); // idempotency guard

    // ELO
    if (winnerId) {
      const loserId = winnerId === myId ? oppId : myId;
      const [{ data: winnerProfile }, { data: loserProfile }] = await Promise.all([
        supabase.from('profiles').select('elo').eq('id', winnerId).single(),
        supabase.from('profiles').select('elo').eq('id', loserId).single(),
      ]);
      if (winnerProfile && loserProfile) {
        await Promise.all([
          supabase.from('profiles').update({ elo: (winnerProfile.elo || 1000) + 25 }).eq('id', winnerId),
          supabase.from('profiles').update({ elo: Math.max(0, (loserProfile.elo || 1000) - 25) }).eq('id', loserId),
        ]);
      }
    }

    const resultText =
      myFinal === oppFinal
        ? `Tie! Both scored ${myFinal}`
        : myFinal > oppFinal
          ? `You won! ${myFinal} vs ${oppFinal} (+25 ELO)`
          : `You lost. ${myFinal} vs ${oppFinal} (-25 ELO)`;

    alert(resultText);
    navigate('/leaderboard');
  };

  // ─── Submit this player's final score ────────────────────────────────────
  const submitMyScore = async (finalScore: number) => {
    if (gameOverRef.current) return;

    // Fetch the freshest match state
    const { data: fresh } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    if (!fresh) return;

    const p1 = isPlayer1(fresh);
    const myDoneStatus = p1 ? 'player1_done' : 'player2_done';
    const oppDoneStatus = p1 ? 'player2_done' : 'player1_done';
    const myScoreField = p1 ? 'player1_score' : 'player2_score';
    const oppScoreField = p1 ? 'player2_score' : 'player1_score';

    const opponentAlreadyDone =
      fresh.status === oppDoneStatus || fresh.status === 'completed';

    if (opponentAlreadyDone) {
      // Opponent finished first — we are second; finalize now
      const oppFinal = fresh[oppScoreField] ?? 0;
      await supabase
        .from('matches')
        .update({ [myScoreField]: finalScore, status: 'completed' })
        .eq('id', matchId);
      await finalizeMatch(finalScore, oppFinal, { ...fresh, [myScoreField]: finalScore });
    } else {
      // We finished first — wait for opponent
      await supabase
        .from('matches')
        .update({ [myScoreField]: finalScore, status: myDoneStatus })
        .eq('id', matchId);
      setWaitingForOpponent(true);
    }
  };

  // ─── Init ─────────────────────────────────────────────────────────────────
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

    // Real-time: watch for opponent finishing
    const sub = supabase
      .channel(`live_match_${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        async (payload) => {
          const updated = payload.new as any;
          setMatch(updated);
          const { my, opponent } = extractScores(updated);
          setOpponentScore(opponent);

          // If we're waiting and opponent just finished → finalize
          if (
            waitingForOpponent &&
            !gameOverRef.current &&
            (updated.status === 'player1_done' || updated.status === 'player2_done' || updated.status === 'completed')
          ) {
            // Both are now done
            const p1 = isPlayer1(updated);
            const myFinal = p1 ? updated.player1_score ?? 0 : updated.player2_score ?? 0;
            const oppFinal = p1 ? updated.player2_score ?? 0 : updated.player1_score ?? 0;
            await finalizeMatch(myFinal, oppFinal, updated);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [matchId, userId]);

  // Need waitingForOpponent in the subscription closure — re-subscribe when it changes
  useEffect(() => {
    if (!waitingForOpponent || !matchId) return;

    // Check once immediately in case opponent already finished while we were submitting
    const checkNow = async () => {
      const { data: fresh } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (!fresh || gameOverRef.current) return;
      const p1 = isPlayer1(fresh);
      const oppDoneStatus = p1 ? 'player2_done' : 'player1_done';
      if (fresh.status === oppDoneStatus || fresh.status === 'completed') {
        const myFinal = p1 ? fresh.player1_score ?? 0 : fresh.player2_score ?? 0;
        const oppFinal = p1 ? fresh.player2_score ?? 0 : fresh.player1_score ?? 0;
        await finalizeMatch(myFinal, oppFinal, fresh);
      }
    };
    checkNow();

    // Also poll every 3s as a fallback for missed realtime events
    const interval = setInterval(checkNow, 3000);
    return () => clearInterval(interval);
  }, [waitingForOpponent, matchId]);

  // ─── Game input ───────────────────────────────────────────────────────────
  const handleChoice = async (choice: 'seen' | 'new') => {
    if (!match || gameOverRef.current || waitingForOpponent) return;

    const currentWord = wordList[round];
    const alreadySeen = seenWords.has(currentWord);
    const isCorrect =
      (choice === 'seen' && alreadySeen) || (choice === 'new' && !alreadySeen);

    const nextSeen = new Set(seenWords);
    nextSeen.add(currentWord);
    setSeenWords(nextSeen);

    if (!isCorrect) {
      // Wrong answer → player is done with current score
      await submitMyScore(myScore);
      return;
    }

    const updatedScore = myScore + 1;
    setMyScore(updatedScore);

    // Keep opponent's live score visible (optimistic update to DB)
    const p1 = isPlayer1(match);
    await supabase
      .from('matches')
      .update(p1 ? { player1_score: updatedScore } : { player2_score: updatedScore })
      .eq('id', matchId);

    if (round >= 19) {
      // Completed all rounds
      await submitMyScore(updatedScore);
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
      <h1 className="word-display">{wordList[round] || ''}</h1>
      <div className="controls">
        <button onClick={() => handleChoice('seen')} disabled={waitingForOpponent || gameOver}>
          SEEN
        </button>
        <button onClick={() => handleChoice('new')} disabled={waitingForOpponent || gameOver}>
          NEW
        </button>
      </div>
      {waitingForOpponent && (
        <div className="waiting-text">You're done! Waiting for opponent to finish...</div>
      )}
    </div>
  );
};

export default OneVsOne;
