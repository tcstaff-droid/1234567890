import React from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Users, BarChart as ChartIcon, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Reports() {
  const { bookings, departments } = useData();
  const [activeTab, setActiveTab] = React.useState<'users' | 'charts' | 'cancellations'>('charts');

  // Aggregate data for charts
  const bookingsByFacility = [
    { name: 'Gym', value: bookings.filter(b => b.facility === 'Gym').length },
    { name: 'Pool', value: bookings.filter(b => b.facility === 'Pool').length },
  ];

  const bookingsByStatus = [
    { name: 'Approved', value: bookings.filter(b => b.status === 'Approved').length, color: '#84754e' },
    { name: 'Pending', value: bookings.filter(b => b.status === 'Pending').length, color: '#ffffff' },
    { name: 'Rejected', value: bookings.filter(b => b.status === 'Rejected').length, color: '#000000' },
    { name: 'Auto-cancelled', value: bookings.filter(b => b.status === 'Auto-cancelled').length, color: '#84754e80' },
  ].filter(item => item.value > 0); // Only show statuses with data

  const bookingsByDepartment = departments.map(dept => ({
    name: dept,
    bookings: bookings.filter(b => b.userDepartment === dept).length
  }));

  const handleDownload = () => {
    // Mock Excel download
    alert("Downloading Excel report...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-white">Usage Reports</h2>
        <div className="flex gap-4">
           <select className="bg-thames-bg border border-thames-card text-white text-sm rounded-md px-3 py-2 outline-none">
              <option>Last 30 days</option>
              <option>This Month</option>
              <option>All Time</option>
           </select>
           <button 
             onClick={handleDownload}
             className="flex items-center gap-2 bg-thames-gold text-black px-4 py-2 rounded-md hover:bg-white transition-colors text-sm font-medium"
           >
             <Download size={16} />
             Export Excel
           </button>
        </div>
      </div>

      {/* Sub-tabs for Reports */}
      <div className="flex gap-2">
         <button onClick={() => setActiveTab('users')} className={cn("px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2", activeTab === 'users' ? "bg-thames-bg border-2 border-thames-gold text-thames-gold" : "bg-thames-card text-white/50 hover:text-white")}>
            <Users size={16} /> Top Users
         </button>
         <button onClick={() => setActiveTab('charts')} className={cn("px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2", activeTab === 'charts' ? "bg-thames-bg border-2 border-thames-gold text-thames-gold" : "bg-thames-card text-white/50 hover:text-white")}>
            <ChartIcon size={16} /> Charts
         </button>
         <button onClick={() => setActiveTab('cancellations')} className={cn("px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2", activeTab === 'cancellations' ? "bg-thames-bg border-2 border-thames-gold text-thames-gold" : "bg-thames-card text-white/50 hover:text-white")}>
            <AlertTriangle size={16} /> Cancellations
         </button>
      </div>

      {activeTab === 'charts' && (
         <div className="grid grid-cols-1 gap-6">
           {/* Facility Usage */}
           <div className="bg-thames-bg p-6 rounded-xl border-2 border-thames-gold">
             <h3 className="font-medium text-thames-gold mb-6 flex items-center gap-2">
               <ChartIcon size={18} />
               Most Popular Times
             </h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={bookingsByFacility}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                   <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} />
                   <YAxis allowDecimals={false} stroke="#ffffff50" fontSize={12} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#054e40', border: '1px solid #84754e', borderRadius: '8px', color: '#fff' }}
                     itemStyle={{ color: '#fff' }}
                     cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   />
                   <Bar dataKey="value" fill="#84754e" radius={[4, 4, 0, 0]} barSize={60} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>

           {/* Department Usage */}
           <div className="bg-thames-bg p-6 rounded-xl border-2 border-thames-gold">
             <h3 className="font-medium text-thames-gold mb-6 flex items-center gap-2">
               <Users size={18} />
               Usage by Department
             </h3>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={bookingsByDepartment}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                     <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} />
                     <YAxis allowDecimals={false} stroke="#ffffff50" fontSize={12} />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#054e40', border: '1px solid #84754e', borderRadius: '8px', color: '#fff' }}
                       itemStyle={{ color: '#fff' }}
                       cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                     />
                     <Bar dataKey="bookings" fill="#84754e" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
               <div className="h-64">
                 <h4 className="text-white/70 text-sm mb-4 text-center">Booking Status Distribution</h4>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={bookingsByStatus}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                       label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                       labelLine={false}
                     >
                       {bookingsByStatus.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#054e40', border: '1px solid #84754e', borderRadius: '8px', color: '#fff' }} />
                     <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-white/70 text-xs ml-1">{value}</span>}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </div>
           </div>
         </div>
      )}

      {activeTab === 'users' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-thames-bg p-6 rounded-xl border-2 border-thames-gold">
               <h3 className="font-medium text-white mb-4">Top Gym Users</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-thames-gold flex items-center justify-center text-thames-bg font-bold text-xs">1</div>
                        <div>
                           <p className="text-sm font-medium text-white">Euan Keri</p>
                           <p className="text-xs text-white/50">1974 Club</p>
                        </div>
                     </div>
                     <span className="text-xs bg-thames-card px-2 py-1 rounded text-thames-gold border-2 border-thames-gold">2 sessions</span>
                  </div>
               </div>
            </div>
            <div className="bg-thames-bg p-6 rounded-xl border-2 border-thames-gold">
               <h3 className="font-medium text-white mb-4">Top Pool Users</h3>
               <div className="text-center py-8 text-white/30 text-sm">
                  No pool bookings in this period
               </div>
            </div>
         </div>
      )}

      {activeTab === 'cancellations' && (
         <div className="bg-thames-bg p-6 rounded-xl border-2 border-thames-gold">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
               <AlertTriangle size={18} className="text-white" />
               Cancellations Leaderboard (All Time)
            </h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border-2 border-thames-gold">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">1</div>
                     <div>
                        <p className="text-sm font-medium text-white">euan keir</p>
                        <p className="text-xs text-white/50">Bar & Lounge</p>
                     </div>
                  </div>
                  <span className="text-xs bg-black/40 text-white px-2 py-1 rounded border-2 border-thames-gold">3 cancellations</span>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
