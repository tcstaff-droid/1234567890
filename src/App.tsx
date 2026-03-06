import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Approvals from './pages/Approvals';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import CapacityView from './pages/CapacityView';
import Analytics from './pages/Analytics';
import MainLayout from './components/MainLayout';

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="capacity" element={<CapacityView />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Profile />} />
            {/* Catch-all route to prevent blank screens */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
