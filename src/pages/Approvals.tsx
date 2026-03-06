import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import PendingApprovals from '../components/PendingApprovals';
import ManagerApprovals from '../components/ManagerApprovals';
import AdminBookingApprovals from '../components/AdminBookingApprovals';
import Reports from './Reports';
import { Clock, BarChart2, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Approvals() {
  const { currentUser } = useData();
  const [activeTab, setActiveTab] = useState<'pending' | 'reports' | 'capacity'>('pending');

  if (!currentUser || currentUser.role === 'Staff') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-white">Approvals & Reports</h1>
          <p className="text-thames-header mt-1">Manage bookings and view statistics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-thames-card/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'pending'
              ? "bg-thames-header text-thames-bg shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/5"
          )}
        >
          <Clock size={16} />
          <span>Pending Approvals</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'reports'
              ? "bg-thames-header text-thames-bg shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/5"
          )}
        >
          <BarChart2 size={16} />
          <span>Usage Reports</span>
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'capacity'
              ? "bg-thames-header text-thames-bg shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/5"
          )}
        >
          <Calendar size={16} />
          <span>Capacity View</span>
        </button>
      </div>

      <div className="bg-thames-card rounded-xl border border-white/5 p-6 min-h-[400px]">
        {activeTab === 'pending' && (
          <div className="space-y-8">
            {(currentUser.role === 'Admin' || currentUser.role === 'Owner') && (
              <>
                <AdminBookingApprovals />
                <PendingApprovals />
              </>
            )}
            {currentUser.role === 'Manager' && <ManagerApprovals />}
          </div>
        )}

        {activeTab === 'reports' && <Reports />}

        {activeTab === 'capacity' && (
           <div className="text-center py-12 text-white/50">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p>Capacity view coming soon.</p>
           </div>
        )}
      </div>
    </div>
  );
}
