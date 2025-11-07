import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { 
  Search, X, CreditCard, Calendar, User, Building, Home, 
  DollarSign, CheckCircle, AlertCircle, Clock, Filter,
  Edit, Eye, Check, XCircle
} from 'lucide-react';
import api from '../lib/api.js';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantFilter, setTenantFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    paymentMethod: 'CASH',
    notes: ''
  });
  const [updating, setUpdating] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);


  const showToastMessage = (message, type = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const getStatusIcon = (payment) => {
    const rentStatus = calculateRentStatus(payment);
    switch (rentStatus.color) {
      case 'green':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'yellow':
        return <Clock size={16} className="text-yellow-600" />;
      case 'red':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  // Calculate rent status using the new logic
  const calculateRentStatus = (payment) => {
    const paymentStatus = payment.status;
    const today = new Date();
    const rentDueDate = new Date(payment.metadata?.dueDate || payment.createdAt);
    
    if (paymentStatus === 'SUCCEEDED') {
      return { status: 'Paid', color: 'green' };
    } else {
      if (today > rentDueDate) {
        return { status: 'Due', color: 'red' };
      } else {
        return { status: 'Pending', color: 'yellow' };
      }
    }
  };

  const getStatusColor = (payment) => {
    const rentStatus = calculateRentStatus(payment);
    switch (rentStatus.color) {
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'CARD':
        return <CreditCard size={16} className="text-blue-600" />;
      case 'BANK':
        return <Building size={16} className="text-green-600" />;
      case 'CASH':
        return <DollarSign size={16} className="text-yellow-600" />;
      default:
        return <CreditCard size={16} className="text-gray-600" />;
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      // Load all payments, not filtered by user role
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
      showToastMessage('Error loading payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredPayments = payments.filter(payment => {
    // Search filter (general search)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const tenantName = payment.tenant?.name || `${payment.tenant?.firstName || ''} ${payment.tenant?.lastName || ''}`.trim();
      const propertyName = payment.metadata?.propertyId?.title || '';
      const unitId = payment.metadata?.unitId;
      const unitNumber = payment.metadata?.unitNumber;
      const unitName = unitNumber ? `Unit ${unitNumber}` : (unitId ? `Unit ${unitId.toString().slice(-3)}` : '');
      const nic = payment.tenant?.nic || '';
      
      if (!tenantName.toLowerCase().includes(searchLower) &&
          !propertyName.toLowerCase().includes(searchLower) &&
          !unitName.toString().toLowerCase().includes(searchLower) &&
          !nic.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Tenant filter
    if (tenantFilter !== 'ALL') {
      const tenantName = payment.tenant?.name || `${payment.tenant?.firstName || ''} ${payment.tenant?.lastName || ''}`.trim();
      if (!tenantName.toLowerCase().includes(tenantFilter.toLowerCase())) {
        return false;
      }
    }

    // Property filter
    if (propertyFilter !== 'ALL') {
      const propertyName = payment.metadata?.propertyId?.title || '';
      if (!propertyName.toLowerCase().includes(propertyFilter.toLowerCase())) {
        return false;
      }
    }

    // Unit filter
    if (unitFilter !== 'ALL') {
      const unitId = payment.metadata?.unitId;
      const unitNumber = payment.metadata?.unitNumber;
      const unitName = unitNumber ? `Unit ${unitNumber}` : (unitId ? `Unit ${unitId.toString().slice(-3).toUpperCase()}` : '');
      const unitNumberOnly = unitNumber || (unitId ? unitId.toString().slice(-3).toUpperCase() : '');
      if (!unitName.toLowerCase().includes(unitFilter.toLowerCase()) && 
          !unitNumberOnly.toLowerCase().includes(unitFilter.toLowerCase())) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      const rentStatus = calculateRentStatus(payment);
      if (statusFilter === 'DUE' && rentStatus.status !== 'Due') {
        return false;
      } else if (statusFilter !== 'DUE' && payment.status !== statusFilter) {
        return false;
      }
    }

    // Method filter
    if (methodFilter !== 'ALL' && payment.method !== methodFilter) {
      return false;
    }

    return true;
  });

  // Sort payments chronologically by month
  const sortedPayments = filteredPayments.sort((a, b) => {
    // Extract month and year from metadata.month (e.g., "January 2024")
    const getMonthNumber = (monthStr) => {
      if (!monthStr) return 0;
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                         'july', 'august', 'september', 'october', 'november', 'december'];
      const parts = monthStr.toLowerCase().split(' ');
      const month = monthNames.indexOf(parts[0]);
      const year = parseInt(parts[1]) || 0;
      return year * 12 + month;
    };
    
    const monthA = getMonthNumber(a.metadata?.month);
    const monthB = getMonthNumber(b.metadata?.month);
    
    // Sort by month (earliest first)
    return monthA - monthB;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = sortedPayments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tenantFilter, propertyFilter, unitFilter, statusFilter, methodFilter]);

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidPayments = filteredPayments.filter(p => calculateRentStatus(p).status === 'Paid');
  const pendingPayments = filteredPayments.filter(p => calculateRentStatus(p).status === 'Pending');
  const duePayments = filteredPayments.filter(p => calculateRentStatus(p).status === 'Due');

  const handleUpdatePayment = (payment) => {
    setSelectedPayment(payment);
    setUpdateForm({
      paymentMethod: payment.method === 'CARD' ? 'CASH' : payment.method,
      notes: payment.notes || ''
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedPayment) return;
    
    try {
      setUpdating(true);
      const response = await api.patch(`/payments/${selectedPayment._id}`, {
        paymentMethod: updateForm.paymentMethod,
        status: 'SUCCEEDED',
        notes: updateForm.notes
      });
      
      // Update the payment in the local state
      setPayments(prev => prev.map(p => 
        p._id === selectedPayment._id ? response.data : p
      ));
      
      setShowUpdateModal(false);
      setSelectedPayment(null);
      showToastMessage('Payment marked as paid successfully!', 'success');
      
      // Trigger a global refresh event for other components
      window.dispatchEvent(new CustomEvent('paymentStatusUpdated', { 
        detail: { paymentId: selectedPayment._id, newStatus: 'SUCCEEDED' }
      }));
    } catch (error) {
      console.error('Error updating payment:', error);
      showToastMessage('Error updating payment. Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          showToast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {showToast.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <span>{showToast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage rent payments and payment status</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</p>
            </div>
            <DollarSign size={24} className="text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-green-600">{paidPayments.length}</p>
            </div>
            <CheckCircle size={24} className="text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
            </div>
            <Clock size={24} className="text-yellow-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due</p>
              <p className="text-2xl font-bold text-red-600">{duePayments.length}</p>
            </div>
            <AlertCircle size={24} className="text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              General Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search across all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Tenant Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tenant Name
            </label>
            <input
              type="text"
              placeholder="Enter tenant name..."
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Property Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Property Name
            </label>
            <input
              type="text"
              placeholder="Enter property name..."
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Unit Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit Number
            </label>
            <input
              type="text"
              placeholder="Enter unit number (e.g., 100, 1A)..."
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCEEDED">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="DUE">Due</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">All Methods</option>
              <option value="CARD">Card</option>
              <option value="BANK">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments List - Compact View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payment Records ({filteredPayments.length})
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedPayments.length > 0 ? (
            paginatedPayments.map((payment) => {
              const tenantName = payment.tenant?.name || `${payment.tenant?.firstName || ''} ${payment.tenant?.lastName || ''}`.trim();
              const propertyName = payment.metadata?.propertyId?.title || 'N/A';
              // Extract unit name from unit ID or use a fallback
              const unitId = payment.metadata?.unitId;
              // Use the actual unit number from metadata, fallback to ObjectId fragment
              const unitNumber = payment.metadata?.unitNumber;
              const unitName = unitNumber ? `Unit ${unitNumber}` : (unitId ? `Unit ${unitId.toString().slice(-3).toUpperCase()}` : 'N/A');
              const nic = payment.tenant?.nic || 'N/A';
              
              return (
                <div key={payment._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      {/* Amount & Status */}
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          ${payment.amount.toFixed(2)}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment)}`}>
                          {calculateRentStatus(payment).status}
                        </div>
                      </div>
                      
                      {/* Tenant */}
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{tenantName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">NIC: {nic}</div>
                        </div>
                      </div>
                      
                      {/* Property */}
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{propertyName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Property</div>
                        </div>
                      </div>
                      
                      {/* Unit */}
                      <div className="flex items-center gap-2">
                        <Home size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{unitName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Unit</div>
                        </div>
                      </div>
                      
                      {/* Date & Period */}
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {payment.paidDate 
                              ? new Date(payment.paidDate).toLocaleDateString()
                              : new Date(payment.createdAt).toLocaleDateString()
                            }
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.metadata?.month || 'Payment'}
                          </div>
                        </div>
                      </div>

                      {/* Payment Method (only for completed payments) */}
                      <div className="flex items-center gap-2">
                        {payment.status === 'SUCCEEDED' ? (
                          <>
                            {getMethodIcon(payment.method)}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                                {payment.method}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Method</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400 italic">—</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(payment)}
                      {calculateRentStatus(payment).status !== 'Paid' && user.role !== 'TENANT' && (
                        <button
                          onClick={() => handleUpdatePayment(payment)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          <Check size={12} />
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  {payment.description && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {payment.description}
                    </div>
                  )}

                  {/* Notes */}
                  {payment.notes && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <strong>Notes:</strong> {payment.notes}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No payments found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'ALL' || methodFilter !== 'ALL' 
                  ? 'No payments match your current filters. Try adjusting your search criteria.'
                  : 'No payments have been recorded yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update Payment Modal */}
      {showUpdateModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Mark Payment as Paid
                </h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={updateForm.paymentMethod}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={updateForm.notes}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about this payment..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows="3"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Payment Details:</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Amount: <span className="font-medium">${selectedPayment.amount.toFixed(2)}</span></div>
                    <div>Tenant: <span className="font-medium">{selectedPayment.tenant?.name || `${selectedPayment.tenant?.firstName} ${selectedPayment.tenant?.lastName}`}</span></div>
                    <div>Property: <span className="font-medium">{selectedPayment.metadata?.propertyId?.title || 'N/A'}</span></div>
                    <div>Period: <span className="font-medium">{selectedPayment.metadata?.month || 'N/A'}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 mt-6">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitUpdate}
                  disabled={updating}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {updating ? 'Updating...' : 'Mark as Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}