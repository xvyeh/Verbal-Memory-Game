import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface GameProps {
  user: any;
}

const Game: React.FC<GameProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');

  const fetchNewWord = async () => {
    setLoading(true);
    try {
      // This trick gets 1 random word from the table
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .limit(1)
        .single(); // You can add logic for 'order by random()' via an RPC if needed

      if (data) setCurrentWord(data.word);
    } catch (error) {
      console.error('Failed to fetch word', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewWord();
  }, []);

  return (
    <div className="game">
      <h2>Verbal Memory Game</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Current Word: {currentWord}</p>
          <button onClick={fetchNewWord}>New Word</button>
        </div>
      )}
    </div>
  );
};

export default Game;
