import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Download, FileText, User, Building, Calendar, DollarSign, Mail, Phone, CreditCard } from 'lucide-react';
import { useToast } from '../components/ToastContainer';
import api from '../lib/api';

const LeaseDetailsPage = () => {
  const { propertyId, unitId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const [lease, setLease] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.property && location.state?.unit && location.state?.lease) {
      setProperty(location.state.property);
      setUnit(location.state.unit);
      setLease(location.state.lease);
      setTenant(location.state.tenant);
      setLoading(false);
      loadAdditionalData();
    } else {
      loadData();
    }
  }, [location.state, propertyId, unitId]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading data for property:', propertyId, 'unit:', unitId);
      
      // Try to load property and unit first
      let propertyData, unitData;
      try {
        const propertyResponse = await api.get(`/properties/${propertyId}`);
        propertyData = propertyResponse.data;
        setProperty(propertyData);
        console.log('✅ Property loaded:', propertyData.title);
      } catch (err) {
        console.error('❌ Error loading property:', err);
        throw new Error('Failed to load property data');
      }

      try {
        // Get unit data from the property data (units are embedded in property)
        const unit = propertyData.units.find(u => u._id.toString() === unitId);
        if (!unit) {
          throw new Error('Unit not found in property');
        }
        unitData = unit;
        setUnit(unitData);
        console.log('✅ Unit loaded from property:', unitData.name);
      } catch (err) {
        console.error('❌ Error loading unit:', err);
        throw new Error('Failed to load unit data');
      }

      // Try to load lease data
      try {
        console.log('🔄 Loading lease data for unit:', unitId);
        const leaseResponse = await api.get(`/move-in/leases?unitId=${unitId}`);
        console.log('📋 Lease response:', leaseResponse.data);
        
        if (leaseResponse.data && leaseResponse.data.length > 0) {
          setLease(leaseResponse.data[0]);
          loadAdditionalData();
          console.log('✅ Lease loaded:', leaseResponse.data[0].agreementNumber);
        } else {
          console.log('⚠️ No lease found for unit:', unitId);
          setError('No lease found for this unit. Please ensure the unit has an active lease.');
        }
      } catch (err) {
        console.error('❌ Error loading lease:', err);
        console.error('Error details:', err.response?.data || err.message);
        setError('Failed to load lease data. Please check if the unit has an active lease.');
      }
    } catch (err) {
      console.error('❌ Critical error loading data:', err);
      setError(err.message || 'Failed to load lease data');
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalData = async () => {
    if (!lease) return;

    try {
      // Load tenant details
      if (lease.tenant && lease.tenant._id) {
        try {
          const tenantResponse = await api.get(`/tenants/${lease.tenant._id}`);
          setTenant(tenantResponse.data);
        } catch (err) {
          console.error('Error loading tenant:', err);
        }
      }

      // Load payments
      try {
        const paymentsResponse = await api.get(`/payments?unitId=${unitId}`);
        setPayments(paymentsResponse.data || []);
      } catch (err) {
        console.error('Error loading payments:', err);
      }
    } catch (err) {
      console.error('Error loading additional data:', err);
    }
  };

  const handleEditLease = () => {
    navigate(`/properties/${propertyId}/units/${unitId}/lease/edit`, {
      state: { property, unit, lease, tenant }
    });
  };

  const downloadDocument = async (doc) => {
    if (!doc || !doc.url) {
      console.error('No document URL provided');
      toast.error('No document URL provided');
      return;
    }
    
    try {
      console.log('📄 Starting document download:', doc.url);
      
      // Try multiple approaches for better reliability
      let success = false;
      let lastError = null;
      
      // Method 1: Try direct URL access first
      if (doc.url.startsWith('http')) {
        try {
          console.log('🔄 Method 1: Direct URL access...');
          const directResponse = await fetch(doc.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (directResponse.ok) {
            const blob = await directResponse.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const newWindow = window.open(blobUrl, '_blank');
            if (!newWindow) {
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = doc.filename || 'document.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
            console.log('✅ Method 1: Direct access successful');
            success = true;
          } else {
            throw new Error(`Direct access failed: ${directResponse.status}`);
          }
        } catch (error) {
          console.log('⚠️ Method 1 failed:', error.message);
          lastError = error;
        }
      }
      
      // Method 2: Try backend proxy with streaming
      if (!success) {
        try {
          console.log('🔄 Method 2: Backend proxy with streaming...');
          const response = await api.post('/move-in/fetch-document', {
            url: doc.url,
            filename: doc.filename || 'document.pdf'
          }, {
            responseType: 'blob',
            timeout: 30000
          });
          
          const blobUrl = window.URL.createObjectURL(response.data);
          const newWindow = window.open(blobUrl, '_blank');
          
          if (!newWindow) {
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = doc.filename || 'document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
          console.log('✅ Method 2: Backend proxy successful');
          success = true;
        } catch (error) {
          console.log('⚠️ Method 2 failed:', error.message);
          lastError = error;
        }
      }
      
      // Method 3: Try signed URL approach (for Cloudinary)
      if (!success && doc.url.includes('cloudinary.com')) {
        try {
          console.log('🔄 Method 3: Signed URL approach...');
          const signedResponse = await api.post('/move-in/get-signed-url', {
            url: doc.url,
            filename: doc.filename || 'document.pdf'
          });
          
          if (signedResponse.data.signedUrl) {
            const newWindow = window.open(signedResponse.data.signedUrl, '_blank');
            if (!newWindow) {
              const link = document.createElement('a');
              link.href = signedResponse.data.signedUrl;
              link.download = doc.filename || 'document.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            console.log('✅ Method 3: Signed URL successful');
            success = true;
          }
        } catch (error) {
          console.log('⚠️ Method 3 failed:', error.message);
          lastError = error;
        }
      }
      
      if (success) {
        toast.success('Document opened successfully');
      } else {
        throw lastError || new Error('All download methods failed');
      }
      
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      toast.error(`Failed to download document: ${error.message}`);
    }
  };

  const downloadAgreement = async () => {
    if (!lease?.agreementPdfPath) {
      toast.error('No rent agreement available');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const backendUrl = import.meta.env.VITE_API_URL || 'https://promanager-lite-1.onrender.com/api';
      
      const response = await fetch(`${backendUrl}/move-in/agreement/${lease._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const newWindow = window.open(blobUrl, '_blank');
      if (!newWindow) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `rent-agreement-${lease.agreementNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      toast.success('Rent agreement downloaded successfully');
    } catch (error) {
      console.error('Error downloading agreement:', error);
      toast.error('Failed to download rent agreement');
    }
  };

  // Generate rent schedule using actual payment data
  const generateRentSchedule = (lease, payments) => {
    if (!lease) return [];

    const paymentMap = {};
    payments.forEach(payment => {
      const month = payment.metadata?.month;
      if (month) {
        paymentMap[month] = payment;
      }
    });

    const schedule = [];
    const startDate = new Date(lease.leaseStartDate);
    const endDate = new Date(lease.leaseEndDate);
    const monthlyRent = lease.monthlyRent;

    let currentDate = new Date(startDate);
    let monthCount = 0;

    while (currentDate <= endDate && monthCount < 12) {
      const dueDate = new Date(currentDate);
      const isOverdue = dueDate < new Date();
      const monthKey = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const payment = paymentMap[monthKey];
      let status = 'upcoming';
      
      if (payment) {
        if (payment.status === 'SUCCEEDED') {
          status = 'paid';
        } else if (payment.status === 'PENDING') {
          status = isOverdue ? 'overdue' : 'pending';
        } else if (payment.status === 'FAILED') {
          status = 'failed';
        }
      } else if (isOverdue) {
        status = 'overdue';
      }

      schedule.push({
        month: monthKey,
        dueDate: dueDate.toLocaleDateString(),
        amount: monthlyRent,
        status: status,
        isCurrentMonth: currentDate.getMonth() === new Date().getMonth() &&
                        currentDate.getFullYear() === new Date().getFullYear(),
        payment: payment
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
      monthCount++;
    }

    return schedule;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lease details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <h3 className="text-lg font-semibold mb-2">Failed to load lease data</h3>
              <p className="text-sm">{error}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/properties/${propertyId}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Property
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
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
                Lease Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {property?.title} - {unit?.name} - {lease?.agreementNumber}
              </p>
            </div>
          </div>
          <button
            onClick={handleEditLease}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={16} />
            Edit Lease
          </button>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Tenant Information Card */}
          {tenant && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={20} />
                Tenant Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-gray-600 dark:text-gray-300" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tenant.firstName} {tenant.middleName || ''} {tenant.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-600 dark:text-gray-300" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{tenant.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-600 dark:text-gray-300" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{tenant.phone || 'N/A'}</p>
                  </div>
                </div>
                {(tenant.nic || tenant.passportNo) && (
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">ID</p>
                      <p className="font-medium text-gray-900 dark:text-white">{tenant.nic || tenant.passportNo}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Property & Lease Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building size={20} />
              Property & Lease Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Property</p>
                <p className="font-medium text-gray-900 dark:text-white">{property?.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unit</p>
                <p className="font-medium text-gray-900 dark:text-white">{unit?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lease Period</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(lease.leaseStartDate).toLocaleDateString()} - {new Date(lease.leaseEndDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</p>
                <p className="font-medium text-gray-900 dark:text-white">${lease.monthlyRent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Security Deposit</p>
                <p className="font-medium text-gray-900 dark:text-white">${lease.securityDeposit || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Agreement Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{lease.agreementNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Uploaded Documents */}
          {lease.documents && (lease.documents.signedLease || lease.documents.idProof || lease.documents.depositReceipt || lease.documents.moveInInspection) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                Uploaded Documents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lease.documents.signedLease && (
                  <button
                    onClick={() => downloadDocument(lease.documents.signedLease)}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-900 dark:text-white">Signed Lease Agreement</span>
                    </div>
                    <Download size={16} className="text-gray-600 dark:text-gray-300" />
                  </button>
                )}
                {lease.documents.idProof && (
                  <button
                    onClick={() => downloadDocument(lease.documents.idProof)}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-900 dark:text-white">ID Proof</span>
                    </div>
                    <Download size={16} className="text-gray-600 dark:text-gray-300" />
                  </button>
                )}
                {lease.documents.depositReceipt && (
                  <button
                    onClick={() => downloadDocument(lease.documents.depositReceipt)}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-900 dark:text-white">Deposit Receipt</span>
                    </div>
                    <Download size={16} className="text-gray-600 dark:text-gray-300" />
                  </button>
                )}
                {lease.documents.moveInInspection && (
                  <button
                    onClick={() => downloadDocument(lease.documents.moveInInspection)}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-900 dark:text-white">Move-In Inspection Report</span>
                    </div>
                    <Download size={16} className="text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rent Payment Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar size={20} />
                Rent Payment Schedule
              </h2>
              {lease?.agreementPdfPath && (
                <button
                  onClick={downloadAgreement}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={16} />
                  Download Agreement
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {generateRentSchedule(lease, payments).map((payment, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    payment.isCurrentMonth
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : payment.status === 'overdue'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : payment.status === 'paid'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {payment.month}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Due: {payment.dueDate}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ${payment.amount}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      payment.isCurrentMonth
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        : payment.status === 'overdue'
                        ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                        : payment.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                    }`}>
                      {payment.status === 'paid' ? 'Paid' : payment.isCurrentMonth ? 'Current' : payment.status === 'overdue' ? 'Overdue' : 'Upcoming'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Rent for Lease Period:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${generateRentSchedule(lease, payments).reduce((total, payment) => total + payment.amount, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseDetailsPage;
