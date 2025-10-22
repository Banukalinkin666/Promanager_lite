import { useState, useEffect } from 'react';
import { 
  X, Save, Calendar, DollarSign, FileText, User, Building, 
  Mail, Phone, CreditCard, ChevronDown, ChevronUp, AlertCircle, Home
} from 'lucide-react';
import api from '../lib/api.js';
import { useToast } from '../components/ToastContainer.jsx';

export default function EditLeaseModal({ isOpen, onClose, unit, property, onSuccess }) {
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    securityDeposit: '',
    terms: {
      lateFeeAmount: 50,
      lateFeeAfterDays: 5,
      noticePeriodDays: 30,
      petAllowed: false,
      smokingAllowed: false
    },
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [lease, setLease] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [expandedSections, setExpandedSections] = useState([1, 2, 3]);
  const [hasCollectedRent, setHasCollectedRent] = useState(false);
  const [checkingRent, setCheckingRent] = useState(true);

  useEffect(() => {
    if (isOpen && unit) {
      loadLeaseData();
      checkRentCollection();
    }
  }, [isOpen, unit]);

  // Check if rent has been collected for this lease
  const checkRentCollection = async () => {
    if (!unit) return;
    
    setCheckingRent(true);
    try {
      const response = await api.get(`/payments?unitId=${unit._id}&status=SUCCEEDED`);
      const hasPayments = response.data && response.data.length > 0;
      setHasCollectedRent(hasPayments);
      
      if (hasPayments) {
        toast.warning('Rent has been collected for this lease. Only limited fields can be edited.');
      }
    } catch (error) {
      console.error('Error checking rent collection:', error);
      setHasCollectedRent(false);
    } finally {
      setCheckingRent(false);
    }
  };

  const loadLeaseData = async () => {
    try {
      const response = await api.get('/move-in/leases');
      const leases = response.data || [];
      const unitLease = leases.find(l => l.unit === unit._id);
      
      if (unitLease) {
        setLease(unitLease);
        
        // Load tenant data
        if (unitLease.tenant) {
          try {
            const tenantRes = await api.get(`/tenants/${unitLease.tenant._id || unitLease.tenant}`);
            setTenant(tenantRes.data);
          } catch (error) {
            console.error('Error loading tenant:', error);
          }
        }
        
        setFormData({
          leaseStartDate: unitLease.leaseStartDate ? new Date(unitLease.leaseStartDate).toISOString().split('T')[0] : '',
          leaseEndDate: unitLease.leaseEndDate ? new Date(unitLease.leaseEndDate).toISOString().split('T')[0] : '',
          monthlyRent: unitLease.monthlyRent || '',
          securityDeposit: unitLease.securityDeposit || '',
          terms: {
            lateFeeAmount: unitLease.terms?.lateFeeAmount || 50,
            lateFeeAfterDays: unitLease.terms?.lateFeeAfterDays || 5,
            noticePeriodDays: unitLease.terms?.noticePeriodDays || 30,
            petAllowed: unitLease.terms?.petAllowed || false,
            smokingAllowed: unitLease.terms?.smokingAllowed || false
          },
          notes: unitLease.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading lease data:', error);
      toast.error('Failed to load lease data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lease) return;

    // Double-check rent collection status before submitting
    if (hasCollectedRent) {
      toast.error('Cannot update lease after rent has been collected for this lease');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/move-in/leases/${lease._id}`, {
        leaseStartDate: formData.leaseStartDate,
        leaseEndDate: formData.leaseEndDate,
        monthlyRent: parseFloat(formData.monthlyRent),
        securityDeposit: parseFloat(formData.securityDeposit || 0),
        terms: formData.terms,
        notes: formData.notes
      });

      toast.success('Lease updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating lease:', error);
      
      let errorMessage = 'Failed to update lease';
      
      if (error.response?.status === 403) {
        errorMessage = 'Access denied. Only admins and owners can update leases';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Cannot edit lease after rent has been collected';
      } else if (error.response?.status === 404) {
        errorMessage = 'Lease not found';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (!isOpen || !unit) return null;

  // Calculate lease duration
  const leaseDuration = formData.leaseStartDate && formData.leaseEndDate
    ? Math.round((new Date(formData.leaseEndDate) - new Date(formData.leaseStartDate)) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
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
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Tenant Information Display */}
        {tenant && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                {tenant.firstName?.[0]}{tenant.lastName?.[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {tenant.firstName} {tenant.middleName || ''} {tenant.lastName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  {tenant.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Mail size={14} />
                      <span>{tenant.email}</span>
                    </div>
                  )}
                  {tenant.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Phone size={14} />
                      <span>{tenant.phone}</span>
                    </div>
                  )}
                  {(tenant.nic || tenant.passportNo) && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <CreditCard size={14} />
                      <span>{tenant.nic || tenant.passportNo}</span>
                    </div>
                  )}
                </div>
              </div>
              {formData.leaseStartDate && formData.leaseEndDate && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lease Period</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(formData.leaseStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">to</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(formData.leaseEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ({leaseDuration} months)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rent Collection Warning Banner */}
        {hasCollectedRent && (
          <div className="p-4 bg-red-50 dark:bg-red-900 border-y border-red-200 dark:border-red-700">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                  Lease Editing Restricted
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This lease cannot be edited because rent payment(s) have already been collected. 
                  To protect financial records integrity, lease details are locked after the first payment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Rent Collected - Full Edit Mode */}
        {!hasCollectedRent && !checkingRent && (
          <div className="p-4 bg-green-50 dark:bg-green-900 border-y border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✓ No rent collected yet - All lease details can be updated freely
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Property Information Card */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(1)}
                className="w-full bg-blue-50 dark:bg-blue-900 p-4 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building size={20} className="text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Property Information</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">View property and unit details</p>
                  </div>
                </div>
                {expandedSections.includes(1) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(1) && (
                <div className="p-4 bg-white dark:bg-gray-800">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Property Name</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{property?.title || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unit Number</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{unit?.name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unit Type</div>
                        <div className="font-semibold text-gray-900 dark:text-white capitalize">{unit?.type || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Size</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{unit?.sizeSqFt || 'N/A'} sq ft</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Floor</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{unit?.floor || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bedrooms / Bathrooms</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {unit?.bedrooms || 0} / {unit?.bathrooms || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lease Dates & Financial Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(2)}
                className="w-full bg-green-50 dark:bg-green-900 p-4 flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Lease Dates & Financial Details</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Update lease period and rent amounts</p>
                  </div>
                </div>
                {expandedSections.includes(2) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(2) && (
                <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar size={16} />
                        Lease Start Date <span className="text-red-500">*</span>
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="date"
                        name="leaseStartDate"
                        value={formData.leaseStartDate}
                        onChange={handleInputChange}
                        required
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar size={16} />
                        Lease End Date <span className="text-red-500">*</span>
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="date"
                        name="leaseEndDate"
                        value={formData.leaseEndDate}
                        onChange={handleInputChange}
                        required
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <DollarSign size={16} />
                        Monthly Rent ($) <span className="text-red-500">*</span>
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="number"
                        name="monthlyRent"
                        value={formData.monthlyRent}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <DollarSign size={16} />
                        Security Deposit ($)
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="number"
                        name="securityDeposit"
                        value={formData.securityDeposit}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lease Terms */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(3)}
                className="w-full bg-purple-50 dark:bg-purple-900 p-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Lease Terms & Policies</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Late fees, notice period, and policies</p>
                  </div>
                </div>
                {expandedSections.includes(3) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(3) && (
                <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Late Fee Amount ($)
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="number"
                        name="terms.lateFeeAmount"
                        value={formData.terms.lateFeeAmount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Late Fee After (days)
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="number"
                        name="terms.lateFeeAfterDays"
                        value={formData.terms.lateFeeAfterDays}
                        onChange={handleInputChange}
                        min="0"
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notice Period (days)
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="number"
                        name="terms.noticePeriodDays"
                        value={formData.terms.noticePeriodDays}
                        onChange={handleInputChange}
                        min="0"
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-6 pt-2">
                    <label className={`flex items-center gap-2 ${hasCollectedRent ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        name="terms.petAllowed"
                        checked={formData.terms.petAllowed}
                        onChange={handleInputChange}
                        disabled={hasCollectedRent}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Pets Allowed {hasCollectedRent && <span className="text-xs text-red-500">(Locked)</span>}
                      </span>
                    </label>
                    <label className={`flex items-center gap-2 ${hasCollectedRent ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        name="terms.smokingAllowed"
                        checked={formData.terms.smokingAllowed}
                        onChange={handleInputChange}
                        disabled={hasCollectedRent}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Smoking Allowed {hasCollectedRent && <span className="text-xs text-red-500">(Locked)</span>}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Notes
                      {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      disabled={hasCollectedRent}
                      className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder="Any additional terms or notes..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors font-medium"
            >
              {hasCollectedRent ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || hasCollectedRent}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium text-white ${
                hasCollectedRent 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              }`}
              title={hasCollectedRent ? 'Cannot update lease after rent collection' : ''}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  {hasCollectedRent ? 'Locked - Rent Collected' : 'Update Lease'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
