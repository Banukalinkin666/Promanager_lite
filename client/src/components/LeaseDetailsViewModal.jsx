import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, X, RefreshCw, FileText, Download, User, Building, DollarSign, Mail, Phone, CreditCard, Zap, Droplets, Home } from 'lucide-react';
import api from '../lib/api';
import { useToast } from './ToastContainer';

const LeaseDetailsViewModal = ({ unit, property, isOpen, onClose }) => {
  const toast = useToast();
  const [lease, setLease] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && unit && unit.status === 'OCCUPIED') {
      loadRentSchedule();
    }
  }, [isOpen, unit]);

  // Listen for payment status updates and lease ended events
  useEffect(() => {
    const handlePaymentUpdate = (event) => {
      if (isOpen && unit && unit.status === 'OCCUPIED') {
        loadRentSchedule();
      }
    };

    const handleLeaseEnded = (event) => {
      // Check if this unit's lease was ended
      if (isOpen && unit && event.detail.unitId === unit._id) {
        // Close the modal since lease has ended
        onClose();
      }
    };

    window.addEventListener('paymentStatusUpdated', handlePaymentUpdate);
    window.addEventListener('leaseEnded', handleLeaseEnded);
    return () => {
      window.removeEventListener('paymentStatusUpdated', handlePaymentUpdate);
      window.removeEventListener('leaseEnded', handleLeaseEnded);
    };
  }, [isOpen, unit, onClose]);

  const loadRentSchedule = async () => {
    if (!unit) {
      setError('No unit information available.');
      return;
    }
    if (unit.status !== 'OCCUPIED') {
      setError('Unit is not occupied. No lease details available.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get lease information
      const leaseResponse = await api.get(`/move-in/leases?unitId=${unit._id}`);
      if (leaseResponse.data && leaseResponse.data.length > 0) {
        const leaseData = leaseResponse.data[0];
        setLease(leaseData);

        // Fetch tenant details
        if (leaseData.tenant && leaseData.tenant._id) {
          try {
            const tenantResponse = await api.get(`/tenants/${leaseData.tenant._id}`);
            setTenant(tenantResponse.data);
          } catch (err) {
            console.error('Error loading tenant:', err);
          }
        }

        // Fetch payments for this lease/unit
        const paymentsResponse = await api.get(`/payments?unitId=${unit._id}`);
        setPayments(paymentsResponse.data || []);
      } else {
        setError('No lease information found for this unit.');
      }
    } catch (err) {
      setError('Failed to load lease details.');
      console.error('Error loading lease details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate rent schedule using actual payment data
  const generateRentSchedule = (lease, payments) => {
    if (!lease) return [];

    // Create a map of payments by month for quick lookup
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

    // Generate monthly rent due dates
    let currentDate = new Date(startDate);
    let monthCount = 0;

    while (currentDate <= endDate && monthCount < 12) { // Limit to 12 months for display
      const dueDate = new Date(currentDate);
      const isOverdue = dueDate < new Date();
      const monthKey = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Check if there's a payment for this month
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
        payment: payment // Include payment data if available
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      monthCount++;
    }

    return schedule;
  };

  const downloadDocument = async (doc) => {
    if (!doc || !doc.url) {
      console.error('No document URL provided');
      toast.error('No document URL provided');
      return;
    }
    
    try {
      console.log('📄 Starting document download:', doc.url);
      console.log('📄 Document details:', doc);
      
      let blob;
      let fileName = doc.filename || 'document';
      
      // For Cloudinary URLs, open directly in new tab (let browser handle it)
      if (doc.url.startsWith('http://') || doc.url.startsWith('https://')) {
        console.log('🔗 HTTP URL detected');
        
        // Check if it's actually Cloudinary
        if (doc.url.includes('cloudinary.com')) {
          // For Cloudinary URLs, try direct access first, then fallback to proxy
          console.log('☁️ Cloudinary URL detected');
          
          try {
            // First try direct access
            console.log('🔄 Attempting direct access...');
            const directResponse = await fetch(doc.url);
            
            if (directResponse.ok) {
              blob = await directResponse.blob();
              console.log('✅ Document fetched directly');
            } else {
              throw new Error(`Direct access failed: ${directResponse.status}`);
            }
          } catch (directError) {
            console.log('⚠️ Direct access failed, trying backend proxy...', directError.message);
            
            try {
              // Fallback to backend proxy
              const token = localStorage.getItem('token');
              const backendUrl = import.meta.env.VITE_API_URL || 'https://promanager-lite-1.onrender.com/api';
              
              const response = await fetch(`${backendUrl}/move-in/proxy-document`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: doc.url })
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Proxy failed:', response.status, errorText);
                throw new Error(`Failed to fetch document: ${errorText}`);
              }
              
              blob = await response.blob();
              console.log('✅ Document fetched via proxy');
            } catch (proxyError) {
              console.log('⚠️ Proxy also failed, trying direct URL opening...', proxyError.message);
              
              // Final fallback: open URL directly in new tab
              console.log('🔄 Opening URL directly in new tab...');
              const newWindow = window.open(doc.url, '_blank');
              
              if (!newWindow) {
                console.log('⚠️ Popup blocked, showing user message');
                toast.error('Popup blocked. Please allow popups for this site and try again.');
                return;
              } else {
                console.log('🪟 Opened URL directly in new window');
                toast.success('Document opened in new tab');
                return;
              }
            }
          }
          
          // Handle the blob (open in new window or download)
          if (blob.size === 0) {
            throw new Error('Document is empty');
          }
          
          // Create a URL for the blob
          const blobUrl = window.URL.createObjectURL(blob);
          console.log('🔗 Blob URL created:', blobUrl);
          
          // Try to open in new window first
          const newWindow = window.open(blobUrl, '_blank');
          
          if (!newWindow) {
            // If popup was blocked, trigger download
            console.log('⚠️ Popup blocked, triggering download instead');
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('📥 Download triggered');
          } else {
            console.log('🪟 Opened in new window');
          }
          
          // Clean up the blob URL after a delay
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            console.log('🧹 Blob URL cleaned up');
          }, 1000);
          
          toast.success('Document opened successfully');
          return;
        } else {
          // For other HTTP URLs, try to fetch
          console.log('🔄 Attempting to fetch document...');
          const directResponse = await fetch(doc.url);
          
          if (directResponse.ok) {
            blob = await directResponse.blob();
            console.log('✅ Document fetched directly');
          } else {
            throw new Error(`Direct access failed: ${directResponse.status}`);
          }
        }
      } else {
        // For local paths, construct the full URL
        console.log('📁 Local path detected');
        const token = localStorage.getItem('token');
        const backendUrl = import.meta.env.VITE_API_URL || 'https://promanager-lite-1.onrender.com/api';
        const fullUrl = `${backendUrl.replace('/api', '')}${doc.url}`;
        
        console.log('📁 Full URL:', fullUrl);
        
        const response = await fetch(fullUrl, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Local fetch failed:', response.status, errorText);
          throw new Error(`Local fetch failed: ${response.status} - ${errorText}`);
        }
        
        blob = await response.blob();
        console.log('✅ Local document fetched');
      }
      
      console.log('📦 Blob size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Document is empty');
      }
      
      // Create a URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      console.log('🔗 Blob URL created:', blobUrl);
      
      // Try to open in new window first
      const newWindow = window.open(blobUrl, '_blank');
      
      if (!newWindow) {
        // If popup was blocked, trigger download
        console.log('⚠️ Popup blocked, triggering download instead');
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('📥 Download triggered');
      } else {
        console.log('🪟 Opened in new window');
      }
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        console.log('🧹 Blob URL cleaned up');
      }, 1000);
      
      toast.success('Document opened successfully');
      
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      toast.error(`Failed to download document: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lease Details
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={loadRentSchedule}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading lease details...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle size={20} className="text-red-400 mr-2" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          ) : lease ? (
            <div className="space-y-6">
              {/* Tenant Information Card */}
              {tenant && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <User size={20} />
                    Tenant Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Building size={20} />
                  Property & Lease Information
                </h3>
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText size={20} />
                    Uploaded Documents
                  </h3>
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
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar size={20} />
                  Rent Payment Schedule
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
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
                          {payment.isCurrentMonth ? (
                            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                          ) : payment.status === 'overdue' ? (
                            <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                          ) : payment.status === 'paid' ? (
                            <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                          ) : (
                            <Calendar size={16} className="text-gray-600 dark:text-gray-400" />
                          )}
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
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <AlertCircle size={20} className="text-yellow-400 mr-2 inline" />
              <p className="text-yellow-800 dark:text-yellow-200 inline">No lease information found for this unit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaseDetailsViewModal;
