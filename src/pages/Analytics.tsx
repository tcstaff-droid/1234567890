import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Download, TrendingUp, Users, Activity, Calendar } from 'lucide-react';

export default function Analytics() {
  const { bookings, users, exportBookingsCSV } = useData();

  const facilityData = useMemo(() => {
    const gym = bookings.filter(b => b.facility === 'Gym').length;
    const pool = bookings.filter(b => b.facility === 'Pool').length;
    return [
      { name: 'Gym', value: gym },
      { name: 'Pool', value: pool },
    ];
  }, [bookings]);

  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.userDepartment] = (counts[b.userDepartment] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const dailyTrend = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      const date = b.date;
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [bookings]);

  const COLORS = ['#84754e', '#054e40', '#1a1a1a', '#ffffff'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Facility Analytics</h1>
          <p className="text-white/50">Usage trends and department statistics</p>
        </div>
        <button 
          onClick={exportBookingsCSV}
          className="flex items-center gap-2 px-6 py-3 bg-thames-gold text-thames-bg font-bold rounded-xl hover:shadow-lg transition-all"
        >
          <Download size={20} />
          EXPORT DATA (CSV)
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Activity />} label="Total Bookings" value={bookings.length} />
        <StatCard icon={<Users />} label="Active Users" value={users.filter(u => u.status === 'Active').length} />
        <StatCard icon={<TrendingUp />} label="Avg. Daily" value={(bookings.length / (dailyTrend.length || 1)).toFixed(1)} />
        <StatCard icon={<Calendar />} label="Peak Day" value={dailyTrend.length > 0 ? dailyTrend.reduce((a, b) => a.count > b.count ? a : b).date : 'N/A'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Facility Usage */}
        <div className="bg-thames-card border-2 border-thames-gold rounded-2xl p-6">
          <h2 className="text-xl font-light text-white mb-6">Facility Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {facilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #84754e', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            {facilityData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-sm text-white/70">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Usage */}
        <div className="bg-thames-card border-2 border-thames-gold rounded-2xl p-6">
          <h2 className="text-xl font-light text-white mb-6">Department Activity</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} />
                <YAxis stroke="#ffffff50" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #84754e', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#84754e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Trend */}
        <div className="bg-thames-card border-2 border-thames-gold rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-xl font-light text-white mb-6">Booking Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#ffffff50" fontSize={10} />
                <YAxis stroke="#ffffff50" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #84754e', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#84754e" strokeWidth={3} dot={{ fill: '#84754e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-thames-card border-2 border-white/10 rounded-2xl p-6 hover:border-thames-gold transition-all group">
      <div className="w-10 h-10 bg-white/5 text-thames-gold rounded-lg flex items-center justify-center mb-4 group-hover:bg-thames-gold group-hover:text-thames-bg transition-all">
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-light text-white">{value}</p>
    </div>
  );
}
