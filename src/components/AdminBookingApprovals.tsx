import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Check, X, Building2 } from 'lucide-react';

export default function AdminBookingApprovals() {
  const { getAllPendingBookings, updateBookingStatus } = useData();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const pendingBookings = getAllPendingBookings();

  const handleReject = (id: string) => {
    if (!reason.trim()) return;
    updateBookingStatus(id, 'Rejected', reason);
    setRejectId(null);
    setReason('');
  };

  if (pendingBookings.length === 0) {
    return (
      <div className="bg-thames-card p-12 rounded-xl border border-white/5 text-center text-white/30 italic">
        No pending booking requests across the system.
      </div>
    );
  }

  return (
    <div className="bg-thames-card rounded-xl border border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5">
        <h2 className="font-bold text-xs uppercase tracking-widest text-thames-gold">System-Wide Requests (Admin Override)</h2>
      </div>
      <div className="divide-y divide-white/5">
        {pendingBookings.map(booking => (
          <div key={booking.id} className="p-6 hover:bg-white/5 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white">{booking.userName}</p>
                  <span className="text-white/20">•</span>
                  <div className="flex items-center gap-1 text-[10px] text-thames-gold bg-thames-gold/10 px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                    <Building2 size={10} />
                    {booking.userDepartment}
                  </div>
                </div>
                <div className="text-sm text-white/50 mt-1">
                  {booking.facility} • {booking.date} • {booking.timeSlot}
                </div>
              </div>
              
              {rejectId === booking.id ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Reason for rejection..." 
                    className="text-sm bg-thames-bg border border-white/10 rounded-lg px-3 py-2 w-48 text-white placeholder-white/30 focus:border-thames-gold outline-none"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                  />
                  <button 
                    onClick={() => handleReject(booking.id)}
                    className="text-xs bg-red-500 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-widest hover:bg-red-600 transition-all"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => setRejectId(null)}
                    className="text-xs text-white/50 px-2 hover:text-white uppercase font-bold tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateBookingStatus(booking.id, 'Approved')}
                    className="px-4 py-2 bg-thames-gold text-thames-bg text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-thames-gold/90 transition-all shadow-lg shadow-thames-gold/10"
                  >
                    Direct Approve
                  </button>
                  <button 
                    onClick={() => setRejectId(booking.id)}
                    className="px-4 py-2 bg-white/5 text-white/70 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
