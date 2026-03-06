import React from 'react';
import { useData } from '../context/DataContext';
import BookingWizard from '../components/BookingWizard';
import MyBookings from '../components/MyBookings';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, Dumbbell, Waves, ArrowRight } from 'lucide-react';

export default function Home() {
  const { currentUser, bookings } = useData();

  if (!currentUser) return null;

  // Stats for the summary cards
  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const approvedToday = bookings.filter(b => b.status === 'Approved' && b.date === new Date().toISOString().split('T')[0]).length;
  const gymRequests = bookings.filter(b => b.facility === 'Gym').length;
  const poolRequests = bookings.filter(b => b.facility === 'Pool').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white">Welcome, {currentUser.fullName.split(' ')[0]}</h1>
        <p className="text-thames-header mt-1">{currentUser.role} Dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          icon={<Clock className="text-thames-header" />} 
          value={pendingCount} 
          label="Pending Requests" 
        />
        <SummaryCard 
          icon={<CheckCircle2 className="text-thames-gold" />} 
          value={approvedToday} 
          label="Approved Today" 
        />
        <SummaryCard 
          icon={<Dumbbell className="text-thames-header" />} 
          value={gymRequests} 
          label="Gym Requests" 
        />
        <SummaryCard 
          icon={<Waves className="text-thames-gold" />} 
          value={poolRequests} 
          label="Pool Requests" 
        />
      </div>

      {/* Content Area */}
      <div className="bg-thames-card rounded-xl border-2 border-thames-gold p-6 min-h-[400px]">
        
        {currentUser.role === 'Staff' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BookingWizard />
              <MyBookings />
           </div>
        )}

        {(currentUser.role === 'Manager' || currentUser.role === 'Admin' || currentUser.role === 'Owner') && (
           <div className="text-center py-12">
              <h2 className="text-2xl font-light text-white mb-4">Pending Approvals</h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                You have {pendingCount} pending booking requests requiring your attention.
              </p>
              <Link 
                to="/approvals"
                className="inline-flex items-center gap-2 bg-thames-gold text-thames-bg px-6 py-3 rounded-md font-medium hover:bg-thames-gold/90 transition-colors"
              >
                Go to Approvals <ArrowRight size={18} />
              </Link>
           </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) {
  return (
    <div className="bg-thames-card p-6 rounded-xl border-2 border-thames-gold flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-medium text-white">{value}</div>
        <div className="text-sm text-white/50">{label}</div>
      </div>
    </div>
  );
}
