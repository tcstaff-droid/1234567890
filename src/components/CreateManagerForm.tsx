import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { UserPlus, Mail, Key, Check, AlertCircle } from 'lucide-react';

export default function CreateManagerForm() {
  const { createManagerAccount } = useData();
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !tempPassword) return;

    createManagerAccount(email, tempPassword);
    setSuccess(true);
    setEmail('');
    setTempPassword('');
    
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="bg-thames-card rounded-xl border border-white/5 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-thames-gold/10 rounded-lg">
          <UserPlus className="text-thames-gold" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">Create Manager Account</h3>
          <p className="text-sm text-white/50">Set up a new manager with temporary credentials</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="bg-thames-gold/10 border border-thames-gold/20 rounded-lg p-3 flex items-center gap-2 text-thames-gold text-sm">
            <Check size={16} />
            Manager account created successfully.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-thames-gold uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-thames-bg border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:border-thames-gold outline-none transition-colors"
                placeholder="manager@thamescity.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-thames-gold uppercase tracking-wider">Temporary Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="w-full bg-thames-bg border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-white/30 focus:border-thames-gold outline-none transition-colors"
                placeholder="One-time password"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 font-medium"
          >
            <UserPlus size={18} />
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
