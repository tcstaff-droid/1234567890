import React, { useState } from 'react';
import { useData, User, Role } from '../context/DataContext';
import { Shield, UserCog, Search, Check, X } from 'lucide-react';

export default function UserManagement() {
  const { users, updateUserProfile } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('Staff');

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setSelectedRole(user.role);
  };

  const saveEdit = (userId: string) => {
    updateUserProfile(userId, { role: selectedRole });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="bg-thames-card rounded-xl border-2 border-thames-gold overflow-hidden">
      <div className="px-6 py-4 border-b-2 border-thames-gold flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-medium text-thames-gold flex items-center gap-2">
          <UserCog size={20} />
          User Management
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="bg-thames-bg border-2 border-thames-gold rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:border-thames-gold outline-none w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-white font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-white">{user.fullName}</div>
                    <div className="text-xs text-white/50">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">{user.department}</td>
                <td className="px-6 py-4">
                  {editingId === user.id ? (
                    <select 
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="bg-thames-bg border-2 border-thames-gold rounded px-2 py-1 text-white focus:border-thames-gold outline-none"
                    >
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.role === 'Admin' || user.role === 'Owner' ? 'bg-thames-gold/20 text-thames-gold border-thames-gold/20' :
                      user.role === 'Manager' ? 'bg-thames-gold/10 text-thames-gold/80 border-thames-gold/10' :
                      'bg-white/10 text-white/50 border-white/10'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    user.status === 'Active' ? 'bg-thames-gold/20 text-thames-gold border-thames-gold/20' :
                    user.status === 'Pending' ? 'bg-white/10 text-white border-white/20' :
                    'bg-black/40 text-white border-white/10'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === user.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => saveEdit(user.id)}
                        className="p-1 text-thames-gold hover:bg-thames-gold/20 rounded"
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={cancelEdit}
                        className="p-1 text-white hover:bg-white/10 rounded"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEdit(user)}
                      className="text-thames-gold hover:text-white transition-colors text-xs font-medium"
                    >
                      Edit Role
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
