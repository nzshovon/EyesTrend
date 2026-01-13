
import React, { useState } from 'react';
import { User } from '../types';
import { getStoredUsers } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const users = await getStoredUsers();
      const found = users.find(u => u.username === username && u.password === password);
      
      if (found) {
        onLogin(found);
      } else {
        setError('Invalid username or password. Access denied.');
      }
    } catch (err) {
      setError('Connection failed. Please check system status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1931] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10 group">
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transition-transform group-hover:rotate-6 duration-500 border-4 border-indigo-500/20">
            <i className="fa-solid fa-glasses text-[#0A1931] text-5xl"></i>
          </div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Eye Trends</h2>
          <p className="text-indigo-300 text-sm font-bold uppercase tracking-[0.3em]">Spectacle Service Provider</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center"><i className="fa-solid fa-circle-exclamation mr-2"></i> {error}</div>}
            
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Username</label>
              <div className="relative">
                <i className="fa-solid fa-user-shield absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input type="text" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Passcode</label>
              <div className="relative">
                <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input type="password" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-5 bg-[#0A1931] text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:translate-y-[-2px] transition-all disabled:opacity-50">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div> : 'Authorized Access'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
             <p className="text-gray-300 text-[9px] uppercase tracking-widest font-medium opacity-50">Secured Terminal Access</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
