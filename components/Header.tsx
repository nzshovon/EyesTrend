
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  activePage: string;
}

const Header: React.FC<HeaderProps> = ({ user, activePage }) => {
  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Command Center';
      case 'inventory': return 'Stock & Catalog';
      case 'sales': return 'Operations & Billing';
      case 'reports': return 'Intelligence Reports';
      case 'users': return 'Team Management';
      case 'settings': return 'System Preferences';
      default: return 'Eye Trends Pro';
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between shadow-sm flex-shrink-0">
      <div>
        <h1 className="text-2xl font-black text-[#0A1931] tracking-tight">{getPageTitle()}</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Eye Trends Enterprise v2.0</p>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Live Synced</span>
        </div>
        
        <div className="flex items-center space-x-4 pl-6 border-l border-gray-100">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 leading-none mb-1">{user.fullName}</p>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{user.role}</p>
          </div>
          <div className="w-11 h-11 rounded-[1rem] bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-100 ring-2 ring-indigo-50 ring-offset-2">
            {user.fullName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
