import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { 
  Settings, Users, Shield, User, Mail, Phone, Calendar,
  Search, Edit, Key, ToggleLeft, ToggleRight, 
  UserCheck, UserX, Save, X, Eye, EyeOff, AlertTriangle
} from 'lucide-react';
import api from '../lib/api.js';

export default function SettingsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    isActive: true
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Set active tab based on URL
  useEffect(() => {
    if (location.pathname === '/settings/user-management') {
      setActiveTab('user-management');
    } else {
      setActiveTab('user-management'); // Default to user management
    }
  }, [location.pathname]);

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants/all');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showToastMessage(`Error loading users: ${error.response?.data?.message || error.message}`, 'error');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'user-management' && user?.role === 'ADMIN') {
      loadUsers();
    }
  }, [activeTab, user?.role]);

  const filteredUsers = users.filter(userItem => {
    const matchesSearch = !searchTerm || 
      userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || userItem.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && userItem.isActive) ||
      (statusFilter === 'INACTIVE' && !userItem.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditUser = (userItem) => {
    setSelectedUser(userItem);
    setEditForm({
      firstName: userItem.firstName || '',
      lastName: userItem.lastName || '',
      email: userItem.email || '',
      phone: userItem.phone || '',
      role: userItem.role || '',
      isActive: userItem.isActive !== undefined ? userItem.isActive : true
    });
    setShowEditModal(true);
  };

  const handleResetPassword = (userItem) => {
    setSelectedUser(userItem);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handleToggleStatus = async (userItem) => {
    try {
      const response = await api.put(`/tenants/${userItem._id}/toggle-status`);
      showToastMessage(response.data.message, 'success');
      loadUsers();
      
      // Dispatch event to notify other pages (like Tenant Management)
      window.dispatchEvent(new CustomEvent('userStatusUpdated', { 
        detail: { userId: userItem._id, newStatus: response.data.status } 
      }));
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToastMessage('Error updating user status', 'error');
    }
  };

  const handleBlockUser = (userItem) => {
    setSelectedUser(userItem);
    setShowBlockModal(true);
  };

  const confirmBlockUser = async () => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      // Update user status to blocked
      await api.put(`/tenants/${selectedUser._id}/credentials`, {
        ...editForm,
        status: 'BLOCKED',
        blockReason: blockReason
      });
      showToastMessage('User blocked successfully', 'success');
      setShowBlockModal(false);
      setBlockReason('');
      loadUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
      showToastMessage('Error blocking user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await api.put(`/tenants/${selectedUser._id}/credentials`, editForm);
      showToastMessage('User updated successfully', 'success');
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showToastMessage(`Error updating user: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToastMessage('Passwords do not match', 'error');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showToastMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      setSaving(true);
      await api.put(`/tenants/${selectedUser._id}/reset-password`, {
        newPassword: passwordForm.newPassword
      });
      showToastMessage('Password reset successfully', 'success');
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error resetting password:', error);
      showToastMessage(`Error resetting password: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN':
        return <Shield size={16} className="text-red-600" />;
      case 'OWNER':
        return <UserCheck size={16} className="text-blue-600" />;
      case 'TENANT':
        return <Users size={16} className="text-green-600" />;
      default:
        return <Users size={16} className="text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'OWNER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'TENANT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (user) => {
    if (user.status === 'BLOCKED') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    if (user.isActive === false) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getStatusIcon = (user) => {
    if (user.status === 'BLOCKED') {
      return <UserX size={14} />;
    }
    if (user.isActive === false) {
      return <ToggleLeft size={14} />;
    }
    return <UserCheck size={14} />;
  };

  const getStatusText = (user) => {
    if (user.status === 'BLOCKED') {
      return 'Blocked';
    }
    if (user.isActive === false) {
      return 'Inactive';
    }
    return 'Active';
  };

  const tabs = [
    ...(user?.role === 'ADMIN' ? [{ id: 'user-management', label: 'User Management', icon: Shield }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </div>

          {/* Tabs - Only show if there are multiple tabs */}
          {tabs.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">

            <div className="p-6">
              {/* User Management Tab (Admin Only) */}
              {activeTab === 'user-management' && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Management</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Manage all system users including admins, owners, and tenants.</p>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Users
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Role Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                      <option value="TENANT">Tenant</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="ALL">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-end">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                </div>
              </div>

                  {/* Users List */}
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
                    </div>
                  ) : filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((userItem) => (
                    <div key={userItem._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(userItem.role)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}>
                            {userItem.role}
                          </span>
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {userItem.name || `${userItem.firstName || ''} ${userItem.lastName || ''}`.trim()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Mail size={14} />
                              {userItem.email}
                            </span>
                            {userItem.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={14} />
                                {userItem.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(userItem.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                            {/* Status Display */}
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(userItem)}`}>
                              {getStatusIcon(userItem)}
                              {getStatusText(userItem)}
                            </span>
                            
                            {/* Status Toggle */}
                            {userItem.status !== 'BLOCKED' && (
                              <button
                                onClick={() => handleToggleStatus(userItem)}
                                disabled={userItem._id === user.id}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  userItem.isActive
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                                } ${userItem._id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={userItem._id === user.id ? 'Cannot deactivate your own account' : ''}
                              >
                                {userItem.isActive ? <ToggleLeft size={14} /> : <UserCheck size={14} />}
                                {userItem.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            
                            {/* Block User Button */}
                            {userItem.status !== 'BLOCKED' && userItem._id !== user.id && (
                              <button
                                onClick={() => handleBlockUser(userItem)}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                              >
                                <AlertTriangle size={14} />
                                Block
                              </button>
                            )}
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditUser(userItem)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        
                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleResetPassword(userItem)}
                          className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <Key size={14} />
                          Reset Password
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                          ? 'No users match your current filters. Try adjusting your search criteria.'
                          : 'No users have been created yet.'
                        }
                      </p>
                    </div>
                  )}
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active User
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reset Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSavePassword}
                  disabled={saving}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Key size={16} />
                  {saving ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Block User Confirmation Modal */}
          {showBlockModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="text-red-500" size={20} />
                      Block User
                    </h3>
                    <button
                      onClick={() => setShowBlockModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-red-800 dark:text-red-200 text-sm">
                        <strong>Warning:</strong> This action will block the user from accessing the system. 
                        They will not be able to log in until unblocked by an administrator.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reason for blocking (optional)
                      </label>
                      <textarea
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                        placeholder="Enter reason for blocking this user..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={confirmBlockUser}
                      disabled={saving}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <AlertTriangle size={16} />
                      {saving ? 'Blocking...' : 'Block User'}
                    </button>
                    <button
                      onClick={() => setShowBlockModal(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {showToast.show && (
            <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              showToast.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {showToast.message}
            </div>
          )}
        </div>
      );
    }


