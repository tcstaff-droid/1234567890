import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { User, Mail, Phone, Briefcase, Lock, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { currentUser, updateUserProfile } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<any>>({});

  if (!currentUser) return null;

  const handleEdit = () => {
    setFormData({
      email: currentUser.email,
      phone: currentUser.phone,
      jobTitle: currentUser.jobTitle,
      headOfDepartment: currentUser.headOfDepartment,
      pin: currentUser.pin,
      emailNotifications: currentUser.emailNotifications
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateUserProfile(currentUser.id, formData);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div className="max-w-2xl mx-auto bg-thames-card rounded-xl border-2 border-thames-gold overflow-hidden">
      <div className="px-6 py-4 border-b-2 border-thames-gold flex items-center justify-between">
        <h2 className="font-medium text-thames-gold flex items-center gap-2">
          <User size={20} />
          My Profile
        </h2>
        {!isEditing ? (
          <button 
            onClick={handleEdit}
            className="text-sm text-thames-gold hover:text-thames-gold/80 font-medium transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="text-sm text-white/50 hover:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="text-sm bg-thames-gold text-thames-bg px-3 py-1 rounded-md hover:bg-thames-gold/90 font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b-2 border-thames-gold">
          <div className="w-16 h-16 bg-thames-bg rounded-full flex items-center justify-center text-thames-gold border-2 border-thames-gold">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{currentUser.fullName}</h3>
            <p className="text-white/50">@{currentUser.username}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/10 text-white/80 text-xs rounded-full font-medium">
              {currentUser.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-white border-b-2 border-thames-gold pb-2">Contact Information</h4>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 flex items-center gap-1">
                <Mail size={12} /> Email
              </label>
              {isEditing ? (
                <input 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  className="w-full px-2 py-1 bg-thames-bg border-2 border-thames-gold rounded text-sm text-white focus:border-thames-gold outline-none"
                />
              ) : (
                <p className="text-sm text-white/80">{currentUser.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 flex items-center gap-1">
                <Phone size={12} /> Phone
              </label>
              {isEditing ? (
                <input 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange}
                  className="w-full px-2 py-1 bg-thames-bg border-2 border-thames-gold rounded text-sm text-white focus:border-thames-gold outline-none"
                />
              ) : (
                <p className="text-sm text-white/80">{currentUser.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-white border-b-2 border-thames-gold pb-2">Employment Details</h4>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 flex items-center gap-1">
                <Briefcase size={12} /> Department
              </label>
              <p className="text-sm text-white/80">{currentUser.department}</p>
              {isEditing && <p className="text-xs text-thames-gold">Department change requires admin approval</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Job Title</label>
              {isEditing ? (
                <input 
                  name="jobTitle" 
                  value={formData.jobTitle} 
                  onChange={handleChange}
                  className="w-full px-2 py-1 bg-thames-bg border-2 border-thames-gold rounded text-sm text-white focus:border-thames-gold outline-none"
                />
              ) : (
                <p className="text-sm text-white/80">{currentUser.jobTitle}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Head of Department</label>
              {isEditing ? (
                <input 
                  name="headOfDepartment" 
                  value={formData.headOfDepartment} 
                  onChange={handleChange}
                  className="w-full px-2 py-1 bg-thames-bg border-2 border-thames-gold rounded text-sm text-white focus:border-thames-gold outline-none"
                />
              ) : (
                <p className="text-sm text-white/80">{currentUser.headOfDepartment}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-thames-gold">
          <h4 className="font-medium text-white mb-4">Security & Preferences</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 flex items-center gap-1">
                <Lock size={12} /> 4-Digit PIN
              </label>
              {isEditing ? (
                <input 
                  name="pin" 
                  type="password"
                  maxLength={4}
                  value={formData.pin} 
                  onChange={handleChange}
                  className="w-full px-2 py-1 bg-thames-bg border border-white/10 rounded text-sm text-white focus:border-thames-gold outline-none"
                />
              ) : (
                <p className="text-sm text-white/80">****</p>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-thames-bg rounded-lg border-2 border-thames-gold">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-white/50" />
                <span className="text-sm font-medium text-white/80">Email Notifications</span>
              </div>
              {isEditing ? (
                <input 
                  name="emailNotifications" 
                  type="checkbox"
                  checked={formData.emailNotifications} 
                  onChange={handleChange}
                  className="w-4 h-4 text-thames-gold rounded focus:ring-thames-gold bg-thames-card border-white/10"
                />
              ) : (
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full", currentUser.emailNotifications ? "bg-thames-gold/20 text-thames-gold" : "bg-white/10 text-white/50")}>
                  {currentUser.emailNotifications ? "On" : "Off"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
