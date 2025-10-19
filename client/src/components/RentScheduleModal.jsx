import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import api from '../lib/api';

const RentScheduleModal = ({ unit, property, isOpen, onClose }) => {
  const [lease, setLease] = useState(null);
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
      setError('Unit is not occupied. No rent schedule available.');
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

        // Fetch payments for this lease/unit
        const paymentsResponse = await api.get(`/payments?unitId=${unit._id}`);
        setPayments(paymentsResponse.data || []);
      } else {
        setError('No lease information found for this unit.');
      }
    } catch (err) {
      setError('Failed to load rent schedule.');
      console.error('Error loading rent schedule:', err);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rent Payment Schedule
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
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading rent schedule...</span>
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
              {/* Unit & Property Info */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Unit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Property</p>
                    <p className="font-medium text-gray-900 dark:text-white">{property?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unit</p>
                    <p className="font-medium text-gray-900 dark:text-white">{unit?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tenant</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {unit?.tenant?.name || `${unit?.tenant?.firstName || ''} ${unit?.tenant?.lastName || ''}`.trim() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</p>
                    <p className="font-medium text-gray-900 dark:text-white">${lease.monthlyRent}</p>
                  </div>
                </div>
              </div>

              {/* Rent Schedule */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar size={20} />
                  Payment Schedule
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
              <div className="flex items-center">
                <div className="text-yellow-400 mr-2">⚠️</div>
                <p className="text-yellow-800 dark:text-yellow-200">No lease information found for this unit.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentScheduleModal;
