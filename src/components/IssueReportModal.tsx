import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useData, FacilityType } from '../context/DataContext';
import { motion, AnimatePresence } from 'motion/react';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: FacilityType;
}

export default function IssueReportModal({ isOpen, onClose, facility }: IssueReportModalProps) {
  const { reportIssue } = useData();
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    reportIssue(facility, description);
    setDescription('');
    onClose();
    alert('Issue reported successfully. Admins have been notified.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-thames-card border-2 border-thames-gold rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-thames-gold/5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-thames-gold" />
                <h2 className="text-xl font-light text-white">Report {facility} Issue</h2>
              </div>
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-thames-gold uppercase tracking-wider mb-2">
                  Issue Description
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the equipment issue or maintenance required..."
                  className="w-full bg-thames-bg border-2 border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:border-thames-gold outline-none transition-all min-h-[120px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-thames-gold text-thames-bg font-bold hover:shadow-lg hover:shadow-thames-gold/20 transition-all active:scale-95"
                >
                  SUBMIT REPORT
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
