import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { User } from '../types';
import './Game.css';

interface GameProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

interface WordHistory {
  word: string;
  seen: boolean;
}

const Game: React.FC<GameProps> = ({ user, setUser }) => {
  const [currentWord, setCurrentWord] = useState<string>('');
  const [seenWords, setSeenWords] = useState<Map<string, boolean>>(new Map());
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [gameFinished, setGameFinished] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'correct' | 'wrong' | ''>('');
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const nextWordTimeout = useRef<NodeJS.Timeout>();

  const fetchNewWord = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/words');
      setCurrentWord(response.data.word);
    } catch (error) {
      console.error('Failed to fetch word', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewWord();
    return () => {
      if (nextWordTimeout.current) clearTimeout(nextWordTimeout.current);
    };
  }, []);

  const showMessage = (text: string, type: 'correct' | 'wrong') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 800);
  };

  const handleAnswer = (answer: 'seen' | 'new') => {
    if (!gameActive || !currentWord) return;

    const isSeen = seenWords.has(currentWord);
    let isCorrect = false;

    if (answer === 'seen' && isSeen) {
      isCorrect = true;
    } else if (answer === 'new' && !isSeen) {
      isCorrect = true;
    }

    if (isCorrect) {
      // Correct answer
      if (!seenWords.has(currentWord)) {
        seenWords.set(currentWord, true);
      }
      setScore(prev => prev + 1);
      setCorrectCount(prev => prev + 1);
      showMessage('✓ Correct!', 'correct');
    } else {
      // Wrong answer - game over
      setWrongCount(prev => prev + 1);
      showMessage(`✗ Wrong! The word "${currentWord}" was ${isSeen ? 'seen before' : 'new'}`, 'wrong');
      setGameActive(false);
      setGameFinished(true);
      
      // Save game result
      const duration = Math.floor((Date.now() - startTime) / 1000);
      axios.post('/api/games', {
        score: score + 1,
        correct_answers: correctCount + 1,
        wrong_answers: wrongCount + 1,
        duration_seconds: duration,
      }).then(() => {
        // Refresh user data
        axios.get('/api/user').then(res => setUser(res.data));
      });
      return;
    }

    // Get next word after short delay
    nextWordTimeout.current = setTimeout(() => {
      fetchNewWord();
    }, 300);
  };

  const resetGame = () => {
    setSeenWords(new Map());
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setGameActive(true);
    setGameFinished(false);
    setMessage('');
    setMessageType('');
    fetchNewWord();
  };

  if (gameFinished) {
    return (
      <div className="game-container">
        <div className="game-over-card">
          <h2>Game Over!</h2>
          <div className="final-score">Final Score: {score}</div>
          <div className="stats">
            <div>✅ Correct: {correctCount}</div>
            <div>❌ Wrong: {wrongCount}</div>
            <div>📊 Accuracy: {Math.round((correctCount / (correctCount + wrongCount)) * 100)}%</div>
          </div>
          <button onClick={resetGame} className="play-again-btn">Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="score">Score: {score}</div>
        <div className="stats-info">
          <span className="correct">✓ {correctCount}</span>
          <span className="wrong">✗ {wrongCount}</span>
        </div>
      </div>
      
      <div className="word-card">
        {loading ? (
          <div className="loading-word">Loading...</div>
        ) : (
          <div className="current-word">{currentWord}</div>
        )}
      </div>
      
      <div className="button-group">
        <button 
          onClick={() => handleAnswer('seen')} 
          className="seen-btn"
          disabled={!gameActive || loading}
        >
          SEEN
        </button>
        <button 
          onClick={() => handleAnswer('new')} 
          className="new-btn"
          disabled={!gameActive || loading}
        >
          NEW
        </button>
      </div>
      
      {message && (
        <div className={`feedback-message ${messageType}`}>
          {message}
        </div>
      )}
      
      <div className="game-tip">
        <p>Has this word appeared before? Click SEEN if yes, NEW if this is the first time.</p>
        <p className="small-tip">Game ends when you make a mistake!</p>
      </div>
    </div>
  );
};

export default Game;
