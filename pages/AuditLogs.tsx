
import React, { useState, useEffect } from 'react';
import { getStoredAuditLogs } from '../services/storage';
import { AuditLog, AuditActionType } from '../types';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('All');

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getStoredAuditLogs();
      setLogs(data || []);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(search.toLowerCase()) || 
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesAction = filterAction === 'All' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case AuditActionType.CREATE: 
        return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded uppercase tracking-tighter">Create</span>;
      case AuditActionType.UPDATE: 
        return <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase tracking-tighter">Update</span>;
      case AuditActionType.DELETE: 
        return <span className="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded uppercase tracking-tighter">Delete</span>;
      case AuditActionType.SYSTEM: 
        return <span className="px-2 py-1 bg-gray-50 text-gray-600 text-[9px] font-black rounded uppercase tracking-tighter">System</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm font-medium transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['All', AuditActionType.CREATE, AuditActionType.UPDATE, AuditActionType.DELETE, AuditActionType.SYSTEM].map(action => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                filterAction === action ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actor</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Entity</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-mono font-bold text-gray-400">
                      {new Date(log.timestamp).toLocaleString(undefined, { 
                        month: 'short', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-black">
                        {log.userName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-[#0A1931]">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black uppercase tracking-tighter">
                      {log.entity}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs text-gray-600 leading-relaxed max-w-md">{log.details}</p>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <i className="fa-solid fa-list-check text-4xl mb-4"></i>
                      <p className="font-black text-[#0A1931]">No matching records</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
