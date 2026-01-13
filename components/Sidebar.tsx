
import React from 'react';
import { User, UserRole } from '../types';
import { MENU_ITEMS } from '../constants';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, user, onLogout }) => {
  return (
    <aside className="w-64 bg-[#0A1931] text-white flex flex-col hidden md:flex h-full shadow-2xl">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-lg transform -rotate-3 border-2 border-indigo-500">
            <i className="fa-solid fa-glasses text-[#0A1931] text-3xl"></i>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold tracking-tight block">Eye Trends</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Spectacle Service Provider</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          if (item.adminOnly && user.role !== UserRole.ADMIN) return null;
          if (!user.permissions.accessiblePages.includes(item.id)) return null;
          
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg font-semibold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5`}></i>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all"
        >
          <i className="fa-solid fa-right-from-bracket w-5"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
