import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { LogOut, User as UserIcon, LayoutDashboard, BarChart2, Home as HomeIcon, CheckSquare, Settings, Shield, Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import ManagerSetupModal from './ManagerSetupModal';
import { motion, AnimatePresence } from 'motion/react';

export default function MainLayout() {
  const { currentUser, logout, notifications, markNotificationRead, clearNotifications } = useData();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium border border-transparent",
        location.pathname === to 
          ? "bg-thames-bg text-thames-text border-thames-card shadow-sm" 
          : "text-thames-bg hover:bg-thames-bg/10"
      )}
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-thames-bg font-sans text-thames-text">
      <ManagerSetupModal />
      {/* Gold Header */}
      <header className="bg-thames-header text-thames-bg shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
               <img src="/logo.svg" alt="Thames City Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="font-light text-xl tracking-widest uppercase">Thames City Staff Booking</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/" icon={HomeIcon} label="Home" />
            <NavLink to="/capacity" icon={BarChart2} label="Capacity" />
            {(currentUser.role === 'Manager' || currentUser.role === 'Admin' || currentUser.role === 'Owner') && (
               <NavLink to="/approvals" icon={CheckSquare} label="Approvals" />
            )}
            {(currentUser.role === 'Admin' || currentUser.role === 'Owner') && (
               <NavLink to="/admin" icon={Shield} label="Admin" />
            )}
            <NavLink to="/settings" icon={Settings} label="Settings" />
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative">
               <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 hover:bg-thames-bg/10 rounded-full relative transition-colors"
               >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-thames-gold text-black text-[10px] flex items-center justify-center rounded-full border border-thames-header font-bold">
                      {unreadCount}
                    </span>
                  )}
               </button>

               <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-thames-card border-2 border-thames-header rounded-lg shadow-2xl z-50 overflow-hidden text-thames-bg"
                    >
                      <div className="p-4 border-b border-thames-bg/10 flex justify-between items-center bg-thames-header/5">
                        <h3 className="font-bold text-xs uppercase tracking-wider">Notifications</h3>
                        <button onClick={clearNotifications} className="text-[10px] hover:underline uppercase font-bold">Clear All</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 text-sm italic">No notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                markNotificationRead(n.id);
                                setIsNotifOpen(false);
                              }}
                              className={cn(
                                "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3",
                                !n.read && "bg-thames-header/5"
                              )}
                            >
                              <div className="mt-1">{getNotifIcon(n.type)}</div>
                              <div>
                                <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-thames-bg/10 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
