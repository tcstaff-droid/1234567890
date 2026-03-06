import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Trash2, Building } from 'lucide-react';

export default function DepartmentManager() {
  const { departments, addDepartment, removeDepartment } = useData();
  const [newDept, setNewDept] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDept.trim()) {
      addDepartment(newDept.trim());
      setNewDept('');
    }
  };

  return (
    <div className="bg-thames-card rounded-xl border-2 border-thames-gold overflow-hidden">
      <div className="px-6 py-4 border-b-2 border-thames-gold flex items-center justify-between">
        <h2 className="font-medium text-thames-gold flex items-center gap-2">
          <Building size={20} />
          Manage Departments
        </h2>
      </div>
      
      <div className="p-6 space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            placeholder="New Department Name"
            className="flex-1 px-3 py-2 bg-thames-bg border-2 border-thames-gold rounded-lg focus:border-thames-gold outline-none text-white placeholder-white/30"
          />
          <button 
            type="submit"
            className="bg-thames-gold text-thames-bg font-medium px-4 py-2 rounded-lg hover:bg-thames-gold/90 flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {departments.map(dept => (
            <div key={dept} className="flex items-center justify-between p-3 bg-thames-bg rounded-lg border-2 border-thames-gold group hover:border-thames-gold transition-colors">
              <span className="font-medium text-white/80">{dept}</span>
              <button 
                onClick={() => removeDepartment(dept)}
                className="text-white/30 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                title="Remove Department"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-white/30 italic">
          Note: Removing a department will prevent new users from selecting it, but existing users will retain it.
        </p>
      </div>
    </div>
  );
}
