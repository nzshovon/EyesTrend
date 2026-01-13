
import React, { useState, useEffect } from 'react';
import { User, UserRole, AppConfig, AuditActionType } from '../types';
import { getStoredUsers, saveUsers, getAppConfig, saveAppConfig, addAuditLog, clearBusinessData } from '../services/storage';

interface SettingsProps {
  currentUser: User;
  onUpdateUser: (u: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState<AppConfig | null>(null);

  // Clear data confirmation
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clearError, setClearError] = useState('');

  useEffect(() => {
    getAppConfig().then(setConfig);
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = await getStoredUsers();
    const updatedUsers = allUsers.map(u => {
      if (u.id === currentUser.id) {
        const updated = { ...u, fullName, password: password || u.password };
        onUpdateUser(updated);
        return updated;
      }
      return u;
    });

    saveUsers(updatedUsers);
    await addAuditLog(currentUser, AuditActionType.UPDATE, 'USER', `Updated personal profile details.`);
    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleConfig = async (key: keyof AppConfig) => {
    // Logic-level restriction for safety
    if (!config || currentUser.role !== UserRole.ADMIN) return;
    
    const newValue = !config[key];
    const updated = { ...config, [key]: newValue };
    setConfig(updated);
    saveAppConfig(updated);
    
    await addAuditLog(currentUser, AuditActionType.SYSTEM, 'CONFIG', `Toggled ${key} to ${newValue ? 'Enabled' : 'Disabled'}`);
    
    setSuccess('System configuration updated.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleClearData = async () => {
    if (confirmPassword !== currentUser.password) {
      setClearError('Incorrect confirmation password.');
      return;
    }

    try {
      await clearBusinessData();
      await addAuditLog(currentUser, AuditActionType.DELETE, 'SYSTEM', 'Performed a full business data reset (Inventory, Sales, and Logs).');
      setShowClearModal(false);
      setConfirmPassword('');
      setSuccess('All business data has been cleared.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setClearError('Action failed. Check connection.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold border border-emerald-100 flex items-center shadow-sm">
          <i className="fa-solid fa-circle-check mr-2"></i> {success}
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-[#0A1931] mb-6">Your Profile</h3>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Display Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Change Password</label>
              <input 
                type="password" 
                placeholder="Leave blank to keep" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>
          <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
            Save Profile
          </button>
        </form>
      </div>

      {/* Enterprise Settings - Strictly restricted to ADMIN role */}
      {currentUser.role === UserRole.ADMIN && config && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3 className="text-xl font-bold text-[#0A1931]">Enterprise Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
              <div>
                <p className="font-bold text-[#0A1931]">Product Catalog Images</p>
                <p className="text-sm text-gray-500">Display item previews in inventory and reports.</p>
              </div>
              <button 
                onClick={() => toggleConfig('enableProductImages')} 
                className={`w-14 h-8 rounded-full relative transition-colors duration-200 focus:outline-none ring-2 ring-transparent focus:ring-indigo-500/20 ${config.enableProductImages ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-200 ${config.enableProductImages ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between p-5 bg-[#0A1931] rounded-2xl border border-indigo-500/20 shadow-lg group">
              <div>
                <p className="font-bold text-white flex items-center space-x-2">
                  <span>Gemini AI Business Insights</span>
                  <i className="fa-solid fa-sparkles text-yellow-400 group-hover:animate-pulse"></i>
                </p>
                <p className="text-sm text-indigo-300">Enable real-time data analysis and inventory advice.</p>
              </div>
              <button 
                onClick={() => toggleConfig('enableGeminiInsights')} 
                className={`w-14 h-8 rounded-full relative transition-colors duration-200 focus:outline-none ring-2 ring-transparent focus:ring-indigo-500/50 ${config.enableGeminiInsights ? 'bg-indigo-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-200 ${config.enableGeminiInsights ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button 
                onClick={() => setShowClearModal(true)}
                className="w-full py-4 px-6 border-2 border-dashed border-red-100 text-red-500 rounded-2xl font-black hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center space-x-3"
              >
                <i className="fa-solid fa-eraser"></i>
                <span>Clear All Business Data</span>
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-3 uppercase font-black tracking-widest">Caution: This action removes all products and sales logs</p>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-red-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 className="text-2xl font-black text-[#0A1931] mb-2">Destructive Action</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                You are about to wipe all inventory and sales history. This cannot be undone. Please enter your administrator password to confirm.
              </p>
              
              <div className="space-y-4">
                {clearError && <p className="text-xs font-bold text-red-500 bg-red-50 py-2 rounded-lg">{clearError}</p>}
                <input 
                  type="password" 
                  placeholder="Admin Password" 
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-center focus:ring-4 focus:ring-red-500/5 outline-none font-bold"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => { setShowClearModal(false); setConfirmPassword(''); setClearError(''); }}
                    className="py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-100"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleClearData}
                    className="py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-red-600/20"
                  >
                    Clear Database
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-[#0A1931] rounded-3xl flex items-center justify-center mb-6 shadow-xl transform rotate-6 border-4 border-white ring-1 ring-gray-100">
          <i className="fa-solid fa-glasses text-white text-3xl"></i>
        </div>
        <h3 className="text-2xl font-extrabold text-[#0A1931]">Eye Trends</h3>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 mb-4">Spectacle Service Provider</p>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">Version 2.0.0 Stable (Firebase Ready).<br/>Enterprise-grade eyewear management platform.</p>
        <div className="mt-8 flex items-center space-x-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-full">
          <i className="fa-solid fa-cloud-arrow-up"></i>
          <span>Realtime Data Synced</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
