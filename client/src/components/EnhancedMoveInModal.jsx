import { useState, useEffect } from 'react';
import { 
  Home, User, Calendar, DollarSign, FileText, Upload, X, ChevronDown, ChevronUp,
  Check, AlertCircle, Building, Mail, Phone, CreditCard, Zap, Droplets, File,
  Download, Eye, Edit2, Save, CheckCircle
} from 'lucide-react';
import api from '../lib/api.js';
import { useToast } from '../components/ToastContainer.jsx';

const EnhancedMoveInModal = ({ isOpen, onClose, unit, property, onSuccess }) => {
  const toast = useToast();
  
  // Progress tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSections, setCompletedSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState([1]); // Start with first section expanded
  
  // Form data state
  const [formData, setFormData] = useState({
    // Section 1: Property Information
    propertyName: '',
    propertyCode: '',
    unitNumber: '',
    unitName: '',
    propertyType: 'APARTMENT',
    location: '',
    moveInDate: new Date().toISOString().split('T')[0],
    moveOutDate: '',
    
    // Section 2: Tenant Information
    tenantId: '',
    tenantName: '',
    tenantCode: '',
    contactNumber: '',
    emailAddress: '',
    nationalId: '',
    emergencyContact: '',
    tenantType: 'INDIVIDUAL',
    
    // Section 3: Lease Details
    leaseStartDate: new Date().toISOString().split('T')[0],
    leaseEndDate: '',
    leaseDuration: 12,
    contractNumber: '',
    rentType: 'MONTHLY',
    renewalReminderDate: '',
    
    // Section 4: Financial/Payment Details
    monthlyRent: unit?.rentAmount || '',
    securityDeposit: '',
    advancePayment: '',
    paymentMethod: 'BANK_TRANSFER',
    nextRentDueDate: '',
    
    // Section 5: Utilities/Additional Charges
    electricityMeterNo: '',
    electricityInitialReading: '',
    waterMeterNo: '',
    waterInitialReading: '',
    gasFee: '',
    internetFee: '',
    maintenanceFee: '',
    otherCharges: [],
    
    // Section 6: Documents
    documents: {
      signedLease: null,
      idProof: null,
      depositReceipt: null,
      moveInInspection: null
    }
  });
  
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [isDraft, setIsDraft] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  const sections = [
    { id: 1, title: 'Property Information', icon: Building, subtitle: 'Property and unit details' },
    { id: 2, title: 'Tenant Information', icon: User, subtitle: 'Tenant contact and identification' },
    { id: 3, title: 'Lease Details', icon: Calendar, subtitle: 'Lease period and terms' },
    { id: 4, title: 'Financial Details', icon: DollarSign, subtitle: 'Rent and payment information' },
    { id: 5, title: 'Utilities & Charges', icon: Zap, subtitle: 'Meter readings and additional fees' },
    { id: 6, title: 'Documents', icon: FileText, subtitle: 'Upload required documents' }
  ];
  
  // Auto-fetch data when modal opens
  useEffect(() => {
    if (isOpen && property && unit) {
      // Check for existing draft
      const draftKey = `movein-draft-${property._id}-${unit._id}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setFormData(draftData);
          setIsDraft(true);
          toast.info(`Draft loaded from ${new Date(draftData.savedAt).toLocaleString()}`);
        } catch (error) {
          console.error('Error loading draft:', error);
          autoFetchPropertyData();
          calculateDefaultDates();
        }
      } else {
        autoFetchPropertyData();
        calculateDefaultDates();
      }
      
      loadTenants();
    }
  }, [isOpen, property, unit]);
  
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
  
  // Auto-calculate next rent due date
  useEffect(() => {
    if (formData.leaseStartDate && formData.rentType) {
      const start = new Date(formData.leaseStartDate);
      let dueDate = new Date(start);
      
      switch (formData.rentType) {
        case 'MONTHLY':
          dueDate.setMonth(start.getMonth() + 1);
          break;
        case 'QUARTERLY':
          dueDate.setMonth(start.getMonth() + 3);
          break;
        case 'YEARLY':
          dueDate.setFullYear(start.getFullYear() + 1);
          break;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        nextRentDueDate: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.leaseStartDate, formData.rentType]);
  
  const autoFetchPropertyData = () => {
    setFormData(prev => ({
      ...prev,
      propertyName: property?.title || '',
      propertyCode: property?._id?.substring(0, 8).toUpperCase() || '',
      unitNumber: unit?.name || '',
      unitName: unit?.name || '',
      propertyType: property?.type || 'APARTMENT',
      location: `${property?.address || ''}, ${property?.city || ''}, ${property?.state || ''}, ${property?.country || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
      monthlyRent: unit?.rentAmount || '',
      electricityMeterNo: unit?.electricityMeterNo || '',
      waterMeterNo: unit?.waterMeterNo || ''
    }));
  };
  
  const loadTenants = async () => {
    try {
      const res = await api.get('/move-in/tenants');
      setTenants(res.data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Failed to load tenants');
    }
  };
  
  const calculateDefaultDates = () => {
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);
    
    setFormData(prev => ({
      ...prev,
      leaseStartDate: today.toISOString().split('T')[0],
      leaseEndDate: oneYearLater.toISOString().split('T')[0],
      moveInDate: today.toISOString().split('T')[0]
    }));
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: null }));
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
          tenantCode: tenant._id?.substring(0, 8).toUpperCase() || '',
          contactNumber: tenant.phone || '',
          emailAddress: tenant.email || '',
          nationalId: tenant.nic || tenant.passportNo || '',
          tenantType: 'INDIVIDUAL'
        }));
        
        toast.success('Tenant details loaded successfully');
      } catch (error) {
        console.error('Error loading tenant:', error);
        toast.error('Failed to load tenant details');
      }
    }
  };
  
  const handleFileUpload = async (field, file) => {
    if (!file) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('document', file);
      uploadFormData.append('type', field);
      
      // Simulated upload with progress
      // In production, use actual upload endpoint with progress tracking
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
  
  const validateForm = () => {
    const newErrors = {};
    
    // Section 1: Property Information
    if (!formData.propertyName) newErrors.propertyName = 'Property name is required';
    if (!formData.unitNumber) newErrors.unitNumber = 'Unit number is required';
    if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
    if (!formData.location) newErrors.location = 'Location is required';
    
    // Section 2: Tenant Information
    if (!formData.tenantId) newErrors.tenantId = 'Please select a tenant';
    if (!formData.tenantName) newErrors.tenantName = 'Tenant name is required';
    if (!formData.tenantCode) newErrors.tenantCode = 'Tenant code is required';
    if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
    else if (!/^\+?[\d\s-()]+$/.test(formData.contactNumber)) newErrors.contactNumber = 'Invalid phone format';
    if (!formData.nationalId) newErrors.nationalId = 'National ID/Passport is required';
    if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Invalid email format';
    }
    
    // Section 3: Lease Details
    if (!formData.leaseStartDate) newErrors.leaseStartDate = 'Lease start date is required';
    if (!formData.leaseEndDate) newErrors.leaseEndDate = 'Lease end date is required';
    else if (new Date(formData.leaseEndDate) < new Date(formData.leaseStartDate)) {
      newErrors.leaseEndDate = 'End date must be after start date';
    }
    
    // Section 4: Financial Details
    if (!formData.monthlyRent) newErrors.monthlyRent = 'Monthly rent is required';
    else if (parseFloat(formData.monthlyRent) <= 0) newErrors.monthlyRent = 'Rent must be greater than 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSaveDraft = async () => {
    setLoading(true);
    
    try {
      const draftData = {
        ...formData,
        propertyId: property._id,
        unitId: unit._id,
        propertyName: property.title,
        unitName: unit.name,
        status: 'DRAFT',
        savedAt: new Date().toISOString()
      };
      
      // Save to localStorage for now (backend endpoint will be added later)
      const draftKey = `movein-draft-${property._id}-${unit._id}`;
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      
      toast.success('Draft saved successfully! You can close and resume later.');
      setIsDraft(true);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompleteMoveIn = async () => {
    if (!validateForm()) {
      toast.error('Please fill all mandatory fields correctly');
      // Expand first section with errors
      const firstErrorSection = Object.keys(errors)[0];
      if (firstErrorSection) {
        // Find which section has the error
        // This is a simple approach - you could make it more sophisticated
        setExpandedSections([1, 2, 3, 4, 5, 6]);
      }
      return;
    }
    
    setLoading(true);
    
    try {
      const moveInData = {
        ...formData,
        status: 'ACTIVE'
      };
      
      const response = await api.post(`/move-in/${property._id}/${unit._id}`, moveInData);
      
      toast.success('Move-in completed successfully!');
      
      // Clear the draft from localStorage
      const draftKey = `movein-draft-${property._id}-${unit._id}`;
      localStorage.removeItem(draftKey);
      
      // Generate and show PDF preview
      if (response.data.lease && response.data.lease._id) {
        setPdfPreview(response.data.lease);
        setShowPdfPreview(true);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error completing move-in:', error);
      toast.error(error.response?.data?.message || 'Failed to complete move-in');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadPdf = async () => {
    if (!pdfPreview) return;
    
    try {
      const pdfResponse = await fetch(`/api/move-in/agreement/${pdfPreview._id}`, {
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
        link.download = `rent-agreement-${pdfPreview.agreementNumber}.pdf`;
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
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };
  
  if (!isOpen) return null;
  
  // If showing PDF preview
  if (showPdfPreview && pdfPreview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle size={24} className="text-green-500" />
                Move-In Completed Successfully!
              </h2>
              <button
                onClick={() => {
                  setShowPdfPreview(false);
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg mb-6">
              <p className="text-green-800 dark:text-green-200">
                The tenant has been successfully moved into {unit?.name} at {property?.title}.
                The unit status has been updated to <strong>Occupied</strong>.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Lease Agreement Generated</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Agreement Number:</span>
                  <div className="font-medium">{pdfPreview.agreementNumber}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Lease Period:</span>
                  <div className="font-medium">
                    {new Date(pdfPreview.startDate).toLocaleDateString()} - {new Date(pdfPreview.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Monthly Rent:</span>
                  <div className="font-medium">${pdfPreview.monthlyRent}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <div className="font-medium text-green-600">Active</div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={downloadPdf}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Agreement PDF
                </button>
                <button
                  onClick={() => {
                    setShowPdfPreview(false);
                    onClose();
                  }}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
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
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Home size={24} />
                Move Tenant In
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {property?.title} - {unit?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Progress Indicator */}
          <div className="mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Complete all sections to process move-in
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {completedSections.length} of {sections.length} sections completed
              </span>
            </div>
            <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSections.length / sections.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Scrollable Form Sections */}
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto space-y-4 mb-6 pr-2">
            {/* Section 1: Property Information */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(1)}
                className="w-full bg-blue-50 dark:bg-blue-900 p-4 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building size={20} className="text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">1. Property Information</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Property and unit details</p>
                  </div>
                </div>
                {expandedSections.includes(1) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(1) && (
                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Property Name <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full p-2 rounded border ${errors.propertyName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.propertyName}
                        onChange={(e) => handleInputChange('propertyName', e.target.value)}
                        placeholder="Enter property name"
                      />
                      {errors.propertyName && <p className="text-red-500 text-xs mt-1">{errors.propertyName}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Property Code <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.propertyCode}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Unit Number <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full p-2 rounded border ${errors.unitNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.unitNumber}
                        onChange={(e) => handleInputChange('unitNumber', e.target.value)}
                        placeholder="Enter unit number"
                      />
                      {errors.unitNumber && <p className="text-red-500 text-xs mt-1">{errors.unitNumber}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Property Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className={`w-full p-2 rounded border ${errors.propertyType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.propertyType}
                        onChange={(e) => handleInputChange('propertyType', e.target.value)}
                      >
                        <option value="APARTMENT">Apartment</option>
                        <option value="VILLA">Villa</option>
                        <option value="OFFICE">Office</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="WAREHOUSE">Warehouse</option>
                      </select>
                      {errors.propertyType && <p className="text-red-500 text-xs mt-1">{errors.propertyType}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Move-in Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.moveInDate}
                        onChange={(e) => handleInputChange('moveInDate', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Move-out Date (Optional)
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.moveOutDate}
                        onChange={(e) => handleInputChange('moveOutDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Location / Address <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                    </label>
                    <textarea
                      className={`w-full p-2 rounded border ${errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter full address"
                      rows={2}
                    />
                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                  </div>
                </div>
              )}
            </div>
            
            {/* Section 2: Tenant Information */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
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
                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Select Tenant <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full p-2 rounded border ${errors.tenantId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      value={formData.tenantId}
                      onChange={(e) => handleTenantSelect(e.target.value)}
                    >
                      <option value="">Choose a tenant...</option>
                      {tenants.map(tenant => (
                        <option key={tenant._id} value={tenant._id}>
                          {tenant.firstName} {tenant.middleName ? `${tenant.middleName} ` : ''}{tenant.lastName} | {tenant.email}
                        </option>
                      ))}
                    </select>
                    {errors.tenantId && <p className="text-red-500 text-xs mt-1">{errors.tenantId}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Tenant Name <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full p-2 rounded border ${errors.tenantName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.tenantName}
                        onChange={(e) => handleInputChange('tenantName', e.target.value)}
                        placeholder="Full name"
                      />
                      {errors.tenantName && <p className="text-red-500 text-xs mt-1">{errors.tenantName}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Tenant Code <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.tenantCode}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Contact Number <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="tel"
                        className={`w-full p-2 rounded border ${errors.contactNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.contactNumber}
                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                      {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Email Address <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="email"
                        className={`w-full p-2 rounded border ${errors.emailAddress ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.emailAddress}
                        onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                        placeholder="tenant@example.com"
                      />
                      {errors.emailAddress && <p className="text-red-500 text-xs mt-1">{errors.emailAddress}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        National ID / Passport <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full p-2 rounded border ${errors.nationalId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.nationalId}
                        onChange={(e) => handleInputChange('nationalId', e.target.value)}
                        placeholder="ID or passport number"
                      />
                      {errors.nationalId && <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        placeholder="Emergency contact person/number"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Tenant Type
                      </label>
                      <select
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.tenantType}
                        onChange={(e) => handleInputChange('tenantType', e.target.value)}
                      >
                        <option value="INDIVIDUAL">Individual</option>
                        <option value="CORPORATE">Corporate</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Section 3: Lease Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
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
                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Lease Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className={`w-full p-2 rounded border ${errors.leaseStartDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.leaseStartDate}
                        onChange={(e) => handleInputChange('leaseStartDate', e.target.value)}
                      />
                      {errors.leaseStartDate && <p className="text-red-500 text-xs mt-1">{errors.leaseStartDate}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Lease End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className={`w-full p-2 rounded border ${errors.leaseEndDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.leaseEndDate}
                        onChange={(e) => handleInputChange('leaseEndDate', e.target.value)}
                      />
                      {errors.leaseEndDate && <p className="text-red-500 text-xs mt-1">{errors.leaseEndDate}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Lease Duration (Months)
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-calculated</span>
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.leaseDuration}
                        onChange={(e) => handleInputChange('leaseDuration', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Contract Number
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.contractNumber}
                        onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                        placeholder="Optional contract reference"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Rent Type
                      </label>
                      <select
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.rentType}
                        onChange={(e) => handleInputChange('rentType', e.target.value)}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Renewal Reminder Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.renewalReminderDate}
                        onChange={(e) => handleInputChange('renewalReminderDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Section 4: Financial Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
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
                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Monthly Rent Amount <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className={`w-full p-2 rounded border ${errors.monthlyRent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        value={formData.monthlyRent}
                        onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                        placeholder="0.00"
                      />
                      {errors.monthlyRent && <p className="text-red-500 text-xs mt-1">{errors.monthlyRent}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Security Deposit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.securityDeposit}
                        onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Advance Payment
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.advancePayment}
                        onChange={(e) => handleInputChange('advancePayment', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Payment Method
                      </label>
                      <select
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.paymentMethod}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      >
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CASH">Cash</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="ONLINE">Online</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Next Rent Due Date
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-calculated</span>
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.nextRentDueDate}
                        onChange={(e) => handleInputChange('nextRentDueDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Section 5: Utilities & Charges */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
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
                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Electricity Meter No
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.electricityMeterNo}
                        onChange={(e) => handleInputChange('electricityMeterNo', e.target.value)}
                        placeholder="Meter number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Initial Reading
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.electricityInitialReading}
                        onChange={(e) => handleInputChange('electricityInitialReading', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Water Meter No
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">auto-fetched</span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.waterMeterNo}
                        onChange={(e) => handleInputChange('waterMeterNo', e.target.value)}
                        placeholder="Meter number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Initial Reading
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.waterInitialReading}
                        onChange={(e) => handleInputChange('waterInitialReading', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Gas Fee (Monthly)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.gasFee}
                        onChange={(e) => handleInputChange('gasFee', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Internet Fee (Monthly)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.internetFee}
                        onChange={(e) => handleInputChange('internetFee', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Maintenance Fee (Monthly)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.maintenanceFee}
                        onChange={(e) => handleInputChange('maintenanceFee', e.target.value)}
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
                onClick={() => toggleSection(6)}
                className="w-full bg-red-50 dark:bg-red-900 p-4 flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-red-600 dark:text-red-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">6. Documents</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Upload required documents (max 10MB each)</p>
                  </div>
                </div>
                {expandedSections.includes(6) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(6) && (
                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                  {/* Document Upload Fields */}
                  {[
                    { key: 'signedLease', label: 'Signed Lease Agreement', accept: '.pdf,.docx' },
                    { key: 'idProof', label: 'ID Proof', accept: 'image/*,.pdf' },
                    { key: 'depositReceipt', label: 'Deposit Receipt', accept: 'image/*,.pdf' },
                    { key: 'moveInInspection', label: 'Move-In Inspection Report', accept: 'image/*,.pdf' }
                  ].map(({ key, label, accept }) => (
                    <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        {label}
                      </label>
                      
                      {!formData.documents[key] ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept={accept}
                            onChange={(e) => handleFileUpload(key, e.target.files[0])}
                            className="hidden"
                            id={`upload-${key}`}
                          />
                          <label
                            htmlFor={`upload-${key}`}
                            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
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
                          <button
                            onClick={() => removeDocument(key)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save size={20} />
              Save Draft
            </button>
            <button
              onClick={handleCompleteMoveIn}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Complete Move-In
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMoveInModal;

