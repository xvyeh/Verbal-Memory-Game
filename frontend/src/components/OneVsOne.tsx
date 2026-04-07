import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Friend {
  id: number;
  username: string;
}

interface Match {
  id: number;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  status: 'pending' | 'active' | 'completed';
  winner_name?: string;
}

const OneVsOne: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [matchWords, setMatchWords] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchPendingMatches();
    const interval = setInterval(() => {
      if (activeMatch) checkMatchStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [activeMatch]);

  const fetchFriends = async () => {
    const res = await axios.get('/api/friends');
    setFriends(res.data);
  };

  const fetchPendingMatches = async () => {
    const res = await axios.get('/api/matches/pending');
    setPendingMatches(res.data);
  };

  const sendChallenge = async (friendId: number) => {
    await axios.post('/api/matches/invite', { friendId });
    alert('Challenge sent!');
  };

  const acceptChallenge = async (matchId: number) => {
    const res = await axios.post(`/api/matches/${matchId}/accept`);
    setMatchWords(res.data.words.map((w: any) => w.word));
    setActiveMatch(pendingMatches.find(m => m.id === matchId) || null);
    setCurrentRound(1);
    setSeenWords(new Set());
    setWaitingForOpponent(true);
  };

  const submitAnswer = async (answer: 'seen' | 'new') => {
    const currentWord = matchWords[currentRound - 1];
    const isSeen = seenWords.has(currentWord);
    
    const res = await axios.post(`/api/matches/${activeMatch?.id}/answer`, {
      roundNumber: currentRound,
      word: currentWord,
      answer,
    });
    
    if (answer === 'new' && !isSeen) {
      setSeenWords(prev => new Set(prev).add(currentWord));
    }
    
    if (res.data.matchComplete) {
      alert(res.data.winnerId === parseInt(localStorage.getItem('userId') || '0') 
        ? '🎉 You won the match!' : '😢 You lost!');
      setActiveMatch(null);
    } else {
      setCurrentRound(prev => prev + 1);
    }
  };

  const checkMatchStatus = async () => {
    if (!activeMatch) return;
    const res = await axios.get(`/api/matches/${activeMatch.id}/status`);
    if (res.data.status === 'completed') {
      setActiveMatch(null);
      alert(`Match over! Winner: ${res.data.winner_name}`);
    }
  };

  return (
    <div className="onevsone-container">
      <h2>⚔️ 1v1 Mode</h2>
      
      <div className="friends-list">
        <h3>Challenge a Friend</h3>
        {friends.map(friend => (
          <button key={friend.id} onClick={() => sendChallenge(friend.id)}>
            Challenge {friend.username}
          </button>
        ))}
      </div>
      
      <div className="pending-matches">
        <h3>Pending Challenges</h3>
        {pendingMatches.map(match => (
          <div key={match.id}>
            {match.player1_name} challenged you!
            <button onClick={() => acceptChallenge(match.id)}>Accept</button>
          </div>
        ))}
      </div>
      
      {activeMatch && matchWords.length > 0 && (
        <div className="match-game">
          <div className="score-board">
            You: {activeMatch.player1_score} - {activeMatch.player2_score} :Opponent
          </div>
          {waitingForOpponent ? (
            <div>Waiting for opponent to finish...</div>
          ) : (
            <>
              <div className="match-word">{matchWords[currentRound - 1]}</div>
              <div className="round-info">Round {currentRound} / 10</div>
              <div className="buttons">
                <button onClick={() => submitAnswer('seen')}>SEEN</button>
                <button onClick={() => submitAnswer('new')}>NEW</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OneVsOne;
