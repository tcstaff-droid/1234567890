import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Check, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ManagerApprovals() {
  const { currentUser, bookings, approveBooking, updateBookingStatus, approvalConfigs } = useData();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (!currentUser) return null;

  // Filter bookings that this manager is authorized to approve
  const pendingBookings = bookings.filter(b => {
    if (b.status !== 'Pending') return false;
    
    const config = approvalConfigs[b.userDepartment];
    
    // If specific managers are designated for this booking's department
    if (config && config.managerIds.length > 0) {
      if (!config.managerIds.includes(currentUser.id)) return false;
      // Also check if this manager has already approved
      if (b.approvals?.includes(currentUser.id)) return false;
      return true;
    }
    
    // Fallback to department-based approval (if no specific managers designated, 
    // any manager in that department can approve)
    return b.userDepartment === currentUser.department;
  });

  const handleReject = (id: string) => {
    if (!reason.trim()) return;
    updateBookingStatus(id, 'Rejected', reason);
    setRejectId(null);
    setReason('');
  };

  if (pendingBookings.length === 0) {
    return (
      <div className="bg-thames-card p-12 rounded-xl border border-white/5 text-center text-white/30 italic">
        No pending booking requests require your attention.
      </div>
    );
  }

  return (
    <div className="bg-thames-card rounded-xl border border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5">
        <h2 className="font-bold text-xs uppercase tracking-widest text-thames-gold">Booking Requests ({currentUser.department})</h2>
      </div>
      <div className="divide-y divide-white/5">
        {pendingBookings.map(booking => {
          const config = approvalConfigs[booking.userDepartment];
          const isMultiApproval = config && config.logic === 'all' && config.managerIds.length > 0;

          return (
            <div key={booking.id} className="p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{booking.userName}</p>
                    <span className="px-2 py-0.5 bg-white/5 text-[10px] text-white/50 rounded uppercase tracking-widest">{booking.userDepartment}</span>
                  </div>
                  <div className="text-sm text-white/50 mt-1">
                    {booking.facility} • {booking.date} • {booking.timeSlot}
                  </div>
                  {isMultiApproval && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="text-[10px] text-thames-gold uppercase font-bold tracking-widest">Approvals:</div>
                      <div className="flex gap-1">
                        {config.managerIds.map(mid => {
                          const hasApproved = booking.approvals?.includes(mid);
                          return (
                            <div 
                              key={mid} 
                              className={cn(
                                "w-2 h-2 rounded-full",
                                hasApproved ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-white/10"
                              )} 
                              title={hasApproved ? "Approved" : "Pending"}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                      onClick={() => approveBooking(booking.id, currentUser.id)}
                      className="px-4 py-2 bg-thames-gold text-thames-bg text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-thames-gold/90 transition-all shadow-lg shadow-thames-gold/10"
                    >
                      Approve
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
          );
        })}
      </div>
    </div>
  );
}
