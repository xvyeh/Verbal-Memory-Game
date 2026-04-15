import React, { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./App.css";

/* ---------------- LOGIN ---------------- */
const Login = ({ setUser }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    else setUser(data.user);
  };

  return (
    <div className="centered-page">
      <div className="card">
        <h2>Login</h2>

        {error && <div className="error">{error}</div>}

        <input
          className="input"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn" onClick={handleLogin}>
          Login
        </button>

        <p className="link">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

/* ---------------- REGISTER ---------------- */
const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) setMsg(error.message);
    else setMsg("Check your email to confirm!");
  };

  return (
    <div className="centered-page">
      <div className="card">
        <h2>Create Account</h2>

        {msg && <div className="error">{msg}</div>}

        <input
          className="input"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn" onClick={handleRegister}>
          Register
        </button>

        <p className="link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

/* ---------------- LOBBY ---------------- */
const Lobby = () => {
  return (
    <div className="centered-page">
      <div className="card">
        <h2>1v1 Arena</h2>

        <div className="lobby-buttons">
          <button className="btn">Find Match</button>
          <button className="btn">Create Room</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- LEADERBOARD ---------------- */
const Leaderboard = () => {
  return (
    <div className="centered-page">
      <div className="card leaderboard">
        <h2>Leaderboard</h2>

        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>1</td>
              <td>Player1</td>
              <td>120</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- MAIN APP ---------------- */
const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <HashRouter>
      <nav className="navbar">
        <div className="nav-brand">🧠 Verbal Memory</div>

        <div className="nav-links">
          {user ? (
            <>
              <Link to="/lobby">Lobby</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              <button className="btn" onClick={logout}>
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
          element={
            user ? <Navigate to="/lobby" /> : <Login setUser={setUser} />
          }
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/lobby" /> : <Register />}
        />
        <Route
          path="/lobby"
          element={user ? <Lobby /> : <Navigate to="/login" />}
        />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route
          path="/"
          element={<Navigate to={user ? "/lobby" : "/login"} />}
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
