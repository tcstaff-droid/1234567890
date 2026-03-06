import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Papa from 'papaparse';

export type Role = 'Owner' | 'Admin' | 'Manager' | 'Staff';
export type AccountStatus = 'Pending' | 'Active' | 'Rejected';
export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Auto-cancelled' | 'Waitlisted';
export type FacilityType = 'Gym' | 'Pool';

export const DEFAULT_DEPARTMENTS = [
  '1974 Club',
  'Amenities',
  'Security',
  'LRM',
  'Concierge',
  'Housekeeping',
  'Bar and Lounge',
  'Nurture'
] as const;

export type DepartmentName = typeof DEFAULT_DEPARTMENTS[number];

export interface User {
  id: string;
  username: string;
  password: string;
  pin: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  headOfDepartment: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  emailNotifications: boolean;
  requiresSetup?: boolean;
  avatar?: string;
  favoriteFacility?: FacilityType;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userDepartment: string;
  facility: FacilityType;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  rejectionReason?: string;
  createdAt: string;
  termsAcceptedAt: string;
  isRecurring?: boolean;
  recurrenceId?: string;
  approvals?: string[]; // List of manager IDs who have approved
}

export interface ApprovalConfig {
  managerIds: string[]; // Up to 4
  logic: 'all' | 'any';
}

export interface WaitlistEntry {
  id: string;
  userId: string;
  userName: string;
  facility: FacilityType;
  date: string;
  timeSlot: string;
  createdAt: string;
}

export interface EquipmentIssue {
  id: string;
  userId: string;
  userName: string;
  facility: FacilityType;
  description: string;
  status: 'Open' | 'Resolved';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  createdAt: string;
  read: boolean;
}

interface DataContextType {
  users: User[];
  bookings: Booking[];
  waitlist: WaitlistEntry[];
  issues: EquipmentIssue[];
  notifications: AppNotification[];
  currentUser: User | null;
  departments: string[];
  approvalConfigs: Record<string, ApprovalConfig>;
  updateApprovalConfig: (department: string, config: ApprovalConfig) => void;
  approveBooking: (bookingId: string, managerId: string) => void;
  login: (username: string, pin: string) => { success: boolean; message?: string };
  loginWithPassword: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'role' | 'status' | 'createdAt' | 'emailNotifications'>) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'userName' | 'userDepartment'>) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus, reason?: string) => void;
  updateUserStatus: (userId: string, status: AccountStatus) => void;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  getPendingUsers: () => User[];
  getBookingsForUser: (userId: string) => Booking[];
  getPendingBookingsForManager: (managerDepartment: string) => Booking[];
  getAllPendingBookings: () => Booking[];
  addDepartment: (name: string) => void;
  removeDepartment: (name: string) => void;
  createManagerAccount: (email: string, tempPassword: string) => void;
  completeManagerSetup: (userId: string, data: { password: string; fullName: string }) => void;
  joinWaitlist: (data: Omit<WaitlistEntry, 'id' | 'userId' | 'userName' | 'createdAt'>) => void;
  reportIssue: (facility: FacilityType, description: string) => void;
  resolveIssue: (issueId: string) => void;
  exportBookingsCSV: () => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const GYM_CAPACITY = 10;
const POOL_CAPACITY = 10;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('thames_prod_users');
    const parsed = saved ? JSON.parse(saved) : [];
    if (parsed.length === 0) {
      return [{
        id: 'admin-1',
        username: 'admin',
        password: 'password123',
        pin: '1234',
        fullName: 'System Administrator',
        email: 'admin@thamescity.com',
        phone: '0000000000',
        department: 'Management',
        jobTitle: 'Admin',
        headOfDepartment: 'N/A',
        role: 'Admin',
        status: 'Active',
        createdAt: new Date().toISOString(),
        emailNotifications: true
      }];
    }
    return parsed;
  });
  
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('thames_prod_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => {
    const saved = localStorage.getItem('thames_prod_waitlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [issues, setIssues] = useState<EquipmentIssue[]>(() => {
    const saved = localStorage.getItem('thames_prod_issues');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<string[]>([...DEFAULT_DEPARTMENTS]);
  const [approvalConfigs, setApprovalConfigs] = useState<Record<string, ApprovalConfig>>(() => {
    const saved = localStorage.getItem('thames_prod_approval_configs');
    return saved ? JSON.parse(saved) : {};
  });
  const [socket, setSocket] = useState<Socket | null>(null);

  // Socket initialization
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('notification', (notif: Omit<AppNotification, 'id' | 'read'>) => {
      setNotifications(prev => [{
        ...notif,
        id: Math.random().toString(36).substr(2, 9),
        read: false
      }, ...prev]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (currentUser && socket) {
      socket.emit('join-room', currentUser.id);
    }
  }, [currentUser, socket]);

  // Persistence
  useEffect(() => { localStorage.setItem('thames_prod_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('thames_prod_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('thames_prod_waitlist', JSON.stringify(waitlist)); }, [waitlist]);
  useEffect(() => { localStorage.setItem('thames_prod_issues', JSON.stringify(issues)); }, [issues]);
  useEffect(() => { localStorage.setItem('thames_prod_approval_configs', JSON.stringify(approvalConfigs)); }, [approvalConfigs]);

  const notifyServer = useCallback(async (userId: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message, type })
      });
    } catch (e) {
      console.error('Failed to notify server', e);
    }
  }, []);

  const loginWithPassword = (username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return { success: false, message: 'Invalid username or password' };
    if (user.status === 'Pending') return { success: false, message: 'Account pending approval' };
    if (user.status === 'Rejected') return { success: false, message: 'Account has been rejected' };
    
    setCurrentUser(user);
    return { success: true };
  };

  const login = (username: string, pin: string) => {
    const user = users.find(u => u.username === username && u.pin === pin);
    if (!user) return { success: false, message: 'Invalid username or PIN' };
    if (user.status === 'Pending') return { success: false, message: 'Account pending approval' };
    if (user.status === 'Rejected') return { success: false, message: 'Account has been rejected' };
    
    setCurrentUser(user);
    return { success: true };
  };

  const logout = () => setCurrentUser(null);

  const register = (userData: Omit<User, 'id' | 'role' | 'status' | 'createdAt' | 'emailNotifications'>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      role: 'Staff',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      emailNotifications: true,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const addBooking = (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt' | 'userName' | 'userDepartment'>) => {
    if (!currentUser) return;

    const capacity = bookingData.facility === 'Gym' ? GYM_CAPACITY : POOL_CAPACITY;
    const currentBookings = bookings.filter(b => 
      b.facility === bookingData.facility && 
      b.date === bookingData.date && 
      b.timeSlot === bookingData.timeSlot &&
      b.status !== 'Rejected' && b.status !== 'Auto-cancelled'
    ).length;

    if (currentBookings >= capacity) {
      alert('This slot is full. You will be added to the waitlist.');
      joinWaitlist({
        facility: bookingData.facility,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot
      });
      return;
    }

    const newBooking: Booking = {
      ...bookingData,
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.fullName,
      userDepartment: currentUser.department,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      approvals: [],
    };
    setBookings(prev => [...prev, newBooking]);
    
    // Notify managers
    let managersToNotify: User[] = [];
    const config = approvalConfigs[currentUser.department];
    if (config && config.managerIds.length > 0) {
      managersToNotify = users.filter(u => config.managerIds.includes(u.id));
    } else {
      managersToNotify = users.filter(u => (u.role === 'Manager' && u.department === currentUser.department) || u.role === 'Admin');
    }
    managersToNotify.forEach(m => notifyServer(m.id, `New booking request from ${currentUser.fullName}`, 'info'));
  };

  const approveBooking = (bookingId: string, managerId: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const currentApprovals = b.approvals || [];
        if (currentApprovals.includes(managerId)) return b;
        
        const newApprovals = [...currentApprovals, managerId];
        let newStatus: BookingStatus = 'Pending';
        const config = approvalConfigs[b.userDepartment];

        if (!config || config.logic === 'any' || config.managerIds.length === 0) {
          newStatus = 'Approved';
        } else if (config.logic === 'all') {
          // Check if all designated managers have approved
          const requiredManagers = config.managerIds;
          const allApproved = requiredManagers.every(id => newApprovals.includes(id));
          if (allApproved) newStatus = 'Approved';
        }

        if (newStatus === 'Approved') {
          notifyServer(b.userId, `Your booking for ${b.facility} on ${b.date} has been approved!`, 'success');
        }

        return { ...b, approvals: newApprovals, status: newStatus };
      }
      return b;
    }));
  };

  const updateApprovalConfig = (department: string, config: ApprovalConfig) => {
    setApprovalConfigs(prev => ({
      ...prev,
      [department]: config
    }));
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus, reason?: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        notifyServer(b.userId, `Your booking for ${b.facility} on ${b.date} has been ${status.toLowerCase()}`, status === 'Approved' ? 'success' : 'warning');
        return { ...b, status, rejectionReason: reason };
      }
      return b;
    }));

    // If a booking is rejected or cancelled, check waitlist
    if (status === 'Rejected' || status === 'Auto-cancelled') {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const nextInLine = waitlist.find(w => 
          w.facility === booking.facility && 
          w.date === booking.date && 
          w.timeSlot === booking.timeSlot
        );
        if (nextInLine) {
          notifyServer(nextInLine.userId, `A spot has opened up for ${booking.facility} on ${booking.date}!`, 'success');
          // Auto-promote or just notify? Let's just notify for now as per "Waitlist System" suggestion
        }
      }
    }
  };

  const updateUserStatus = (userId: string, status: AccountStatus) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        notifyServer(u.id, `Your account status has been updated to ${status}`, status === 'Active' ? 'success' : 'warning');
        return { ...u, status };
      }
      return u;
    }));
  };

  const updateUserProfile = (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, ...data } : null);
  };

  const joinWaitlist = (data: Omit<WaitlistEntry, 'id' | 'userId' | 'userName' | 'createdAt'>) => {
    if (!currentUser) return;
    const newEntry: WaitlistEntry = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.fullName,
      createdAt: new Date().toISOString()
    };
    setWaitlist(prev => [...prev, newEntry]);
  };

  const reportIssue = (facility: FacilityType, description: string) => {
    if (!currentUser) return;
    const newIssue: EquipmentIssue = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.fullName,
      facility,
      description,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    setIssues(prev => [...prev, newIssue]);
    
    // Notify admins
    users.filter(u => u.role === 'Admin' || u.role === 'Owner').forEach(a => 
      notifyServer(a.id, `New issue reported in ${facility} by ${currentUser.fullName}`, 'warning')
    );
  };

  const resolveIssue = (issueId: string) => {
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'Resolved' } : i));
  };

  const exportBookingsCSV = () => {
    const csv = Papa.unparse(bookings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `thames_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Automated Reminders
  useEffect(() => {
    if (!currentUser) return;

    const checkReminders = () => {
      const today = new Date().toISOString().split('T')[0];
      const upcoming = bookings.filter(b => 
        b.userId === currentUser.id && 
        b.date === today && 
        b.status === 'Approved'
      );

      upcoming.forEach(booking => {
        const reminderId = `reminder-${booking.id}`;
        const alreadyNotified = notifications.some(n => n.id === reminderId);
        
        if (!alreadyNotified) {
          const [start] = booking.timeSlot.split(' - ');
          addNotification({
            id: reminderId,
            title: 'Upcoming Booking Reminder',
            message: `You have a ${booking.facility} session today at ${start}.`,
            type: 'info',
            createdAt: new Date().toISOString(),
            read: false
          });
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 1000 * 60 * 30); // Check every 30 mins
    return () => clearInterval(interval);
  }, [bookings, currentUser]);

  const addNotification = (notification: AppNotification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => setNotifications([]);

  const getPendingUsers = () => users.filter(u => u.status === 'Pending');
  const getBookingsForUser = (userId: string) => bookings.filter(b => b.userId === userId);
  const getPendingBookingsForManager = (managerDepartment: string) => 
    bookings.filter(b => b.status === 'Pending' && b.userDepartment === managerDepartment);
  const getAllPendingBookings = () => bookings.filter(b => b.status === 'Pending');
  const addDepartment = (name: string) => !departments.includes(name) && setDepartments([...departments, name]);
  const removeDepartment = (name: string) => setDepartments(departments.filter(d => d !== name));

  const createManagerAccount = (email: string, tempPassword: string) => {
    const newManager: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: email,
      password: tempPassword,
      pin: '0000',
      fullName: 'Manager',
      email: email,
      phone: '',
      department: 'General',
      jobTitle: 'Manager',
      headOfDepartment: 'Owner',
      role: 'Manager',
      status: 'Active',
      createdAt: new Date().toISOString(),
      emailNotifications: true,
      requiresSetup: true,
    };
    setUsers(prev => [...prev, newManager]);
  };

  const completeManagerSetup = (userId: string, data: { password: string; fullName: string }) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data, requiresSetup: false } : u));
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, ...data, requiresSetup: false } : null);
  };

  return (
    <DataContext.Provider value={{
      users, bookings, waitlist, issues, notifications, currentUser, departments,
      login, loginWithPassword, logout, register, addBooking, updateBookingStatus,
      updateUserStatus, updateUserProfile, getPendingUsers, getBookingsForUser,
      getPendingBookingsForManager, getAllPendingBookings, addDepartment, removeDepartment,
      createManagerAccount, completeManagerSetup, joinWaitlist, reportIssue, resolveIssue,
      exportBookingsCSV, markNotificationRead, clearNotifications,
      approvalConfigs, updateApprovalConfig, approveBooking
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
