import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building } from 'lucide-react';

export default function Register() {
  const { register, departments, users } = useData();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    headOfDepartment: '',
    username: '',
    password: '',
    pin: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check username uniqueness
    if (users.some(u => u.username === formData.username)) {
      setError('Username already taken');
      return;
    }

    if (formData.pin.length !== 4 || isNaN(Number(formData.pin))) {
      setError('PIN must be 4 digits');
      return;
    }

    register(formData);
    navigate('/login'); // Or show success message
  };

  return (
    <div className="min-h-screen bg-thames-bg flex items-center justify-center p-4 font-sans">
      <div className="bg-thames-card w-full max-w-[500px] rounded-lg shadow-md overflow-hidden my-8 border border-white/5">
        <div className="pt-8 pb-6 px-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-thames-bg rounded-full flex items-center justify-center mb-4 border border-white/5">
            <Building className="w-6 h-6 text-thames-gold" />
          </div>
          <h1 className="text-2xl font-bold text-thames-gold">Create Account</h1>
          <p className="text-white/50 mt-1">Join Thames City Staff Portal</p>
        </div>

        <form className="px-8 pb-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-black/40 text-white p-3 rounded-md text-sm text-center border border-white/10">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70">Full Name</label>
              <input name="fullName" onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70">Email</label>
              <input name="email" type="email" onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70">Phone</label>
              <input name="phone" onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70">Department</label>
              <select name="department" onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required>
                <option value="">Select...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70">Job Title</label>
              <input name="jobTitle" onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/70">Head of Dept</label>
              <input name="headOfDepartment" onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-white mb-3">Security Setup</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/70">Username</label>
                <input name="username" onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/70">Password</label>
                  <input name="password" type="password" onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/70">4-Digit PIN</label>
                  <input name="pin" type="password" maxLength={4} onChange={handleChange} className="w-full px-3 py-2 bg-thames-bg border border-white/10 rounded-md text-white focus:border-thames-gold outline-none" required placeholder="1234" />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-thames-gold text-thames-bg font-medium py-2.5 px-4 rounded-md hover:bg-thames-gold/90 transition-colors mt-4"
          >
            Submit for Approval
          </button>

          <div className="text-center mt-2">
            <Link to="/login" className="text-sm text-thames-gold hover:underline">
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
