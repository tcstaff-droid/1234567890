import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function ManagerSetupModal() {
  const { currentUser, completeManagerSetup } = useData();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!currentUser || !currentUser.requiresSetup) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    completeManagerSetup(currentUser.id, { password, fullName });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-thames-card border-2 border-thames-gold rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-white mb-2">Welcome to Thames City</h2>
          <p className="text-white/50">Please complete your account setup to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-black/40 border-2 border-thames-gold rounded-lg p-3 flex items-center gap-2 text-white text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-thames-gold uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-thames-bg border-2 border-thames-gold rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-thames-gold outline-none transition-colors"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-thames-gold uppercase tracking-wider">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-thames-bg border-2 border-thames-gold rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-thames-gold outline-none transition-colors pr-10"
                placeholder="Create a new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-thames-gold uppercase tracking-wider">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-thames-bg border-2 border-thames-gold rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-thames-gold outline-none transition-colors"
              placeholder="Confirm your new password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-thames-gold text-black font-medium py-3 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            Complete Setup
            <Check size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
