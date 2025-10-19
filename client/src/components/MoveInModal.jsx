import { useState, useEffect } from 'react';
import { Home, User, Calendar, DollarSign, FileText } from 'lucide-react';
import api from '../lib/api.js';

const MoveInModal = ({ isOpen, onClose, unit, property, onSuccess }) => {
  const [formData, setFormData] = useState({
    tenantId: '',
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: unit?.rentAmount || '',
    securityDeposit: '',
    terms: {
      lateFeeAmount: 50,
      lateFeeAfterDays: 5,
      noticePeriodDays: 30,
      petAllowed: false,
      smokingAllowed: false
    }
  });
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTenants();
      // Set default dates
      const today = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(today.getFullYear() + 1);
      
      setFormData(prev => ({
        ...prev,
        leaseStartDate: today.toISOString().split('T')[0],
        leaseEndDate: oneYearLater.toISOString().split('T')[0],
        monthlyRent: unit?.rentAmount || ''
      }));
    }
  }, [isOpen, unit]);

  const loadTenants = async () => {
    try {
      const res = await api.get('/move-in/tenants');
      setTenants(res.data);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
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
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/move-in/${property._id}/${unit._id}`, formData);
      
      // Show success message
      alert('Move-in successful! Rent agreement has been generated.');
      
      // Download the PDF
      if (response.data.lease && response.data.lease._id) {
        try {
          const pdfResponse = await fetch(`/api/move-in/agreement/${response.data.lease._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (pdfResponse.ok) {
            const blob = await pdfResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rent-agreement-${response.data.lease.agreementNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            console.error('Failed to download PDF:', pdfResponse.statusText);
            alert('Move-in successful, but PDF download failed. You can download it later from the lease records.');
          }
        } catch (pdfError) {
          console.error('Error downloading PDF:', pdfError);
          alert('Move-in successful, but PDF download failed. You can download it later from the lease records.');
        }
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error processing move-in');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Home size={24} />
              Move Tenant In
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Unit Information */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Unit Information</h3>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div><strong>Property:</strong> {property?.title}</div>
              <div><strong>Unit:</strong> {unit?.name}</div>
              <div><strong>Type:</strong> {unit?.type}</div>
              <div><strong>Size:</strong> {unit?.sizeSqFt} sq ft</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tenant Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Select Tenant *
              </label>
              <select
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.tenantId}
                onChange={(e) => handleInputChange('tenantId', e.target.value)}
                required
              >
                <option value="">Choose a tenant...</option>
                {tenants.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} ({tenant.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Lease Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Lease Start Date *
                </label>
                <input
                  type="date"
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.leaseStartDate}
                  onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Lease End Date *
                </label>
                <input
                  type="date"
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.leaseEndDate}
                  onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Monthly Rent *
                </label>
                <input
                  type="number"
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.monthlyRent}
                  onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Security Deposit
                </label>
                <input
                  type="number"
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.securityDeposit}
                  onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Terms & Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Late Fee Amount
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.terms.lateFeeAmount}
                    onChange={(e) => handleInputChange('terms.lateFeeAmount', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Late Fee After (Days)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.terms.lateFeeAfterDays}
                    onChange={(e) => handleInputChange('terms.lateFeeAfterDays', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Notice Period (Days)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.terms.noticePeriodDays}
                    onChange={(e) => handleInputChange('terms.noticePeriodDays', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.terms.petAllowed}
                    onChange={(e) => handleInputChange('terms.petAllowed', e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Pets Allowed</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.terms.smokingAllowed}
                    onChange={(e) => handleInputChange('terms.smokingAllowed', e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Smoking Allowed</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm Move-In'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MoveInModal;
