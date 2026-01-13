
import React, { useState, useEffect } from 'react';
import { getStoredUsers, saveUsers, addAuditLog } from '../services/storage';
import { User, UserRole, UserPermissions, AuditActionType } from '../types';
import { MENU_ITEMS } from '../constants';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    fullName: '',
    role: UserRole.STAFF,
    permissions: {
      canAddInventory: false,
      accessiblePages: ['dashboard', 'inventory', 'sales']
    }
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getStoredUsers();
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  const handleTogglePage = (pageId: string) => {
    const current = formData.permissions?.accessiblePages || [];
    const updated = current.includes(pageId) 
      ? current.filter(p => p !== pageId)
      : [...current, pageId];
    setFormData({
      ...formData,
      permissions: {
        ...(formData.permissions as UserPermissions),
        accessiblePages: updated
      }
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.fullName) return;

    const isNew = !formData.id;
    const newUser: User = {
      id: formData.id || Date.now().toString(),
      username: formData.username,
      password: formData.password || '123456',
      fullName: formData.fullName,
      role: formData.role as UserRole,
      permissions: formData.permissions as UserPermissions
    };

    let updated;
    if (formData.id) {
      updated = users.map(u => u.id === formData.id ? newUser : u);
    } else {
      updated = [...users, newUser];
    }
    
    setUsers(updated);
    saveUsers(updated);

    await addAuditLog(
      currentUser, 
      isNew ? AuditActionType.CREATE : AuditActionType.UPDATE, 
      'USER', 
      `${isNew ? 'Created' : 'Updated'} user account: ${newUser.fullName} (@${newUser.username})`
    );

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      username: '', 
      password: '', 
      fullName: '', 
      role: UserRole.STAFF,
      permissions: {
        canAddInventory: false,
        accessiblePages: ['dashboard', 'inventory', 'sales']
      }
    });
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Delete account for ${user.fullName}?`)) {
      const updated = users.filter(u => u.id !== user.id);
      setUsers(updated);
      saveUsers(updated);
      await addAuditLog(currentUser, AuditActionType.DELETE, 'USER', `Deleted user account: ${user.fullName} (@${user.username})`);
    }
  };

  const handleEditUser = (user: User) => {
    setFormData(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Employee Management</h3>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <i className="fa-solid fa-user-plus"></i>
          <span>Add Employee</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative group">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
              {user.fullName.charAt(0)}
            </div>
            <h4 className="text-lg font-bold text-gray-900">{user.fullName}</h4>
            <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold mb-4 uppercase ${
              user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role}
            </span>
            
            <div className="text-xs text-gray-400 mb-4 h-12 overflow-hidden">
              Can Add Inventory: {user.permissions.canAddInventory ? 'Yes' : 'No'}<br/>
              Access: {user.permissions.accessiblePages.join(', ')}
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => handleEditUser(user)}
                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
              {user.username !== 'Admin' && (
                <button 
                  onClick={() => handleDeleteUser(user)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-800">{formData.id ? 'Edit Employee' : 'New Employee Account'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                  <input required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                  <input required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                  <input required={!formData.id} type="password" placeholder={formData.id ? "Leave empty to keep" : "Min 6 chars"} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-700">Role & Custom Permissions</h4>
                
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                  <div>
                    <p className="font-bold text-indigo-900 text-sm">Can Add Inventory</p>
                    <p className="text-xs text-indigo-600">Allow this user to add and edit stock items</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-indigo-600"
                    checked={formData.permissions?.canAddInventory}
                    onChange={e => setFormData({
                      ...formData,
                      permissions: {
                        ...(formData.permissions as UserPermissions),
                        canAddInventory: e.target.checked
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Accessible Menu Items</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {MENU_ITEMS.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTogglePage(item.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                          formData.permissions?.accessiblePages.includes(item.id)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <i className={`fa-solid ${item.icon}`}></i>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3 sticky bottom-0 bg-white pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                  {formData.id ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
