
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { getCurrentUser, setCurrentUser } from './services/storage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setInitialized(true);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentUser(loggedInUser);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  if (!initialized) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    if (!user.permissions.accessiblePages.includes(activePage)) {
      return <Dashboard />;
    }

    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory currentUser={user} />;
      case 'sales': return <Sales currentUser={user} />;
      case 'reports': return <Reports />;
      case 'users': return user.role === UserRole.ADMIN ? <UserManagement currentUser={user} /> : <Dashboard />;
      case 'audit-logs': return user.role === UserRole.ADMIN ? <AuditLogs /> : <Dashboard />;
      case 'settings': return <Settings currentUser={user} onUpdateUser={(u) => {
        setUser(u);
        setCurrentUser(u);
      }} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-900">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        user={user} 
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} activePage={activePage} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
