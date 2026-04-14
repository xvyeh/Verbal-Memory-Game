import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username } // Stores username in user metadata
      }
    });

    if (authError) {
      setError(authError.message);
    } else {
      // Create the public profile entry for ELO and Leaderboard
      await supabase.from('profiles').insert([
        { id: data.user?.id, username: username, elo: 1000 }
      ]);
      navigate('/lobby');
    }
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;