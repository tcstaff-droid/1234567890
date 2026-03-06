import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle, AlertCircle, Clock, Dumbbell, Droplets } from 'lucide-react';
import { cn } from '../lib/utils';

const TERMS = `
1. General Rules
- All staff members must adhere to the facility guidelines.
- Bookings are personal and non-transferable.
- Cancellation must be done at least 2 hours in advance.

2. Gym Rules
- Hours: Mon-Fri 6am-9am, Sat-Sun 8am-10am.
- Maximum 10 participants per slot.
- Appropriate gym attire is required.
- Wipe down equipment after use.

3. Pool Rules
- Hours: Mon-Fri 10am-1pm, Sat-Sun 8:30am-12pm.
- One single 3-hour slot.
- Shower before entering the pool.
- No diving or running.

4. Liability
- Use of facilities is at your own risk.
- Thames City is not responsible for lost or stolen items.
`;

export default function BookingWizard() {
  const { addBooking, currentUser, bookings } = useData();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [facility, setFacility] = useState<'Gym' | 'Pool' | null>(null);
  const [date, setDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [termsScrolled, setTermsScrolled] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);

  // Step 1: Facility
  const selectFacility = (f: 'Gym' | 'Pool') => {
    setFacility(f);
    setStep(2);
    setDate('');
    setTimeSlot('');
    setIsRecurring(false);
    setError('');
  };

  // Step 2: Date
  const handleDateSelect = (d: string) => {
    setDate(d);
    setStep(3);
    setError('');
  };

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  // Step 3: Time
  const getAvailableSlots = () => {
    if (!facility || !date) return [];
    const dayOfWeek = new Date(date).getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (facility === 'Gym') {
      if (isWeekend) return ['8am - 9am', '9am - 10am'];
      return ['6am - 7am', '7am - 8am', '8am - 9am'];
    } else {
      // Pool
      if (isWeekend) return ['8:30am - 12pm'];
      return ['10am - 1pm'];
    }
  };

  const mapDisplaySlotToDataSlot = (displaySlot: string, facility: 'Gym' | 'Pool', isWeekend: boolean) => {
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

  const handleTimeSelect = (t: string) => {
    setTimeSlot(t);
    setStep(4);
    setError('');
  };

  // Step 4: Confirm
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      setTermsScrolled(true);
    }
  };

  const handleSubmit = () => {
    if (!currentUser) return;
    if (pin !== currentUser.pin) {
      setError('Invalid PIN');
      return;
    }
    if (!termsScrolled) {
      setError('Please scroll to the bottom of Terms & Conditions');
      return;
    }

    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dataSlot = mapDisplaySlotToDataSlot(timeSlot, facility!, isWeekend);

    addBooking({
      facility: facility!,
      date,
      timeSlot: dataSlot,
      termsAcceptedAt: new Date().toISOString(),
      isRecurring
    });
    
    // Show success step instead of navigating
    setStep(5);
  };

  const resetWizard = () => {
    setStep(1);
    setFacility(null);
    setDate('');
    setTimeSlot('');
    setPin('');
    setError('');
    setTermsScrolled(false);
    setIsRecurring(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-thames-card border-2 border-thames-gold overflow-hidden">
      <div className="bg-thames-bg/50 px-6 py-4 border-b-2 border-thames-gold flex items-center justify-between">
        <h2 className="font-medium text-thames-gold uppercase tracking-widest text-sm">New Booking</h2>
        {step < 5 && <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Step {step} of 4</div>}
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => selectFacility('Gym')}
              className="p-6 border-2 border-thames-gold rounded-xl hover:bg-thames-bg/50 transition-all text-center group bg-thames-bg"
            >
              <div className="w-12 h-12 bg-thames-gold/10 text-thames-gold rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-thames-gold group-hover:text-thames-bg transition-colors">
                <Dumbbell size={24} />
              </div>
              <h3 className="font-bold text-white uppercase tracking-wider">Gym</h3>
              <p className="text-[10px] text-white/50 mt-1 uppercase font-bold">1 hour slots</p>
            </button>
            <button 
              onClick={() => selectFacility('Pool')}
              className="p-6 border-2 border-thames-gold rounded-xl hover:bg-thames-bg/50 transition-all text-center group bg-thames-bg"
            >
              <div className="w-12 h-12 bg-thames-gold/10 text-thames-gold rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-thames-gold group-hover:text-thames-bg transition-colors">
                <Droplets size={24} />
              </div>
              <h3 className="font-bold text-white uppercase tracking-wider">Pool</h3>
              <p className="text-[10px] text-white/50 mt-1 uppercase font-bold">3 hour session</p>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-thames-gold uppercase tracking-widest mb-4">Select Date</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {dates.map(d => (
                <button
                  key={d}
                  onClick={() => handleDateSelect(d)}
                  className={cn(
                    "p-3 rounded-lg text-xs border-2 transition-all font-bold uppercase",
                    date === d 
                      ? "bg-thames-gold text-thames-bg border-thames-gold shadow-lg scale-105" 
                      : "bg-thames-bg text-white/70 border-white/10 hover:border-thames-gold/50 hover:text-white"
                  )}
                >
                  <div className="text-[10px] opacity-60">{new Date(d).toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                  <div className="text-lg">{new Date(d).getDate()}</div>
                  <div className="text-[10px] opacity-60">{new Date(d).toLocaleDateString('en-GB', { month: 'short' })}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="text-[10px] font-bold text-white/50 hover:text-white mt-4 uppercase tracking-widest">← Back to Facility</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-thames-gold uppercase tracking-widest mb-4">Select Time Slot</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getAvailableSlots().map(slot => (
                <button
                  key={slot}
                  onClick={() => handleTimeSelect(slot)}
                  className="p-4 rounded-lg border-2 border-thames-gold bg-thames-bg hover:bg-thames-gold hover:text-thames-bg text-white font-bold text-left transition-all uppercase tracking-wider"
                >
                  {slot}
                </button>
              ))}
            </div>
            {error && <p className="text-white bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-xs font-bold text-center uppercase tracking-wider">{error}</p>}
            <button onClick={() => setStep(2)} className="text-[10px] font-bold text-white/50 hover:text-white mt-4 uppercase tracking-widest">← Back to Date</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-thames-bg p-5 rounded-xl border-2 border-thames-gold">
              <h3 className="text-xs font-bold text-thames-gold mb-3 uppercase tracking-widest">Booking Summary</h3>
              <div className="text-sm text-white/70 space-y-2">
                <p className="flex justify-between"><span className="font-bold text-white/40 uppercase text-[10px]">Facility</span> <span className="font-bold uppercase">{facility}</span></p>
                <p className="flex justify-between"><span className="font-bold text-white/40 uppercase text-[10px]">Date</span> <span className="font-bold uppercase">{new Date(date).toLocaleDateString('en-GB', { dateStyle: 'full' })}</span></p>
                <p className="flex justify-between"><span className="font-bold text-white/40 uppercase text-[10px]">Time</span> <span className="font-bold uppercase">{timeSlot}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border-2 border-white/10 hover:border-thames-gold transition-all cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                isRecurring ? "bg-thames-gold border-thames-gold" : "border-white/20"
              )}>
                {isRecurring && <CheckCircle size={12} className="text-thames-bg" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wider">Make Recurring</p>
                <p className="text-[10px] text-white/40 uppercase font-bold">Repeat this booking every week</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-widest">Terms & Conditions</h3>
              <div 
                onScroll={handleScroll}
                className="h-32 overflow-y-auto border-2 border-white/10 rounded-xl p-4 text-[10px] text-white/40 bg-thames-bg whitespace-pre-wrap scrollbar-thin scrollbar-thumb-thames-gold/20 scrollbar-track-transparent leading-relaxed"
              >
                {TERMS}
              </div>
              {!termsScrolled && <p className="text-[10px] font-bold text-thames-gold mt-2 uppercase tracking-widest animate-pulse">Please scroll to the bottom to accept.</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-thames-gold uppercase tracking-widest">Enter 4-Digit PIN to Confirm</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 bg-thames-bg border-2 border-white/10 rounded-xl outline-none text-white placeholder-white/10 focus:border-thames-gold transition-all text-center text-xl tracking-[1em]"
                placeholder="****"
              />
            </div>

            {error && <p className="text-white bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-xs font-bold text-center uppercase tracking-wider">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setStep(3)} 
                className="px-6 py-3 border-2 border-white/10 rounded-xl text-white font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!termsScrolled || pin.length !== 4}
                className="flex-1 bg-thames-gold text-thames-bg px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-thames-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-xs active:scale-95"
              >
                Confirm & Book
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-light text-white mb-2 uppercase tracking-widest">Request Sent!</h3>
            <p className="text-white/40 mb-8 uppercase text-[10px] font-bold tracking-widest">Your request has been submitted for approval.</p>
            <button 
              onClick={resetWizard}
              className="bg-thames-gold text-thames-bg px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-thames-gold/20 transition-all uppercase tracking-widest text-sm active:scale-95"
            >
              Make Another Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
