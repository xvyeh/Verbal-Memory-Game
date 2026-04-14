import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface GameProps {
  user: any;
}

const Game: React.FC<GameProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const fetchNewWord = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .limit(1)
        .single();

      if (data) setCurrentWord(data.word);
    } catch (error) {
      console.error('Failed to fetch word', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choice: 'seen' | 'new') => {
    const isCorrect = (choice === 'seen' && seenWords.has(currentWord)) ||
                      (choice === 'new' && !seenWords.has(currentWord));

    if (isCorrect) {
      setScore(prev => prev + 1);
      if (choice === 'new') {
        setSeenWords(prev => new Set(prev).add(currentWord));
      }
    }

    setRound(prev => prev + 1);

    if (round >= 19) { // 20 rounds
      endGame();
    } else {
      fetchNewWord();
    }
  };

  const endGame = async () => {
    setGameOver(true);
    // Save to db
    await supabase.from('game_results').insert({
      user_id: user.id,
      score: score,
      correct_answers: score,
      wrong_answers: round - score,
      duration_seconds: 0, // TODO: add timer
      played_at: new Date().toISOString()
    });

    // Update profile
    const { data: profile } = await supabase.from('profiles').select('best_score, games_played').eq('id', user.id).single();
    const updates: any = { games_played: (profile?.games_played || 0) + 1 };
    if (score > (profile?.best_score || 0)) {
      updates.best_score = score;
    }
    await supabase.from('profiles').update(updates).eq('id', user.id);
  };

  const startNewGame = () => {
    setSeenWords(new Set());
    setScore(0);
    setRound(0);
    setGameOver(false);
    fetchNewWord();
  };

  useEffect(() => {
    fetchNewWord();
  }, []);

  if (gameOver) {
    return (
      <div className="game">
        <h2>Game Over!</h2>
        <p>Final Score: {score}/20</p>
        <button onClick={startNewGame}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="game">
      <h2>Verbal Memory Game</h2>
      <div className="score">Score: {score}</div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <div className="word-display">{currentWord}</div>
          <div className="buttons">
            <button className="seen-btn" onClick={() => handleChoice('seen')}>SEEN</button>
            <button className="new-btn" onClick={() => handleChoice('new')}>NEW</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
