import React from 'react';
import { useData } from '../context/DataContext';
import MyBookings from '../components/MyBookings';
import { Calendar } from 'lucide-react';

export default function MyBookingsPage() {
  const { currentUser } = useData();

  if (!currentUser) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-white">My Bookings</h1>
          <p className="text-thames-header mt-1">View and manage your facility reservations</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-thames-gold bg-thames-gold/10 px-4 py-2 rounded-full border border-thames-gold/20">
          <Calendar size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">History & Upcoming</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <MyBookings />
      </div>
    </div>
  );
}
