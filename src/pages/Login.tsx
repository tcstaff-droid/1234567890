import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginWithPassword } = useData();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    const result = loginWithPassword(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-thames-bg flex items-center justify-center p-4 font-sans">
      <div className="bg-thames-card w-full max-w-[400px] rounded-lg shadow-md overflow-hidden border-2 border-thames-gold">
        <div className="pt-8 pb-6 px-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-thames-bg rounded-full flex items-center justify-center mb-4 border-2 border-thames-gold">
            <Building className="w-6 h-6 text-thames-gold" />
          </div>
          <h1 className="text-2xl font-bold text-thames-gold">Thames City</h1>
          <p className="text-white/50 mt-1">Staff Booking Portal</p>
        </div>

        <form className="px-8 pb-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-black/40 text-white p-3 rounded-md text-sm text-center border-2 border-thames-gold">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-thames-bg border-2 border-thames-gold rounded-md shadow-sm outline-none text-white placeholder-white/30"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-thames-bg border-2 border-thames-gold rounded-md shadow-sm outline-none text-white placeholder-white/30"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-thames-gold text-thames-bg font-bold py-3 px-4 rounded-md hover:bg-thames-gold/90 transition-all mt-2 uppercase tracking-widest text-xs shadow-lg shadow-thames-gold/10"
          >
            Log In
          </button>

          <div className="text-center mt-2">
            <Link to="/register" className="text-[10px] text-thames-gold hover:underline uppercase font-bold tracking-widest opacity-50 hover:opacity-100 transition-opacity">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
