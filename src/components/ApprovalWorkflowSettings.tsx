import React, { useState } from 'react';
import { useData, User, ApprovalConfig } from '../context/DataContext';
import { Shield, Users, Check, X, Settings, Info, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function ApprovalWorkflowSettings() {
  const { users, departments, approvalConfigs, updateApprovalConfig } = useData();
  const [selectedDept, setSelectedDept] = useState(departments[0]);
  
  const currentConfig = approvalConfigs[selectedDept] || { managerIds: [], logic: 'any' };
  
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>(currentConfig.managerIds);
  const [logic, setLogic] = useState<'all' | 'any'>(currentConfig.logic);
  const [isSaved, setIsSaved] = useState(false);

  // Update local state when department changes
  React.useEffect(() => {
    const config = approvalConfigs[selectedDept] || { managerIds: [], logic: 'any' };
    setSelectedManagerIds(config.managerIds);
    setLogic(config.logic);
    setIsSaved(false);
  }, [selectedDept, approvalConfigs]);

  const managers = users.filter(u => u.role === 'Manager' || u.role === 'Admin' || u.role === 'Owner');

  const handleToggleManager = (id: string) => {
    setSelectedManagerIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(mid => mid !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const handleSave = () => {
    updateApprovalConfig(selectedDept, {
      managerIds: selectedManagerIds,
      logic
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-thames-gold">
          <Settings size={20} />
          <h2 className="font-bold uppercase tracking-widest text-sm">Booking Approval Workflow</h2>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-thames-bg border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-thames-gold transition-all"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg",
              isSaved 
                ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                : "bg-thames-gold text-thames-bg hover:bg-thames-gold/90 shadow-thames-gold/20"
            )}
          >
            {isSaved ? <Check size={14} /> : <Save size={14} />}
            {isSaved ? 'Saved' : 'Save Workflow'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-xs text-white/50 leading-relaxed">
            Select up to 4 managers for <strong>{selectedDept}</strong> approval. Default is Department Manager.
          </p>

          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {managers.map(manager => (
              <button
                key={manager.id}
                onClick={() => handleToggleManager(manager.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                  selectedManagerIds.includes(manager.id)
                    ? "bg-thames-gold/10 border-thames-gold shadow-inner"
                    : "bg-white/5 border-white/5 hover:border-white/20"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  selectedManagerIds.includes(manager.id)
                    ? "bg-thames-gold border-thames-gold"
                    : "border-white/20 group-hover:border-white/40"
                )}>
                  {selectedManagerIds.includes(manager.id) && <Check size={12} className="text-thames-bg" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate">{manager.fullName}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest truncate">{manager.department} • {manager.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <button
              onClick={() => setLogic('any')}
              className={cn(
                "w-full p-4 rounded-xl border transition-all text-left flex items-start gap-3",
                logic === 'any'
                  ? "bg-thames-gold/10 border-thames-gold shadow-inner"
                  : "bg-white/5 border-white/5 hover:border-white/20"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all shrink-0",
                logic === 'any' ? "bg-thames-gold border-thames-gold" : "border-white/20"
              )}>
                {logic === 'any' && <Check size={12} className="text-thames-bg" />}
              </div>
              <div>
                <p className="font-bold text-white text-xs">Any One Manager</p>
                <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                  Confirmed when <strong>any one</strong> selected manager approves.
                </p>
              </div>
            </button>

            <button
              onClick={() => setLogic('all')}
              className={cn(
                "w-full p-4 rounded-xl border transition-all text-left flex items-start gap-3",
                logic === 'all'
                  ? "bg-thames-gold/10 border-thames-gold shadow-inner"
                  : "bg-white/5 border-white/5 hover:border-white/20"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all shrink-0",
                logic === 'all' ? "bg-thames-gold border-thames-gold" : "border-white/20"
              )}>
                {logic === 'all' && <Check size={12} className="text-thames-bg" />}
              </div>
              <div>
                <p className="font-bold text-white text-xs">All Selected Managers</p>
                <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                  <strong>Every</strong> selected manager must approve.
                </p>
              </div>
            </button>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-200/60 leading-relaxed">
              Admins and Owners can always override this workflow directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
