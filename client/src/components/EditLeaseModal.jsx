import { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, FileText } from 'lucide-react';
import api from '../lib/api.js';

export default function EditLeaseModal({ isOpen, onClose, unit, onSuccess }) {
  const [formData, setFormData] = useState({
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    securityDeposit: '',
    terms: {
      lateFees: '',
      noticePeriod: '',
      pets: false,
      smoking: false
    },
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [lease, setLease] = useState(null);

  useEffect(() => {
    if (isOpen && unit) {
      loadLeaseData();
    }
  }, [isOpen, unit]);

  const loadLeaseData = async () => {
    try {
      const response = await api.get('/move-in/leases');
      const leases = response.data || [];
      const unitLease = leases.find(l => l.unit === unit._id);
      
      if (unitLease) {
        setLease(unitLease);
        setFormData({
          leaseStartDate: unitLease.leaseStartDate ? new Date(unitLease.leaseStartDate).toISOString().split('T')[0] : '',
          leaseEndDate: unitLease.leaseEndDate ? new Date(unitLease.leaseEndDate).toISOString().split('T')[0] : '',
          monthlyRent: unitLease.monthlyRent || '',
          securityDeposit: unitLease.securityDeposit || '',
          terms: {
            lateFees: unitLease.terms?.lateFees || '',
            noticePeriod: unitLease.terms?.noticePeriod || '',
            pets: unitLease.terms?.pets || false,
            smoking: unitLease.terms?.smoking || false
          },
          notes: unitLease.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading lease data:', error);
      alert('Failed to load lease data.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lease) return;

    setLoading(true);
    try {
      const response = await api.put(`/move-in/leases/${lease._id}`, {
        leaseStartDate: formData.leaseStartDate,
        leaseEndDate: formData.leaseEndDate,
        monthlyRent: parseFloat(formData.monthlyRent),
        securityDeposit: parseFloat(formData.securityDeposit),
        terms: formData.terms,
        notes: formData.notes
      });

      console.log('Lease update response:', response);
      alert('Lease updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating lease:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to update lease. Please try again.';
      
      if (error.response?.status === 403) {
        errorMessage = 'Access denied. Only admins and owners can update leases.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Cannot edit lease after rent has been collected.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Lease not found.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('terms.')) {
      const termKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        terms: {
          ...prev.terms,
          [termKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Lease Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unit {unit.name} - {unit.type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lease Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Lease Start Date
              </label>
              <input
                type="date"
                name="leaseStartDate"
                value={formData.leaseStartDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Lease End Date
              </label>
              <input
                type="date"
                name="leaseEndDate"
                value={formData.leaseEndDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign size={16} className="inline mr-2" />
                Monthly Rent ($)
              </label>
              <input
                type="number"
                name="monthlyRent"
                value={formData.monthlyRent}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign size={16} className="inline mr-2" />
                Security Deposit ($)
              </label>
              <input
                type="number"
                name="securityDeposit"
                value={formData.securityDeposit}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Lease Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Lease Terms</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Late Fees ($)
                </label>
                <input
                  type="number"
                  name="terms.lateFees"
                  value={formData.terms.lateFees}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notice Period (days)
                </label>
                <input
                  type="number"
                  name="terms.noticePeriod"
                  value={formData.terms.noticePeriod}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="terms.pets"
                  checked={formData.terms.pets}
                  onChange={handleInputChange}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Pets Allowed</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="terms.smoking"
                  checked={formData.terms.smoking}
                  onChange={handleInputChange}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Smoking Allowed</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Any additional terms or notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Lease
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
