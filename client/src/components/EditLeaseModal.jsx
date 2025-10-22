import { useState, useEffect } from 'react';
import { 
  X, Save, Calendar, DollarSign, FileText, User, Building, 
  Mail, Phone, CreditCard, ChevronDown, ChevronUp, AlertCircle, 
  Zap, Upload, File, CheckCircle, Download
} from 'lucide-react';
import api from '../lib/api.js';
import { useToast } from '../components/ToastContainer.jsx';

export default function EditLeaseModal({ isOpen, onClose, unit, property, onSuccess }) {
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    // Tenant Information
    tenantId: '',
    tenantName: '',
    contactNumber: '',
    emailAddress: '',
    nationalId: '',
    emergencyContact: '',
    
    // Lease Details
    leaseStartDate: '',
    leaseEndDate: '',
    leaseDuration: 12,
    contractNumber: '',
    rentType: 'MONTHLY',
    
    // Financial Details
    monthlyRent: '',
    securityDeposit: '',
    advancePayment: '',
    paymentMethod: 'BANK_TRANSFER',
    
    // Utilities & Charges
    electricityMeterNo: '',
    electricityInitialReading: '',
    waterMeterNo: '',
    waterInitialReading: '',
    gasFee: '',
    internetFee: '',
    maintenanceFee: '',
    
    // Documents
    documents: {
      signedLease: null,
      idProof: null,
      depositReceipt: null,
      moveInInspection: null
    },
    
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [lease, setLease] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [expandedSections, setExpandedSections] = useState([1, 2, 3, 4, 5]);
  const [hasCollectedRent, setHasCollectedRent] = useState(false);
  const [checkingRent, setCheckingRent] = useState(true);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [updatedLeaseData, setUpdatedLeaseData] = useState(null);

  useEffect(() => {
    if (isOpen && unit) {
      loadLeaseData();
      checkRentCollection();
      loadTenants();
    }
  }, [isOpen, unit]);

  // Auto-calculate lease duration when dates change
  useEffect(() => {
    if (formData.leaseStartDate && formData.leaseEndDate) {
      const start = new Date(formData.leaseStartDate);
      const end = new Date(formData.leaseEndDate);
      const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
      if (months !== formData.leaseDuration) {
        setFormData(prev => ({ ...prev, leaseDuration: Math.max(0, months) }));
      }
    }
  }, [formData.leaseStartDate, formData.leaseEndDate]);

  const loadTenants = async () => {
    try {
      const res = await api.get('/move-in/tenants');
      setTenants(res.data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  // Check if rent has been collected for this lease
  const checkRentCollection = async () => {
    if (!unit) return;
    
    setCheckingRent(true);
    try {
      const response = await api.get(`/payments?unitId=${unit._id}&status=SUCCEEDED`);
      const hasPayments = response.data && response.data.length > 0;
      setHasCollectedRent(hasPayments);
      
      if (hasPayments) {
        toast.warning('Rent has been collected for this lease. Editing is restricted.');
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
            const tenantData = tenantRes.data;
            setTenant(tenantData);
            
            setFormData(prev => ({
              ...prev,
              tenantId: tenantData._id,
              tenantName: `${tenantData.firstName || ''} ${tenantData.middleName || ''} ${tenantData.lastName || ''}`.trim(),
              contactNumber: tenantData.phone || '',
              emailAddress: tenantData.email || tenantData.primaryEmail || '',
              nationalId: tenantData.nic || tenantData.passportNo || '',
              emergencyContact: tenantData.emergencyContact?.phone || '',
          leaseStartDate: unitLease.leaseStartDate ? new Date(unitLease.leaseStartDate).toISOString().split('T')[0] : '',
          leaseEndDate: unitLease.leaseEndDate ? new Date(unitLease.leaseEndDate).toISOString().split('T')[0] : '',
          monthlyRent: unitLease.monthlyRent || '',
          securityDeposit: unitLease.securityDeposit || '',
              electricityMeterNo: unit.electricityMeterNo || '',
              waterMeterNo: unit.waterMeterNo || '',
          notes: unitLease.notes || ''
            }));
          } catch (error) {
            console.error('Error loading tenant:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading lease data:', error);
      toast.error('Failed to load lease data');
    }
  };

  const handleTenantSelect = async (tenantId) => {
    setFormData(prev => ({ ...prev, tenantId }));
    
    if (tenantId) {
      try {
        const res = await api.get(`/tenants/${tenantId}`);
        const tenant = res.data;
        
        setFormData(prev => ({
          ...prev,
          tenantName: `${tenant.firstName} ${tenant.middleName || ''} ${tenant.lastName}`.trim(),
          contactNumber: tenant.phone || '',
          emailAddress: tenant.email || tenant.primaryEmail || '',
          nationalId: tenant.nic || tenant.passportNo || ''
        }));
        
        setTenant(tenant);
        toast.success('Tenant details loaded');
      } catch (error) {
        console.error('Error loading tenant:', error);
        toast.error('Failed to load tenant details');
      }
    }
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('document', file);
      uploadFormData.append('type', field);
      
      const response = await api.post('/move-in/upload-document', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [field]: percentCompleted }));
        }
      });
      
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [field]: {
            url: response.data.url,
            filename: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
          }
        }
      }));
      
      setUploadProgress(prev => ({ ...prev, [field]: 100 }));
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      setUploadProgress(prev => ({ ...prev, [field]: null }));
    }
  };

  const removeDocument = (field) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: null
      }
    }));
    setUploadProgress(prev => ({ ...prev, [field]: null }));
    toast.info('Document removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lease) return;

    if (hasCollectedRent) {
      toast.error('Cannot update lease after rent has been collected for this lease');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(`/move-in/leases/${lease._id}`, {
        leaseStartDate: formData.leaseStartDate,
        leaseEndDate: formData.leaseEndDate,
        monthlyRent: parseFloat(formData.monthlyRent),
        securityDeposit: parseFloat(formData.securityDeposit || 0),
        terms: {
          lateFeeAmount: 50,
          lateFeeAfterDays: 5,
          noticePeriodDays: 30,
          petAllowed: false,
          smokingAllowed: false
        },
        notes: formData.notes
      });

      // Store updated lease data and show success modal
      setUpdatedLeaseData(response.data);
      setShowSuccessModal(true);
      toast.success('Lease updated successfully!');
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const downloadPdf = async () => {
    if (!updatedLeaseData) return;
    
    try {
      const pdfResponse = await fetch(`/api/move-in/agreement/${updatedLeaseData._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Open in new tab
        window.open(url, '_blank');
        
        // Also trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `rent-agreement-${updatedLeaseData.agreementNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        toast.success('Agreement downloaded successfully');
      } else {
        toast.error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    onSuccess();
    onClose();
  };

  if (!isOpen || !unit) return null;

  // If showing success modal
  if (showSuccessModal && updatedLeaseData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle size={24} className="text-green-500" />
                Lease Updated Successfully!
              </h2>
              <button
                onClick={handleCloseSuccess}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg mb-6">
              <p className="text-green-800 dark:text-green-200">
                The lease for Unit {unit?.name} at {property?.title} has been successfully updated.
                A new rent agreement PDF has been generated with the updated information.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Updated Lease Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-gray-500 dark:text-gray-400">Agreement Number:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{updatedLeaseData.agreementNumber}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-gray-500 dark:text-gray-400">Lease Period:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(updatedLeaseData.leaseStartDate).toLocaleDateString()} - {new Date(updatedLeaseData.leaseEndDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-gray-500 dark:text-gray-400">Monthly Rent:</span>
                  <div className="font-medium text-gray-900 dark:text-white">${updatedLeaseData.monthlyRent?.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-gray-500 dark:text-gray-400">Security Deposit:</span>
                  <div className="font-medium text-gray-900 dark:text-white">${updatedLeaseData.securityDeposit?.toLocaleString() || 0}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <div className="font-medium text-green-600">Active</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(updatedLeaseData.updatedAt || Date.now()).toLocaleDateString()} {new Date(updatedLeaseData.updatedAt || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Updated Rent Agreement PDF</h4>
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText size={32} className="text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Rent Agreement - {updatedLeaseData.agreementNumber}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Updated PDF with new lease details</div>
                    </div>
                  </div>
                  <button
                    onClick={downloadPdf}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Download Updated Agreement PDF
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseSuccess}
                  className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                {property?.title} - Unit {unit.name}
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
            
            {/* Section 1: Property Information Card */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(1)}
                className="w-full bg-blue-50 dark:bg-blue-900 p-4 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building size={20} className="text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">1. Property Information</h3>
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

            {/* Section 2: Tenant Information */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(2)}
                className="w-full bg-green-50 dark:bg-green-900 p-4 flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User size={20} className="text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">2. Tenant Information</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tenant contact and identification</p>
                  </div>
                </div>
                {expandedSections.includes(2) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(2) && (
                <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Select Tenant {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                    </label>
                    <select
                      value={formData.tenantId}
                      onChange={(e) => handleTenantSelect(e.target.value)}
                      disabled={hasCollectedRent}
                      className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Choose a tenant...</option>
                      {tenants.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.middleName ? `${t.middleName} ` : ''}{t.lastName} | {t.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Tenant Name {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.tenantName}
                        readOnly
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white ${hasCollectedRent ? 'opacity-60' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Contact Number {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="tel"
                        value={formData.contactNumber}
                        readOnly
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white ${hasCollectedRent ? 'opacity-60' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Email Address {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="email"
                        value={formData.emailAddress}
                        readOnly
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white ${hasCollectedRent ? 'opacity-60' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        National ID / Passport {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.nationalId}
                        readOnly
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white ${hasCollectedRent ? 'opacity-60' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Lease Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(3)}
                className="w-full bg-purple-50 dark:bg-purple-900 p-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">3. Lease Details</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Lease period and terms</p>
                  </div>
                </div>
                {expandedSections.includes(3) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(3) && (
                <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Calendar size={16} />
                        Lease Start Date <span className="text-red-500">*</span>
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
              </label>
              <input
                type="date"
                value={formData.leaseStartDate}
                        onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                required
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Calendar size={16} />
                        Lease End Date <span className="text-red-500">*</span>
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
              </label>
              <input
                type="date"
                value={formData.leaseEndDate}
                        onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                required
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Lease Duration (Months)
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-calculated</span>
                      </label>
                      <input
                        type="number"
                        value={formData.leaseDuration}
                        readOnly
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Rent Type {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
                      </label>
                      <select
                        value={formData.rentType}
                        onChange={(e) => handleInputChange('rentType', e.target.value)}
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Financial Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(4)}
                className="w-full bg-yellow-50 dark:bg-yellow-900 p-4 flex items-center justify-between hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DollarSign size={20} className="text-yellow-600 dark:text-yellow-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">4. Financial Details</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rent and payment information</p>
            </div>
          </div>
                {expandedSections.includes(4) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {expandedSections.includes(4) && (
                <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <DollarSign size={16} />
                        Monthly Rent ($) <span className="text-red-500">*</span>
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
              </label>
              <input
                type="number"
                value={formData.monthlyRent}
                        onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                required
                min="0"
                step="0.01"
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <DollarSign size={16} />
                Security Deposit ($)
                        {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
              </label>
              <input
                type="number"
                value={formData.securityDeposit}
                        onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
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

            {/* Section 5: Utilities & Charges */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(5)}
                className="w-full bg-orange-50 dark:bg-orange-900 p-4 flex items-center justify-between hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Zap size={20} className="text-orange-600 dark:text-orange-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">5. Utilities & Charges</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Meter readings and additional fees</p>
                  </div>
                </div>
                {expandedSections.includes(5) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(5) && (
                <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Electricity Meter No {hasCollectedRent && <span className="text-xs text-red-500">(Locked)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.electricityMeterNo}
                        onChange={(e) => handleInputChange('electricityMeterNo', e.target.value)}
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="Meter number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Initial Reading {hasCollectedRent && <span className="text-xs text-red-500">(Locked)</span>}
                      </label>
                      <input
                        type="number"
                        value={formData.electricityInitialReading}
                        onChange={(e) => handleInputChange('electricityInitialReading', e.target.value)}
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Water Meter No {hasCollectedRent && <span className="text-xs text-red-500">(Locked)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.waterMeterNo}
                        onChange={(e) => handleInputChange('waterMeterNo', e.target.value)}
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="Meter number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Initial Reading {hasCollectedRent && <span className="text-xs text-red-500">(Locked)</span>}
                      </label>
                      <input
                        type="number"
                        value={formData.waterInitialReading}
                        onChange={(e) => handleInputChange('waterInitialReading', e.target.value)}
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Gas Fee (Monthly) {hasCollectedRent && <span className="text-xs text-red-500">(Locked)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                        value={formData.gasFee}
                        onChange={(e) => handleInputChange('gasFee', e.target.value)}
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="0.00"
                />
              </div>
              <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Internet Fee (Monthly) {hasCollectedRent && <span className="text-xs text-red-500">(Locked)</span>}
                </label>
                <input
                  type="number"
                        step="0.01"
                        value={formData.internetFee}
                        onChange={(e) => handleInputChange('internetFee', e.target.value)}
                        disabled={hasCollectedRent}
                        className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="0.00"
                />
              </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: Documents */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(6)}
                className="w-full bg-red-50 dark:bg-red-900 p-4 flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-red-600 dark:text-red-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">6. Documents</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Upload or update documents (max 10MB each)</p>
                  </div>
                </div>
                {expandedSections.includes(6) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(6) && (
                <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
                  {[
                    { key: 'signedLease', label: 'Signed Lease Agreement', accept: '.pdf,.docx' },
                    { key: 'idProof', label: 'ID Proof', accept: 'image/*,.pdf' },
                    { key: 'depositReceipt', label: 'Deposit Receipt', accept: 'image/*,.pdf' },
                    { key: 'moveInInspection', label: 'Move-In Inspection Report', accept: 'image/*,.pdf' }
                  ].map(({ key, label, accept }) => (
                    <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        {label} {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
              </label>
                      
                      {!formData.documents[key] ? (
                        <div className="relative">
                <input
                            type="file"
                            accept={accept}
                            onChange={(e) => handleFileUpload(key, e.target.files[0])}
                            disabled={hasCollectedRent}
                            className="hidden"
                            id={`upload-${key}`}
                          />
                          <label
                            htmlFor={`upload-${key}`}
                            className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <Upload size={20} className="text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload</span>
              </label>
                          
                          {uploadProgress[key] > 0 && uploadProgress[key] < 100 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${uploadProgress[key]}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{uploadProgress[key]}% uploaded</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900 rounded">
                          <div className="flex items-center gap-2">
                            <File size={16} className="text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-800 dark:text-green-200">
                              {formData.documents[key].filename}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400">
                              ({(formData.documents[key].size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          {!hasCollectedRent && (
                            <button
                              type="button"
                              onClick={() => removeDocument(key)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>

            {/* Additional Notes */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Additional Notes {hasCollectedRent && <span className="text-xs text-red-500 ml-2">(Locked)</span>}
            </label>
            <textarea
              value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
                disabled={hasCollectedRent}
                className={`w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${hasCollectedRent ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="Any additional terms or notes..."
            />
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
