import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Check, X } from 'lucide-react';

export default function PendingApprovals() {
  const { getPendingUsers, updateUserStatus } = useData();
  const pendingUsers = getPendingUsers();

  if (pendingUsers.length === 0) {
    return (
      <div className="bg-thames-card p-6 rounded-xl border-2 border-thames-gold text-center text-white/50">
        No pending user approvals.
      </div>
    );
  }

  return (
    <div className="bg-thames-card rounded-xl border-2 border-thames-gold overflow-hidden">
      <div className="px-6 py-4 border-b-2 border-thames-gold">
        <h2 className="font-medium text-thames-gold">Pending User Approvals</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-thames-bg text-white/50 font-medium">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pendingUsers.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{user.fullName}</div>
                  <div className="text-xs text-white/50">{user.email}</div>
                </td>
                <td className="px-6 py-4 text-white/80">{user.department}</td>
                <td className="px-6 py-4 text-white/80">{user.jobTitle}</td>
                <td className="px-6 py-4 text-white/80">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => updateUserStatus(user.id, 'Active')}
                      className="p-1.5 bg-thames-gold/20 text-thames-gold rounded-lg hover:bg-thames-gold/30 transition-colors"
                      title="Approve"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => updateUserStatus(user.id, 'Rejected')}
                      className="p-1.5 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
