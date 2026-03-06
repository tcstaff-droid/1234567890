import React from 'react';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, Download, CalendarPlus } from 'lucide-react';

export default function MyBookings() {
  const { currentUser, getBookingsForUser } = useData();
  
  if (!currentUser) return null;

  const bookings = getBookingsForUser(currentUser.id).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const downloadICS = (booking: any) => {
    const [start, end] = booking.timeSlot.split(' - ');
    const date = booking.date.replace(/-/g, '');
    const startTime = start.replace(':', '') + '00';
    const endTime = end.replace(':', '') + '00';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${date}T${startTime}`,
      `DTEND:${date}T${endTime}`,
      `SUMMARY:Thames City ${booking.facility} Booking`,
      `DESCRIPTION:Your approved booking for the ${booking.facility} at Thames City.`,
      'LOCATION:Thames City Staff Facilities',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `thames_booking_${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-thames-card rounded-xl border-2 border-thames-gold overflow-hidden flex flex-col h-[600px]">
      <div className="px-6 py-4 border-b-2 border-thames-gold flex-shrink-0 bg-thames-card z-10">
        <h2 className="font-medium text-thames-gold flex items-center gap-2 uppercase tracking-widest text-sm">
          <Calendar size={18} />
          Booking History
        </h2>
      </div>
      
      <div className="overflow-y-auto flex-1 p-4 custom-scrollbar bg-black/20">
        {bookings.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
            <Calendar size={48} className="opacity-10" />
            <p className="uppercase text-[10px] font-bold tracking-widest">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="p-5 bg-thames-bg border-2 border-white/5 rounded-xl hover:border-thames-gold/50 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-white uppercase tracking-wider">{booking.facility}</span>
                      {booking.isRecurring && (
                        <span className="text-[8px] bg-thames-gold text-thames-bg px-1.5 py-0.5 rounded font-bold uppercase">Recurring</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-thames-gold" />
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-thames-gold" />
                        <span>{booking.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge status={booking.status} />
                    
                    {booking.status === 'Approved' && (
                      <button 
                        onClick={() => downloadICS(booking)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-thames-gold hover:text-white transition-colors uppercase tracking-widest border border-thames-gold/20 px-2 py-1 rounded hover:bg-thames-gold/10"
                      >
                        <CalendarPlus size={12} />
                        Add to Calendar
                      </button>
                    )}

                    {booking.status === 'Rejected' && booking.rejectionReason && (
                      <div className="text-right">
                        <p className="text-[10px] text-red-400 font-bold uppercase max-w-[150px] leading-tight">
                          {booking.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Pending: "bg-white/10 text-white border-white/20",
    Approved: "bg-thames-gold/20 text-thames-gold border-thames-gold/20",
    Rejected: "bg-black/40 text-white border-white/10",
    "Auto-cancelled": "bg-white/5 text-white/40 border-white/10"
  };

  const icons = {
    Pending: AlertCircle,
    Approved: CheckCircle,
    Rejected: XCircle,
    "Auto-cancelled": Clock
  };

  const Icon = icons[status as keyof typeof icons] || Clock;

  return (
    <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", styles[status as keyof typeof styles])}>
      <Icon size={12} />
      {status}
    </span>
  );
}
