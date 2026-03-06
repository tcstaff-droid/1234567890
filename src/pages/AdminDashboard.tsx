import React from 'react';
import { useData } from '../context/DataContext';
import DepartmentManager from '../components/DepartmentManager';
import CreateManagerForm from '../components/CreateManagerForm';
import UserManagement from '../components/UserManagement';
import ApprovalWorkflowSettings from '../components/ApprovalWorkflowSettings';

import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { currentUser } = useData();

  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Owner')) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-white">Admin Dashboard</h1>
          <p className="text-thames-header mt-1">Manage users, departments, and system settings</p>
        </div>
        <Link 
          to="/analytics"
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border-2 border-thames-gold text-thames-gold font-bold rounded-xl hover:bg-thames-gold hover:text-thames-bg transition-all"
        >
          <BarChart3 size={20} />
          VIEW ANALYTICS
        </Link>
      </div>

      <div className="bg-thames-card rounded-xl border border-white/5 p-6">
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-12">
              <CreateManagerForm />
              <div className="pt-8 border-t border-white/5">
                <ApprovalWorkflowSettings />
              </div>
            </div>
            <DepartmentManager />
          </div>
          <div className="pt-8 border-t border-white/5">
            <UserManagement />
          </div>
        </div>
      </div>
    </div>
  );
}
