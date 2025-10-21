import { useEffect, useState } from 'react';
import { 
  Plus, Edit, Trash2, Eye, User, Mail, Phone, 
  MapPin, Briefcase, Calendar, FileText, AlertCircle
} from 'lucide-react';
import api from '../lib/api.js';

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'STUDENT', 'UNEMPLOYED'];
const TENANT_STATUS = ['ACTIVE', 'INACTIVE', 'BLACKLISTED'];

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // General Information
    firstName: '',
    lastName: '',
    middleName: '',
    passportNo: '',
    nic: '',
    nicExpirationDate: '',
    primaryEmail: '',
    phone: '',
    nationality: '',
    
    // Additional Information
    secondaryEmail: '',
    secondaryPhone: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    employment: {
      company: '',
      position: '',
      monthlyIncome: '',
      employmentType: 'FULL_TIME'
    },
    notes: '',
    status: 'ACTIVE',
    password: 'tenant123'
  });

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadTenants(); 
    
    // Listen for user status updates from User Management
    const handleUserStatusUpdate = () => {
      loadTenants();
    };
    
    window.addEventListener('userStatusUpdated', handleUserStatusUpdate);
    
    return () => {
      window.removeEventListener('userStatusUpdated', handleUserStatusUpdate);
    };
  }, []);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      passportNo: '',
      nic: '',
      nicExpirationDate: '',
      primaryEmail: '',
      phone: '',
      nationality: '',
      secondaryEmail: '',
      secondaryPhone: '',
      emergencyContact: { name: '', relationship: '', phone: '', email: '' },
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      employment: { company: '', position: '', monthlyIncome: '', employmentType: 'FULL_TIME' },
      notes: '',
      status: 'ACTIVE',
      password: 'tenant123'
    });
    setEditingTenant(null);
    setShowForm(false);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.primaryEmail,
        role: 'TENANT'
      };

      if (editingTenant) {
        await api.put(`/tenants/${editingTenant._id}`, submitData);
      } else {
        await api.post('/tenants', submitData);
      }
      
      resetForm();
      loadTenants();
    } catch (error) {
      console.error('Error saving tenant:', error);
      alert('Error saving tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tenant) => {
    setFormData({
      firstName: tenant.firstName || '',
      lastName: tenant.lastName || '',
      middleName: tenant.middleName || '',
      passportNo: tenant.passportNo || '',
      nic: tenant.nic || '',
      nicExpirationDate: tenant.nicExpirationDate ? tenant.nicExpirationDate.split('T')[0] : '',
      primaryEmail: tenant.primaryEmail || tenant.email || '',
      phone: tenant.phone || '',
      nationality: tenant.nationality || '',
      secondaryEmail: tenant.secondaryEmail || '',
      secondaryPhone: tenant.secondaryPhone || '',
      emergencyContact: tenant.emergencyContact || { name: '', relationship: '', phone: '', email: '' },
      address: tenant.address || { street: '', city: '', state: '', zipCode: '', country: '' },
      employment: tenant.employment || { company: '', position: '', monthlyIncome: '', employmentType: 'FULL_TIME' },
      notes: tenant.notes || '',
      status: tenant.status || 'ACTIVE',
      password: ''
    });
    setEditingTenant(tenant);
    setShowForm(true);
  };

  const handleDelete = async (tenantId) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await api.delete(`/tenants/${tenantId}`);
        loadTenants();
      } catch (error) {
        console.error('Error deleting tenant:', error);
        alert('Error deleting tenant. Please try again.');
      }
    }
  };

  const handleViewDetails = (tenant) => {
    setSelectedTenant(tenant);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenant Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Tenant
        </button>
      </div>

      {/* Tenant Creation/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <User size={20} />
                General Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Middle Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Passport No</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.passportNo}
                    onChange={(e) => handleInputChange('passportNo', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NIC *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.nic}
                    onChange={(e) => handleInputChange('nic', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NIC Expiration Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.nicExpirationDate}
                    onChange={(e) => handleInputChange('nicExpirationDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Primary Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.primaryEmail}
                    onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nationality</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Phone size={20} />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Secondary Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.secondaryEmail}
                    onChange={(e) => handleInputChange('secondaryEmail', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Secondary Phone</label>
                  <input
                    type="tel"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.secondaryPhone}
                    onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <AlertCircle size={20} />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Relationship</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.emergencyContact.email}
                    onChange={(e) => handleInputChange('emergencyContact.email', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.address.zipCode}
                    onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Briefcase size={20} />
                Employment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.employment.company}
                    onChange={(e) => handleInputChange('employment.company', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.employment.position}
                    onChange={(e) => handleInputChange('employment.position', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Income</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.employment.monthlyIncome}
                    onChange={(e) => handleInputChange('employment.monthlyIncome', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Employment Type</label>
                  <select
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.employment.employmentType}
                    onChange={(e) => handleInputChange('employment.employmentType', e.target.value)}
                  >
                    {EMPLOYMENT_TYPES.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <FileText size={20} />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    {TENANT_STATUS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                {!editingTenant && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      required
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about the tenant..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingTenant ? 'Update Tenant' : 'Create Tenant')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenants List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Registered Tenants</h2>
        {loading ? (
          <div className="text-center py-8">Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No tenants found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">NIC</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">
                      <div className="font-medium">
                        {tenant.firstName && tenant.lastName 
                          ? `${tenant.firstName} ${tenant.lastName}`
                          : tenant.name
                        }
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {tenant.primaryEmail || tenant.email}
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {tenant.phone || 'N/A'}
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {tenant.nic || 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        tenant.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tenant.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(tenant)}
                          className="px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye size={12} />
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(tenant)}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                          title="Edit Tenant"
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tenant._id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                          title="Delete Tenant"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tenant Details Modal */}
      {showDetailsModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tenant Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User size={18} />
                    General Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedTenant.firstName && selectedTenant.lastName ? `${selectedTenant.firstName} ${selectedTenant.lastName}` : selectedTenant.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedTenant.primaryEmail || selectedTenant.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedTenant.phone || 'N/A'}</div>
                    <div><span className="font-medium">NIC:</span> {selectedTenant.nic || 'N/A'}</div>
                    <div><span className="font-medium">Nationality:</span> {selectedTenant.nationality || 'N/A'}</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedTenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        selectedTenant.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedTenant.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Phone size={18} />
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Secondary Email:</span> {selectedTenant.secondaryEmail || 'N/A'}</div>
                    <div><span className="font-medium">Secondary Phone:</span> {selectedTenant.secondaryPhone || 'N/A'}</div>
                    {selectedTenant.emergencyContact && (
                      <>
                        <div><span className="font-medium">Emergency Contact:</span> {selectedTenant.emergencyContact.name || 'N/A'}</div>
                        <div><span className="font-medium">Relationship:</span> {selectedTenant.emergencyContact.relationship || 'N/A'}</div>
                        <div><span className="font-medium">Emergency Phone:</span> {selectedTenant.emergencyContact.phone || 'N/A'}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                {selectedTenant.address && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <MapPin size={18} />
                      Address
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Street:</span> {selectedTenant.address.street || 'N/A'}</div>
                      <div><span className="font-medium">City:</span> {selectedTenant.address.city || 'N/A'}</div>
                      <div><span className="font-medium">State:</span> {selectedTenant.address.state || 'N/A'}</div>
                      <div><span className="font-medium">ZIP:</span> {selectedTenant.address.zipCode || 'N/A'}</div>
                      <div><span className="font-medium">Country:</span> {selectedTenant.address.country || 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* Employment Information */}
                {selectedTenant.employment && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Briefcase size={18} />
                      Employment
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Company:</span> {selectedTenant.employment.company || 'N/A'}</div>
                      <div><span className="font-medium">Position:</span> {selectedTenant.employment.position || 'N/A'}</div>
                      <div><span className="font-medium">Monthly Income:</span> {selectedTenant.employment.monthlyIncome ? `$${selectedTenant.employment.monthlyIncome}` : 'N/A'}</div>
                      <div><span className="font-medium">Type:</span> {selectedTenant.employment.employmentType ? selectedTenant.employment.employmentType.replace('_', ' ') : 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>

              {selectedTenant.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    Notes
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {selectedTenant.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedTenant);
                  }}
                  className="btn bg-blue-600 hover:bg-blue-700"
                >
                  Edit Tenant
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn bg-gray-500 hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


