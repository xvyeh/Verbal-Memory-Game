import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User } from './types';
import Login from './components/Login';
import Register from './components/Register';
import Game from './components/Game';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import Docs from './components/Docs';
import './App.css';

axios.defaults.baseURL = 'http://localhost:5000';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/user')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="nav-brand">🧠 Verbal Memory</div>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/game">Play</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              <Link to="/docs">Docs</Link>
              <span className="user-greeting">Hello, {user.username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Link to="/docs">Docs</Link>
            </>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/game" /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/game" /> : <Register setUser={setUser} />} />
        <Route path="/game" element={user ? <Game user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/" element={<Navigate to={user ? "/game" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
