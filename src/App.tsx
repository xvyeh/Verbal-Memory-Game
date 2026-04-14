import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Login from './components/Login';
import Register from './components/Register';
import Game from './components/Game';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import Lobby from './components/Lobby';
import OneVsOne from './components/OneVsOne';
import Docs from './components/Docs';
import './App.css';

const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <HashRouter>
      <nav className="navbar">
        <div className="nav-brand">🧠 Verbal Memory</div>

        <div className="nav-links">
          {user ? (
            <>
              <Link to="/lobby">1v1 Arena</Link>
              <Link to="/game">Solo Play</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/lobby" /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/lobby" /> : <Register />}
        />
        <Route
          path="/lobby"
          element={user ? <Lobby userId={user.id} /> : <Navigate to="/login" />}
        />
        <Route
          path="/1v1/:matchId"
          element={user ? <OneVsOne userId={user.id} /> : <Navigate to="/login" />}
        />
        <Route
          path="/game"
          element={user ? <Game user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile userId={user.id} /> : <Navigate to="/login" />}
        />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/docs" element={<Docs />} />
        <Route
          path="/"
          element={<Navigate to={user ? "/lobby" : "/login"} />}
        />
      </Routes>
    </HashRouter>
  );
};

export default App;