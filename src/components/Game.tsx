import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface GameProps {
  user: any;
}

const TOTAL_ROUNDS = 20;

const Game: React.FC<GameProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [wordList, setWordList] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const loadWords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('words')
        .select('word');
      if (error) throw error;
      const words = (data || []).map((item: any) => item.word).filter(Boolean);
      if (!words.length) {
        setResultMessage('No words available in the database.');
        setGameOver(true);
        return;
      }
      const randomWords = Array.from({ length: TOTAL_ROUNDS }, () => {
        const index = Math.floor(Math.random() * words.length);
        return words[index];
      });
      setWordList(randomWords);
      setRound(0);
      setScore(0);
      setGameOver(false);
      setResultMessage('');
    } catch (error) {
      console.error('Failed to load words', error);
      setResultMessage('Unable to load words. Please try again later.');
      setGameOver(true);
    } finally {
      setLoading(false);
    }
  };

  const saveGameResult = async (finalScore: number, wrongAnswers: number) => {
    await supabase.from('game_results').insert({
      user_id: user.id,
      score: finalScore,
      correct_answers: finalScore,
      wrong_answers: wrongAnswers,
      duration_seconds: 0,
      played_at: new Date().toISOString()
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('best_score, games_played')
      .eq('id', user.id)
      .single();

    const updates: any = {
      games_played: (profile?.games_played || 0) + 1,
    };
    if (finalScore > (profile?.best_score || 0)) {
      updates.best_score = finalScore;
    }

    await supabase.from('profiles').update(updates).eq('id', user.id);
  };

  const endGame = async (message: string, wrongAnswers: number) => {
    setGameOver(true);
    setResultMessage(message);
    await saveGameResult(score, wrongAnswers);
  };

  const handleChoice = async (choice: 'seen' | 'new') => {
    if (!wordList.length || gameOver) return;

    const currentWord = wordList[round];
    const isSeen = wordList.slice(0, round).includes(currentWord);
    const isCorrect = (choice === 'seen' && isSeen) || (choice === 'new' && !isSeen);

    if (!isCorrect) {
      await endGame('Wrong answer! Game over.', 1);
      return;
    }

    setScore(prev => prev + 1);

    if (round + 1 >= wordList.length) {
      await endGame('Perfect run! Game complete.', 0);
      return;
    }

    setRound(prev => prev + 1);
  };

  const startNewGame = async () => {
    await loadWords();
  };

  useEffect(() => {
    loadWords();
  }, []);

  const currentWord = wordList[round] || '';

  return (
    <div className="game">
      <h2>Verbal Memory Game</h2>
      {loading ? (
        <p>Loading...</p>
      ) : gameOver ? (
        <div>
          <p>{resultMessage}</p>
          <p>Final Score: {score}/{TOTAL_ROUNDS}</p>
          <button onClick={startNewGame}>Play Again</button>
        </div>
      ) : (
        <>
          <div className="score">Score: {score}</div>
          <div className="round">Round: {round + 1}/{TOTAL_ROUNDS}</div>
          <div className="word-display">{currentWord}</div>
          <div className="buttons">
            <button className="seen-btn" onClick={() => handleChoice('seen')}>SEEN</button>
            <button className="new-btn" onClick={() => handleChoice('new')}>NEW</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Game;
