import React, { useState } from 'react';
import { useData, FacilityType } from '../context/DataContext';
import { Calendar, Users, Droplets, Dumbbell, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import IssueReportModal from '../components/IssueReportModal';

const GYM_CAPACITY = 10;
const POOL_CAPACITY = 10;

const GYM_SLOTS_WEEKDAY = ['6am - 7am', '7am - 8am', '8am - 9am'];
const GYM_SLOTS_WEEKEND = ['8am - 9am', '9am - 10am'];
const POOL_SLOT_WEEKDAY = ['10am - 1pm'];
const POOL_SLOT_WEEKEND = ['8:30am - 12pm'];

export default function CapacityView() {
  const { bookings, waitlist, issues } = useData();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityType>('Gym');

  // Generate next 14 days for selection
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const getSlotsForDate = (date: string, facility: FacilityType) => {
    const dayOfWeek = new Date(date).getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (facility === 'Gym') {
      return isWeekend ? GYM_SLOTS_WEEKEND : GYM_SLOTS_WEEKDAY;
    } else {
      return isWeekend ? POOL_SLOT_WEEKEND : POOL_SLOT_WEEKDAY;
    }
  };

  const mapDisplaySlotToDataSlot = (displaySlot: string, facility: FacilityType, isWeekend: boolean) => {
    if (facility === 'Gym') {
      if (displaySlot === '6am - 7am') return '06:00 - 07:00';
      if (displaySlot === '7am - 8am') return '07:00 - 08:00';
      if (displaySlot === '8am - 9am') return '08:00 - 09:00';
      if (displaySlot === '9am - 10am') return '09:00 - 10:00';
    } else {
      if (displaySlot === '10am - 1pm') return '10:00 - 13:00';
      if (displaySlot === '8:30am - 12pm') return '08:30 - 12:00';
    }
    return displaySlot;
  };

  const getCapacity = (facility: FacilityType) => {
    return facility === 'Gym' ? GYM_CAPACITY : POOL_CAPACITY;
  };

  const getCounts = (date: string, displaySlot: string, facility: FacilityType) => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dataSlot = mapDisplaySlotToDataSlot(displaySlot, facility, isWeekend);

    const booked = bookings.filter(b => 
      b.facility === facility && 
      b.date === date && 
      b.timeSlot === dataSlot && 
      b.status !== 'Rejected' && 
      b.status !== 'Auto-cancelled'
    ).length;

    const waitlisted = waitlist.filter(w => 
      w.facility === facility && 
      w.date === date && 
      w.timeSlot === dataSlot
    ).length;

    return { booked, waitlisted };
  };

  const handleReportIssue = (facility: FacilityType) => {
    setSelectedFacility(facility);
    setIsIssueModalOpen(true);
  };

  const renderFacilitySection = (facility: FacilityType, icon: React.ReactNode) => {
    const slots = getSlotsForDate(selectedDate, facility);
    const capacity = getCapacity(facility);
    const facilityIssues = issues.filter(i => i.facility === facility && i.status === 'Open');

    return (
      <div className="bg-thames-card border-2 border-thames-gold rounded-xl p-6 shadow-lg mb-8 relative overflow-hidden">
        {facilityIssues.length > 0 && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 flex items-center gap-1">
            <AlertTriangle size={10} />
            {facilityIssues.length} ACTIVE ISSUE{facilityIssues.length > 1 ? 'S' : ''}
          </div>
        )}

        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-thames-gold/10 text-thames-gold rounded-full flex items-center justify-center">
              {icon}
            </div>
            <h2 className="text-xl font-light text-white">{facility} Capacity</h2>
          </div>
          <button 
            onClick={() => handleReportIssue(facility)}
            className="text-xs font-bold text-thames-gold hover:text-white transition-colors flex items-center gap-1 border border-thames-gold/30 px-3 py-1.5 rounded-lg hover:bg-thames-gold/10"
          >
            <AlertTriangle size={14} />
            REPORT ISSUE
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map(slot => {
            const { booked, waitlisted } = getCounts(selectedDate, slot, facility);
            const remaining = Math.max(0, capacity - booked);
            const percentage = (booked / capacity) * 100;
            
            let statusColor = "bg-emerald-500";
            if (percentage >= 100) statusColor = "bg-red-500";
            else if (percentage >= 80) statusColor = "bg-yellow-500";

            return (
              <div key={slot} className="bg-thames-bg border border-white/10 rounded-lg p-4 hover:border-thames-gold/50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-lg text-white">{slot}</span>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full mb-1",
                      remaining === 0 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                    )}>
                      {remaining === 0 ? "FULL" : `${remaining} LEFT`}
                    </span>
                    {waitlisted > 0 && (
                      <span className="text-[10px] text-yellow-500 font-bold uppercase">
                        {waitlisted} on waitlist
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="w-full bg-black/50 rounded-full h-2 mb-2 overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", statusColor)} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-white/50">
                  <span>{booked} booked</span>
                  <span>Max {capacity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <IssueReportModal 
        isOpen={isIssueModalOpen} 
        onClose={() => setIsIssueModalOpen(false)} 
        facility={selectedFacility} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Facility Capacity</h1>
          <p className="text-white/50">Check availability and report equipment issues</p>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-thames-card border border-white/10 rounded-xl p-4 mb-8 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {dates.map(date => {
            const d = new Date(date);
            const isSelected = selectedDate === date;
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-20 rounded-lg border transition-all",
                  isSelected 
                    ? "bg-thames-gold text-black border-thames-gold shadow-lg scale-105" 
                    : "bg-thames-bg text-white/70 border-white/10 hover:border-thames-gold/50 hover:text-white"
                )}
              >
                <span className="text-xs uppercase font-medium">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                <span className="text-xl font-bold">{d.getDate()}</span>
                {isToday && <span className="text-[10px] mt-1 font-medium">Today</span>}
              </button>
            );
          })}
        </div>
      </div>

      {renderFacilitySection('Gym', <Dumbbell size={20} />)}
      {renderFacilitySection('Pool', <Droplets size={20} />)}
    </div>
  );
}
