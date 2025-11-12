import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import api from '../lib/api.js';
import {
  Users, Building2, FileText, CreditCard, Receipt,
  Plus, Edit, Trash2, Search, RefreshCw, Database,
  Eye, Save, X, AlertCircle, CheckCircle
} from 'lucide-react';

const TABS = {
  USERS: 'users',
  PROPERTIES: 'properties',
  UNITS: 'units',
  LEASES: 'leases',
  PAYMENTS: 'payments',
  INVOICES: 'invoices',
  STATS: 'stats'
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.STATS);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check if user is super admin
  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      window.location.href = '/';
    }
  }, [user]);

  // Load stats
  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Load data based on active tab
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      switch (activeTab) {
        case TABS.USERS:
          const usersRes = await api.get('/admin/users');
          setUsers(usersRes.data.users || []);
          break;
        case TABS.PROPERTIES:
          const propsRes = await api.get('/admin/properties');
          setProperties(propsRes.data.properties || []);
          break;
        case TABS.UNITS:
          const unitsRes = await api.get('/admin/units');
          setUnits(unitsRes.data.units || []);
          break;
        case TABS.LEASES:
          const leasesRes = await api.get('/admin/leases');
          setLeases(leasesRes.data.leases || []);
          break;
        case TABS.PAYMENTS:
          const paymentsRes = await api.get('/admin/payments');
          setPayments(paymentsRes.data.payments || []);
          break;
        case TABS.INVOICES:
          const invoicesRes = await api.get('/admin/invoices');
          setInvoices(invoicesRes.data.invoices || []);
          break;
      }
    } catch (error) {
      setError(`Failed to load ${activeTab}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === TABS.STATS) {
      loadStats();
    } else {
      loadData();
    }
  }, [activeTab]);

  // Delete item
  const handleDelete = async (id, type) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      await api.delete(`/admin/${type}/${id}`);
      setSuccess(`${type} deleted successfully`);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(`Failed to delete ${type}: ${error.message}`);
    }
  };

  // Edit item
  const handleEdit = (item) => {
    setEditingItem(item);
    setModalData({ ...item });
    setShowModal(true);
  };

  // Create new item
  const handleCreate = () => {
    setEditingItem(null);
    setModalData({});
    setShowModal(true);
  };

  // Save item
  const handleSave = async () => {
    try {
      setLoading(true);
      const endpoint = `/admin/${activeTab}`;
      
      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, modalData);
        setSuccess(`${activeTab.slice(0, -1)} updated successfully`);
      } else {
        await api.post(endpoint, modalData);
        setSuccess(`${activeTab.slice(0, -1)} created successfully`);
      }
      
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(`Failed to save: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search
  const getFilteredData = () => {
    const data = {
      [TABS.USERS]: users,
      [TABS.PROPERTIES]: properties,
      [TABS.UNITS]: units,
      [TABS.LEASES]: leases,
      [TABS.PAYMENTS]: payments,
      [TABS.INVOICES]: invoices
    }[activeTab] || [];

    if (!searchTerm) return data;
    
    return data.filter(item => {
      const searchStr = JSON.stringify(item).toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold mt-1">{stats?.users?.total || 0}</p>
          </div>
          <Users className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Super Admin: {stats?.users?.byRole?.superAdmin || 0} | 
          Admin: {stats?.users?.byRole?.admin || 0} | 
          Owner: {stats?.users?.byRole?.owner || 0} | 
          Tenant: {stats?.users?.byRole?.tenant || 0}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Properties</p>
            <p className="text-2xl font-bold mt-1">{stats?.properties || 0}</p>
          </div>
          <Building2 className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Units: {stats?.units || 0}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Leases</p>
            <p className="text-2xl font-bold mt-1">{stats?.leases || 0}</p>
          </div>
          <FileText className="w-8 h-8 text-purple-500" />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Payments</p>
            <p className="text-2xl font-bold mt-1">{stats?.payments || 0}</p>
          </div>
          <CreditCard className="w-8 h-8 text-yellow-500" />
        </div>
      </div>
    </div>
  );

  const renderTable = () => {
    const filteredData = getFilteredData();
    
    if (loading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    if (filteredData.length === 0) {
      return <div className="text-center py-8 text-gray-500">No data found</div>;
    }

    // Get table headers from first item
    const firstItem = filteredData[0];
    const headers = Object.keys(firstItem).filter(key => 
      !key.startsWith('_') && 
      key !== 'passwordHash' &&
      typeof firstItem[key] !== 'object'
    ).slice(0, 6); // Limit to 6 columns

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map(header => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {header.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((item, idx) => (
              <tr key={item._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {headers.map(header => (
                  <td key={header} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {typeof item[header] === 'boolean' 
                      ? (item[header] ? 'Yes' : 'No')
                      : String(item[header] || '-').substring(0, 50)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id, activeTab)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const fields = Object.keys(modalData).filter(key => 
      !key.startsWith('_') && 
      key !== 'passwordHash' &&
      key !== '__v'
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {editingItem ? 'Edit' : 'Create'} {activeTab.slice(0, -1)}
            </h3>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                {field === 'password' ? (
                  <input
                    type="password"
                    value={modalData[field] || ''}
                    onChange={(e) => setModalData({ ...modalData, [field]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                ) : typeof modalData[field] === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={modalData[field] || false}
                    onChange={(e) => setModalData({ ...modalData, [field]: e.target.checked })}
                    className="w-4 h-4"
                  />
                ) : typeof modalData[field] === 'number' ? (
                  <input
                    type="number"
                    value={modalData[field] || ''}
                    onChange={(e) => setModalData({ ...modalData, [field]: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                ) : typeof modalData[field] === 'object' ? (
                  <textarea
                    value={JSON.stringify(modalData[field], null, 2)}
                    onChange={(e) => {
                      try {
                        setModalData({ ...modalData, [field]: JSON.parse(e.target.value) });
                      } catch {}
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={String(modalData[field] || '')}
                    onChange={(e) => setModalData({ ...modalData, [field]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Full system data management
          </p>
        </div>
        <button
          onClick={() => activeTab === TABS.STATS ? loadStats() : loadData()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {Object.entries({
          [TABS.STATS]: { label: 'Statistics', icon: Database },
          [TABS.USERS]: { label: 'Users', icon: Users },
          [TABS.PROPERTIES]: { label: 'Properties', icon: Building2 },
          [TABS.UNITS]: { label: 'Units', icon: Building2 },
          [TABS.LEASES]: { label: 'Leases', icon: FileText },
          [TABS.PAYMENTS]: { label: 'Payments', icon: CreditCard },
          [TABS.INVOICES]: { label: 'Invoices', icon: Receipt }
        }).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Search and Create */}
      {activeTab !== TABS.STATS && (
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === TABS.STATS ? renderStats() : renderTable()}
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
}

