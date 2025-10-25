import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Upload, FileText } from 'lucide-react';
import { useToast } from '../components/ToastContainer';
import api from '../lib/api';

const LeaseEditPage = () => {
  const { propertyId, unitId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: 0,
    securityDeposit: 0,
    advancePayment: 0,
    terms: {
      lateFeeAmount: 50,
      lateFeeAfterDays: 5,
      noticePeriodDays: 30,
      petAllowed: false,
      smokingAllowed: false
    },
    documents: {
      signedLease: null,
      idProof: null,
      depositReceipt: null,
      moveInInspection: null
    },
    notes: ''
  });

  useEffect(() => {
    if (location.state?.property && location.state?.unit && location.state?.lease) {
      setProperty(location.state.property);
      setUnit(location.state.unit);
      setLease(location.state.lease);
      loadLeaseData(location.state.lease);
      setLoading(false);
    } else {
      loadData();
    }
  }, [location.state, propertyId, unitId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [propertyResponse, unitResponse, leaseResponse] = await Promise.all([
        api.get(`/properties/${propertyId}`),
        api.get(`/properties/${propertyId}/units/${unitId}`),
        api.get(`/move-in/leases?unitId=${unitId}`)
      ]);
      
      setProperty(propertyResponse.data);
      setUnit(unitResponse.data);
      
      if (leaseResponse.data && leaseResponse.data.length > 0) {
        setLease(leaseResponse.data[0]);
        loadLeaseData(leaseResponse.data[0]);
      } else {
        setError('No lease found for this unit');
      }
    } catch (err) {
      setError('Failed to load lease data');
      console.error('Error loading lease data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaseData = (leaseData) => {
    setFormData({
      leaseStartDate: leaseData.leaseStartDate ? new Date(leaseData.leaseStartDate).toISOString().split('T')[0] : '',
      leaseEndDate: leaseData.leaseEndDate ? new Date(leaseData.leaseEndDate).toISOString().split('T')[0] : '',
      monthlyRent: leaseData.monthlyRent || 0,
      securityDeposit: leaseData.securityDeposit || 0,
      advancePayment: leaseData.advancePayment || 0,
      terms: {
        lateFeeAmount: leaseData.terms?.lateFeeAmount || 50,
        lateFeeAfterDays: leaseData.terms?.lateFeeAfterDays || 5,
        noticePeriodDays: leaseData.terms?.noticePeriodDays || 30,
        petAllowed: leaseData.terms?.petAllowed || false,
        smokingAllowed: leaseData.terms?.smokingAllowed || false
      },
      documents: leaseData.documents || {
        signedLease: null,
        idProof: null,
        depositReceipt: null,
        moveInInspection: null
      },
      notes: leaseData.notes || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
      }));
    }
  };

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', documentType);

      const response = await api.post('/move-in/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentType]: response.data
        }
      }));

      toast.success(`${documentType} uploaded successfully!`);
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Failed to upload document. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/move-in/leases/${lease._id}`, formData);
      toast.success('Lease updated successfully!');
      navigate(`/properties/${propertyId}/units/${unitId}`);
    } catch (err) {
      console.error('Error updating lease:', err);
      toast.error('Failed to update lease. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lease data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/properties/${propertyId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/properties/${propertyId}/units/${unitId}`)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Unit
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Lease
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {property?.title} - {unit?.name} - {lease?.agreementNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              {/* Lease Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lease Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lease Start Date
                    </label>
                    <input
                      type="date"
                      name="leaseStartDate"
                      value={formData.leaseStartDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lease End Date
                    </label>
                    <input
                      type="date"
                      name="leaseEndDate"
                      value={formData.leaseEndDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monthly Rent ($)
                    </label>
                    <input
                      type="number"
                      name="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Security Deposit ($)
                    </label>
                    <input
                      type="number"
                      name="securityDeposit"
                      value={formData.securityDeposit}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Advance Payment ($)
                    </label>
                    <input
                      type="number"
                      name="advancePayment"
                      value={formData.advancePayment}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Terms and Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Late Fee Amount ($)
                    </label>
                    <input
                      type="number"
                      name="terms.lateFeeAmount"
                      value={formData.terms.lateFeeAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Late Fee After (Days)
                    </label>
                    <input
                      type="number"
                      name="terms.lateFeeAfterDays"
                      value={formData.terms.lateFeeAfterDays}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notice Period (Days)
                    </label>
                    <input
                      type="number"
                      name="terms.noticePeriodDays"
                      value={formData.terms.noticePeriodDays}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="terms.petAllowed"
                        checked={formData.terms.petAllowed}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Pets Allowed
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="terms.smokingAllowed"
                        checked={formData.terms.smokingAllowed}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Smoking Allowed
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'signedLease', label: 'Signed Lease Agreement' },
                    { key: 'idProof', label: 'ID Proof' },
                    { key: 'depositReceipt', label: 'Deposit Receipt' },
                    { key: 'moveInInspection', label: 'Move-In Inspection' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, key)}
                          className="hidden"
                          id={`file-${key}`}
                        />
                        <label
                          htmlFor={`file-${key}`}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <Upload size={16} />
                          Upload
                        </label>
                        {formData.documents[key] && (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <FileText size={16} />
                            Uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Additional notes about the lease..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(`/properties/${propertyId}/units/${unitId}`)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaseEditPage;
