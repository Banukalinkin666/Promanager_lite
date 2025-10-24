import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, DollarSign, User, Building, Home, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';

const LeaseDetailsModal = ({ unit, property, isOpen, onClose }) => {
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && unit && unit.status === 'OCCUPIED') {
      loadLeaseDetails();
    }
  }, [isOpen, unit]);

  // Force refresh when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLeaseDetails();
    }
  }, [isOpen]);

  // Listen for payment status updates
  useEffect(() => {
    const handlePaymentUpdate = (event) => {
      // Refresh lease details when payment status changes
      if (isOpen && unit && unit.status === 'OCCUPIED') {
        loadLeaseDetails();
      }
    };

    window.addEventListener('paymentStatusUpdated', handlePaymentUpdate);
    return () => window.removeEventListener('paymentStatusUpdated', handlePaymentUpdate);
  }, [isOpen, unit]);

  const loadLeaseDetails = async () => {
    if (!unit) {
      return;
    }
    if (unit.status !== 'OCCUPIED') {
      setError('Unit is not occupied. No lease information available.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/move-in/leases?unitId=${unit._id}`);
      if (response.data && response.data.length > 0) {
        const leaseData = response.data[0]; // Get the most recent lease
        setLease(leaseData);
        
        // Fetch payments for this lease/unit
        const paymentsResponse = await api.get(`/payments?unitId=${unit._id}`);
        setPayments(paymentsResponse.data || []);
      } else {
        setError('No lease information found for this unit.');
      }
    } catch (err) {
      setError('Failed to load lease details.');
      console.error('Error loading lease:', err);
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

  const downloadAgreement = async () => {
    if (!lease) return;
    
    try {
      // Create the PDF URL with authentication
      const token = localStorage.getItem('token');
      const backendUrl = import.meta.env.VITE_API_URL || 'https://promanager-lite-1.onrender.com/api';
      const pdfUrl = `${backendUrl}/move-in/agreement/${lease._id}?token=${token}`;
      
      // Open PDF in new window
      const newWindow = window.open(pdfUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!newWindow) {
        // If popup was blocked, try direct download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `rent-agreement-${lease.agreementNumber}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('Popup was blocked. PDF will be downloaded instead.');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert('Failed to open agreement PDF.');
    }
  };

  if (!isOpen) return null;
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lease Details
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={loadLeaseDetails}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
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
                <div className="text-red-400 mr-2">⚠️</div>
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          ) : !unit ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-400 mr-2">⚠️</div>
                <p className="text-yellow-800 dark:text-yellow-200">No unit information available.</p>
              </div>
            </div>
          ) : lease ? (
            <div className="space-y-6">
              {/* Lease Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Lease Agreement #{lease.agreementNumber}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                    {lease.status}
                  </span>
                  <span className="font-semibold text-lg text-gray-900 dark:text-white">
                    ${lease.monthlyRent}/month
                  </span>
                </div>
              </div>

              {/* Property & Unit Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Property & Unit Information
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Property:</span>
                      <p className="text-gray-900 dark:text-white">{property?.title}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>
                      <p className="text-gray-900 dark:text-white">{property?.address}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Unit:</span>
                      <p className="text-gray-900 dark:text-white">{unit.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Unit Type:</span>
                      <p className="text-gray-900 dark:text-white">{unit.type}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Tenant Information
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                      <p className="text-gray-900 dark:text-white">{lease.tenant?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                      <p className="text-gray-900 dark:text-white">{lease.tenant?.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                      <p className="text-gray-900 dark:text-white">{lease.tenant?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lease Terms */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Lease Terms
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(lease.leaseStartDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(lease.leaseEndDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                        <span className="font-medium text-gray-900 dark:text-white">${lease.monthlyRent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Security Deposit:</span>
                        <span className="font-medium text-gray-900 dark:text-white">${lease.securityDeposit || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Late Fee:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${lease.terms?.lateFeeAmount || 50} (after {lease.terms?.lateFeeAfterDays || 5} days)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Notice Period:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {lease.terms?.noticePeriodDays || 30} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Pet Allowed:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {lease.terms?.petAllowed ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Smoking Allowed:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {lease.terms?.smokingAllowed ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Dates */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Important Dates
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Move-In Date:</span>
                      <p className="text-gray-900 dark:text-white">
                        {lease.moveInDate ? new Date(lease.moveInDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Signed Date:</span>
                      <p className="text-gray-900 dark:text-white">
                        {lease.signedDate ? new Date(lease.signedDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Move-Out Date:</span>
                      <p className="text-gray-900 dark:text-white">
                        {lease.moveOutDate ? new Date(lease.moveOutDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rent Schedule */}
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
                            : 'bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {payment.isCurrentMonth ? (
                            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                          ) : payment.status === 'overdue' ? (
                            <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                          ) : (
                            <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
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
                              : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                          }`}>
                            {payment.isCurrentMonth ? 'Current' : payment.status === 'overdue' ? 'Overdue' : 'Upcoming'}
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
                        ${generateRentSchedule(lease).reduce((total, payment) => total + payment.amount, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {lease.notes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Additional Notes
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-900 dark:text-white">{lease.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-400 mr-2">ℹ️</div>
                <p className="text-yellow-800 dark:text-yellow-200">
                  This unit is not currently occupied or no lease information is available.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            {lease && (
              <button
                onClick={downloadAgreement}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FileText size={16} />
                View Agreement PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseDetailsModal;
