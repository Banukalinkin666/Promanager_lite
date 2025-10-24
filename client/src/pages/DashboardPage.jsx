import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { 
  Home, Building, MapPin, DollarSign, Calendar, FileText, 
  User, Phone, Mail, Bed, Bath, Car, Zap, Droplets,
  Clock, CheckCircle, AlertCircle, Download, CreditCard
} from 'lucide-react';
import api from '../lib/api.js';
import StatCard from '../components/StatCard.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ properties: 0, unitsAvailable: 0, unitsOccupied: 0, rentCollected: 0 });
  const [propertyStats, setPropertyStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    vacantUnits: 0,
    occupiedUnits: 0,
    maintenanceUnits: 0,
    propertyStats: []
  });
  const [tenantRentStats, setTenantRentStats] = useState({
    totalActiveTenants: 0,
    totalDueRent: 0,
    totalPendingRent: 0,
    totalPaidRent: 0,
    propertyTenantStats: []
  });
  const [tenantData, setTenantData] = useState({
    currentUnits: [], // Array of { unit, property, lease, rentSchedule, payments }
    previousUnits: [], // Array of ended lease units
    allLeaseHistory: [], // Array of ALL past leases for this tenant
    payments: []
  });
  const [showRentSchedules, setShowRentSchedules] = useState({}); // Track which units show rent schedules
  const [showLeaseHistory, setShowLeaseHistory] = useState({}); // Track which units show lease history
  const [leaseHistory, setLeaseHistory] = useState({}); // Store lease history for each unit
  const [loading, setLoading] = useState(true);

  // Load property statistics for dashboard widget
  const loadPropertyStats = async () => {
    try {
      if (user.role === 'TENANT') return; // Skip for tenants
      
      const response = await api.get('/properties/stats');
      setPropertyStats(response.data);
    } catch (error) {
      console.error('Error loading property stats:', error);
    }
  };

  // Load tenant and rent statistics for dashboard widget
  const loadTenantRentStats = async () => {
    try {
      if (user.role === 'TENANT') return; // Skip for tenants
      
      const response = await api.get('/properties/tenant-rent-stats');
      setTenantRentStats(response.data);
    } catch (error) {
      console.error('Error loading tenant and rent stats:', error);
    }
  };

  // Generate rent schedule using actual payment data for a specific unit
  const generateRentSchedule = (lease, payments, unitId) => {
    if (!lease) return [];
    
    // Filter payments for this specific unit
    const unitPayments = payments.filter(payment => 
      payment.metadata?.unitId === unitId || payment.metadata?.unitId?.toString() === unitId.toString()
    );
    
    // Create a map of payments by month for quick lookup
    const paymentMap = {};
    unitPayments.forEach(payment => {
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
      
      // Check if there's a payment for this month
      const payment = paymentMap[monthKey];
      
      // Use the new rent status calculation logic
      let status = 'upcoming';
      if (payment) {
        const paymentStatus = payment.status;
        const today = new Date();
        const rentDueDate = new Date(payment.metadata?.dueDate || payment.createdAt);
        
        if (paymentStatus === 'SUCCEEDED') {
          status = 'paid';
        } else {
          if (today > rentDueDate) {
            status = 'due';
          } else {
            status = 'pending';
          }
        }
      } else if (isOverdue) {
        status = 'due';
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
      
      currentDate.setMonth(currentDate.getMonth() + 1);
      monthCount++;
    }
    
    return schedule;
  };

  // Toggle rent schedule visibility for a unit
  const toggleRentSchedule = (unitId) => {
    setShowRentSchedules(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  // Toggle lease history visibility for a unit
  const toggleLeaseHistory = async (unitId) => {
    const isCurrentlyVisible = showLeaseHistory[unitId];
    
    if (!isCurrentlyVisible && !leaseHistory[unitId]) {
      // Load lease history if not already loaded
      try {
        const response = await api.get(`/move-in/units/${unitId}/lease-history`);
        setLeaseHistory(prev => ({
          ...prev,
          [unitId]: response.data
        }));
      } catch (error) {
        console.error('Error loading lease history:', error);
        alert('Failed to load lease history.');
        return;
      }
    }
    
    setShowLeaseHistory(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  // Handle online payment for rent
  const handlePayRent = async (payment, unitData) => {
    try {
      const confirmPayment = window.confirm(
        `Pay rent for ${payment.month}?\n\nAmount: $${payment.amount}\nDue Date: ${payment.dueDate}\nProperty: ${unitData.property.title}\nUnit: ${unitData.unit.name}\n\nThis will redirect you to the payment gateway.`
      );
      
      if (confirmPayment) {
        // Create payment intent with the backend
        const paymentResponse = await api.post('/payments/rent-payment', {
          amount: payment.amount,
          month: payment.month,
          unitId: unitData.unit._id,
          propertyId: unitData.property._id,
          unitNumber: unitData.unit.name,
          dueDate: payment.dueDate
        });
        
        if (paymentResponse.data.paymentUrl) {
          // Redirect to Stripe Checkout
          window.open(paymentResponse.data.paymentUrl, '_blank');
          
          // Show success message
          alert('Payment gateway opened in a new window. Please complete the payment there.\n\nYou will be redirected back to this page after payment completion.');
        } else {
          // Fallback for demo purposes
          alert('Payment intent created successfully!\n\nFor demo purposes, payment is considered successful.\n\nIn a real implementation, you would be redirected to Stripe Checkout.');
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.response?.status === 500) {
        alert('Payment service is currently unavailable. Please try again later or contact support.');
      } else {
        alert('Error processing payment. Please try again.');
      }
    }
  };

  // Download rent agreement for tenant
  const downloadAgreement = async (lease) => {
    if (!lease) return;
    
    try {
      console.log('📄 Downloading PDF for lease:', lease._id);
      const token = localStorage.getItem('token');
      
      // Get the backend URL from environment or construct it
      const backendUrl = import.meta.env.VITE_API_URL || 'https://promanager-lite-1.onrender.com/api';
      
      // Fetch the PDF with proper authentication
      const response = await fetch(`${backendUrl}/move-in/agreement/${lease._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Failed to download PDF: ${response.status}`);
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('PDF is empty');
      }
      
      // Create a URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Open in new window
      const newWindow = window.open(blobUrl, '_blank');
      
      if (!newWindow) {
        // If popup was blocked, download the file
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `rent-agreement-${lease.agreementNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        alert('Popup was blocked. PDF will be downloaded instead.');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download agreement PDF. Please try again later.');
    }
  };

  // Listen for payment status updates
  useEffect(() => {
    const handlePaymentUpdate = (event) => {
      // Refresh tenant data when payment status changes
      if (user.role === 'TENANT') {
        // Reload tenant data
        (async () => {
          try {
            const properties = await api.get('/properties');
            const tenantUnits = [];
            
            // Find all units occupied by this tenant
            for (const property of properties.data) {
              for (const unit of property.units) {
                if (unit.tenant && (unit.tenant._id === user.id || unit.tenant === user.id)) {
                  tenantUnits.push({ unit, property });
                }
              }
            }
            
            if (tenantUnits.length > 0) {
              try {
                const leaseResponse = await api.get('/move-in/leases');
                const leases = leaseResponse.data || [];
                const paymentsResponse = await api.get('/payments');
                const payments = paymentsResponse.data || [];
                
                // Separate current and previous units based on lease status
                const currentUnits = [];
                const previousUnits = [];
                
                tenantUnits.forEach(({ unit, property }) => {
                  const lease = leases.find(l => l.unit === unit._id);
                  const unitData = { unit, property, lease };
                  
                  if (lease) {
                    // Check if lease is ended based on end date or status
                    const isLeaseEnded = lease.status === 'ENDED' || 
                                       lease.status === 'TERMINATED' || 
                                       (lease.leaseEndDate && new Date(lease.leaseEndDate) < new Date());
                    
                    if (isLeaseEnded) {
                      // Previous unit with ended lease
                      previousUnits.push(unitData);
                    } else {
                      // Current unit with active lease
                      unitData.rentSchedule = generateRentSchedule(lease, payments, unit._id);
                      currentUnits.push(unitData);
                    }
                  } else {
                    // Unit without lease - treat as current but no rent schedule
                    currentUnits.push(unitData);
                  }
                });
                
                setTenantData({
                  currentUnits,
                  previousUnits,
                  payments: payments
                });
              } catch (leaseError) {
                console.error('Error refreshing lease:', leaseError);
              }
            } else {
              setTenantData({ currentUnits: [], previousUnits: [], allLeaseHistory: [], payments: [] });
            }
          } catch (error) {
            console.error('Error refreshing tenant data:', error);
          }
        })();
      }
    };

    // Listen for lease ended events
    const handleLeaseEnded = (event) => {
      // Check if this tenant's lease was ended
      if (event.detail.tenantId === user.id) {
        // Move the ended unit from current to previous
        setTenantData(prev => {
          const endedUnit = prev.currentUnits.find(unitData => unitData.unit._id === event.detail.unitId);
          if (endedUnit) {
            // Update the lease status to ENDED and move to previous units
            const updatedEndedUnit = {
              ...endedUnit,
              lease: endedUnit.lease ? { ...endedUnit.lease, status: 'ENDED' } : null
            };
            
            return {
              ...prev,
              currentUnits: prev.currentUnits.filter(unitData => unitData.unit._id !== event.detail.unitId),
              previousUnits: [...prev.previousUnits, updatedEndedUnit]
            };
          }
          return prev;
        });
      }
    };

    window.addEventListener('paymentStatusUpdated', handlePaymentUpdate);
    window.addEventListener('leaseEnded', handleLeaseEnded);
    return () => {
      window.removeEventListener('paymentStatusUpdated', handlePaymentUpdate);
      window.removeEventListener('leaseEnded', handleLeaseEnded);
    };
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        if (user.role === 'TENANT') {
          // Load tenant's units and lease information
          const properties = await api.get('/properties');
          const tenantUnits = [];
          
          // Find all units occupied by this tenant
          for (const property of properties.data) {
            for (const unit of property.units) {
              if (unit.tenant && (unit.tenant._id === user.id || unit.tenant === user.id)) {
                tenantUnits.push({ unit, property });
              }
            }
          }
          
          // Load ALL lease history for this tenant (not just current assignments)
          try {
            const leaseResponse = await api.get('/move-in/leases');
            const allLeases = leaseResponse.data || [];
            const paymentsResponse = await api.get('/payments');
            const payments = paymentsResponse.data || [];
            
            // Filter leases for this tenant
            const tenantLeases = allLeases.filter(l => 
              l.tenant && (l.tenant._id === user.id || l.tenant === user.id)
            );
            
            // Separate current and previous units based on lease status
            const currentUnits = [];
            const previousUnits = [];
            const allLeaseHistory = [];
            
            // Process currently assigned units
            if (tenantUnits.length > 0) {
              tenantUnits.forEach(({ unit, property }) => {
                const lease = tenantLeases.find(l => l.unit === unit._id);
                const unitData = { unit, property, lease };
                
                if (lease) {
                  // Check if lease is ended based on end date or status
                  const isLeaseEnded = lease.status === 'ENDED' || 
                                     lease.status === 'TERMINATED' || 
                                     (lease.leaseEndDate && new Date(lease.leaseEndDate) < new Date());
                  
                  if (isLeaseEnded) {
                    // Previous unit with ended lease
                    previousUnits.push(unitData);
                  } else {
                    // Current unit with active lease
                    unitData.rentSchedule = generateRentSchedule(lease, payments, unit._id);
                    currentUnits.push(unitData);
                  }
                } else {
                  // Unit without lease - treat as current but no rent schedule
                  currentUnits.push(unitData);
                }
              });
            }
            
            // Get ALL lease history (including leases for units no longer assigned)
            for (const lease of tenantLeases) {
              const isLeaseEnded = lease.status === 'ENDED' || 
                                 lease.status === 'TERMINATED' || 
                                 lease.status === 'INACTIVE' ||
                                 (lease.leaseEndDate && new Date(lease.leaseEndDate) < new Date());
              
              if (isLeaseEnded) {
                // Try to find property details
                try {
                  const property = await api.get(`/properties/${lease.property._id || lease.property}`);
                  const unit = property.data.units.find(u => u._id === lease.unit);
                  
                  if (unit && property.data) {
                    allLeaseHistory.push({
                      unit,
                      property: property.data,
                      lease
                    });
                  }
                } catch (error) {
                  console.error('Error loading property for lease:', error);
                }
              }
            }
            
            setTenantData({
              currentUnits,
              previousUnits,
              allLeaseHistory,
              payments: payments
            });
          } catch (leaseError) {
            console.error('Error loading lease:', leaseError);
            setTenantData({ currentUnits: [], previousUnits: [], allLeaseHistory: [], payments: [] });
          }
          
          // Load payment stats
          const invoices = await api.get('/invoices');
          const paid = invoices.data.filter((i) => i.status === 'PAID');
          setStats({ 
            properties: tenantUnits.length, 
            unitsAvailable: 0, 
            unitsOccupied: tenantUnits.length, 
            rentCollected: paid.reduce((s,i)=>s+i.amount,0) 
          });
        } else {
          // Admin/Owner dashboard
          const props = await api.get('/properties');
          let available = 0, occupied = 0;
          for (const p of props.data) {
            for (const u of p.units) {
              if (u.status === 'AVAILABLE') available++; else if (u.status === 'OCCUPIED') occupied++;
            }
          }
          const payments = await api.get('/payments');
          const collected = payments.data.filter((p)=>p.status==='SUCCEEDED').reduce((s,p)=>s+p.amount,0);
          setStats({ properties: props.data.length, unitsAvailable: available, unitsOccupied: occupied, rentCollected: collected });
          
          // Load detailed property statistics
          await loadPropertyStats();
          
          // Load tenant and rent statistics
          await loadTenantRentStats();
        }
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  // Tenant Dashboard
  if (user.role === 'TENANT') {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Here's your current rental information and payment schedule.
          </p>
        </div>

        {/* Current Occupied Units */}
        {tenantData.currentUnits.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Home size={24} className="text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Current Occupied Units</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tenantData.currentUnits.map((unitData, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  {/* Property and Unit Header */}
                  <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Building size={20} />
                          {unitData.property.title}
                        </h3>
                        <div className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                          Unit {unitData.unit.name}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin size={14} />
                        <span>{unitData.property.address}, {unitData.property.city}</span>
                      </div>
                    </div>

                    {/* Unit Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Bed size={16} className="text-gray-500" />
                        <span>{unitData.unit.bedrooms} Bedrooms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath size={16} className="text-gray-500" />
                        <span>{unitData.unit.bathrooms} Bathrooms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-gray-500" />
                        <span>{unitData.unit.parking} Parking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Size:</span>
                        <span>{unitData.unit.sizeSqFt} sq ft</span>
                      </div>
                    </div>

                    {/* Monthly Rent */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          ${unitData.unit.rentAmount}
                        </span>
                      </div>
                    </div>

                    {/* Lease Agreement */}
                    {unitData.lease && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={16} />
                            Lease Agreement
                          </h4>
                          <button
                            onClick={() => downloadAgreement(unitData.lease)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            <Download size={12} />
                            View PDF
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Agreement #{unitData.lease.agreementNumber} • 
                          {new Date(unitData.lease.leaseStartDate).toLocaleDateString()} - {new Date(unitData.lease.leaseEndDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Rent Payment Schedule Toggle */}
                    {unitData.rentSchedule && unitData.rentSchedule.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <button
                          onClick={() => toggleRentSchedule(unitData.unit._id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          <Calendar size={16} />
                          {showRentSchedules[unitData.unit._id] ? 'Hide' : 'View'} Rent Payment Schedule
                        </button>
                        
                        {showRentSchedules[unitData.unit._id] && (
                          <div className="mt-4 space-y-2">
                            {unitData.rentSchedule.map((payment, paymentIndex) => (
                              <div 
                                key={paymentIndex}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  payment.isCurrentMonth 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                    : payment.status === 'due'
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                    : payment.status === 'pending'
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                    : payment.status === 'paid'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {payment.status === 'paid' ? (
                                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                                  ) : payment.status === 'due' ? (
                                    <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                                  ) : payment.status === 'pending' ? (
                                    <Clock size={16} className="text-yellow-600 dark:text-yellow-400" />
                                  ) : payment.isCurrentMonth ? (
                                    <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <Clock size={16} className="text-gray-600 dark:text-gray-400" />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                      {payment.month}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      Due: {payment.dueDate}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-900 dark:text-white">
                                    ${payment.amount}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className={`text-xs px-2 py-1 rounded-full ${
                                      payment.status === 'paid'
                                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                        : payment.status === 'due'
                                        ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                                        : payment.status === 'pending'
                                        ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                                        : payment.isCurrentMonth
                                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                    }`}>
                                      {payment.status === 'paid' ? 'Paid' : 
                                       payment.status === 'due' ? 'Due' :
                                       payment.status === 'pending' ? 'Pending' :
                                       payment.isCurrentMonth ? 'Current' : 'Upcoming'}
                                    </div>
                                    {(payment.isCurrentMonth || payment.status === 'due') && (
                                      <button
                                        onClick={() => handlePayRent(payment, unitData)}
                                        className="ml-1 flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-full font-medium transition-colors"
                                      >
                                        <CreditCard size={10} />
                                        Pay
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lease History Toggle */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <button
                        onClick={() => toggleLeaseHistory(unitData.unit._id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      >
                        <FileText size={16} />
                        {showLeaseHistory[unitData.unit._id] ? 'Hide' : 'View'} Lease History
                      </button>
                      
                      {showLeaseHistory[unitData.unit._id] && leaseHistory[unitData.unit._id] && (
                        <div className="mt-4 space-y-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3">
                            Lease History for Unit {unitData.unit.name}
                          </h4>
                          {leaseHistory[unitData.unit._id].map((lease, index) => (
                            <div 
                              key={lease._id}
                              className={`p-3 rounded-lg border ${
                                lease.status === 'ACTIVE' 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {lease.status === 'ACTIVE' ? (
                                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                                  ) : (
                                    <AlertCircle size={16} className="text-gray-500" />
                                  )}
                                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                                    Agreement #{lease.agreementNumber}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    lease.status === 'ACTIVE'
                                      ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {lease.status === 'ACTIVE' ? 'Active' : 'Ended'}
                                  </span>
                                </div>
                                {lease.agreementPdfPath && (
                                  <button
                                    onClick={() => downloadAgreement(lease)}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                  >
                                    <Download size={10} />
                                    PDF
                                  </button>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <div>
                                  <strong>Period:</strong> {new Date(lease.leaseStartDate).toLocaleDateString()} - {new Date(lease.leaseEndDate).toLocaleDateString()}
                                </div>
                                <div>
                                  <strong>Rent:</strong> ${lease.monthlyRent}/month
                                </div>
                                {lease.securityDeposit && (
                                  <div>
                                    <strong>Deposit:</strong> ${lease.securityDeposit}
                                  </div>
                                )}
                                {lease.moveOutDate && (
                                  <div>
                                    <strong>Move-out:</strong> {new Date(lease.moveOutDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Occupied Units */}
        {tenantData.previousUnits.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={24} className="text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Previously Occupied Units</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tenantData.previousUnits.map((unitData, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-75">
                    {/* Property and Unit Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Building size={20} />
                          {unitData.property.title}
                        </h3>
                        <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          Unit {unitData.unit.name} (Ended)
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin size={14} />
                        <span>{unitData.property.address}, {unitData.property.city}</span>
                      </div>
                    </div>

                    {/* Unit Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Bed size={16} className="text-gray-500" />
                        <span>{unitData.unit.bedrooms} Bedrooms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath size={16} className="text-gray-500" />
                        <span>{unitData.unit.bathrooms} Bathrooms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-gray-500" />
                        <span>{unitData.unit.parking} Parking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Size:</span>
                        <span>{unitData.unit.sizeSqFt} sq ft</span>
                      </div>
                    </div>

                    {/* Lease Information */}
                    {unitData.lease && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={16} />
                            Ended Lease Agreement
                          </h4>
                          <button
                            onClick={() => downloadAgreement(unitData.lease)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                          >
                            <Download size={12} />
                            View PDF
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Agreement #{unitData.lease.agreementNumber} • 
                          Ended: {unitData.lease.moveOutDate ? new Date(unitData.lease.moveOutDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lease History - When no current units but has history */}
        {tenantData.currentUnits.length === 0 && tenantData.allLeaseHistory && tenantData.allLeaseHistory.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={24} className="text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Lease History</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tenantData.allLeaseHistory.map((unitData, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    {/* Property and Unit Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Building size={20} />
                          {unitData.property.title}
                        </h3>
                        <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full font-semibold">
                          Unit {unitData.unit.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm">
                        <MapPin size={14} />
                        <span>{unitData.property.address}</span>
                      </div>
                    </div>

                    {/* Unit Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Home className="text-gray-500" size={16} />
                        <span className="text-gray-500">Type:</span>
                        <span>{unitData.unit.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Size:</span>
                        <span>{unitData.unit.sizeSqFt} sq ft</span>
                      </div>
                      {unitData.unit.bedrooms > 0 && (
                        <div className="flex items-center gap-2">
                          <Bed className="text-gray-500" size={16} />
                          <span>{unitData.unit.bedrooms} Bed</span>
                        </div>
                      )}
                      {unitData.unit.bathrooms > 0 && (
                        <div className="flex items-center gap-2">
                          <Bath className="text-gray-500" size={16} />
                          <span>{unitData.unit.bathrooms} Bath</span>
                        </div>
                      )}
                    </div>

                    {/* Lease Information */}
                    {unitData.lease && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={16} />
                            Lease Agreement
                          </h4>
                          <button
                            onClick={() => downloadAgreement(unitData.lease)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            <Download size={12} />
                            View PDF
                          </button>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Agreement:</span>
                            <span className="font-medium">#{unitData.lease.agreementNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">Period:</span>
                            <span>{new Date(unitData.lease.leaseStartDate).toLocaleDateString()} - {new Date(unitData.lease.leaseEndDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">Rent:</span>
                            <span className="font-medium">${unitData.lease.monthlyRent}/month</span>
                          </div>
                          {unitData.lease.status && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">Status:</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                unitData.lease.status === 'TERMINATED' 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {unitData.lease.status}
                              </span>
                            </div>
                          )}
                          {unitData.lease.terminatedDate && (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <AlertCircle size={14} />
                              <span className="text-xs">Terminated: {new Date(unitData.lease.terminatedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment History */}
                    {unitData.lease && (() => {
                      const leasePayments = tenantData.payments.filter(
                        p => p.lease === unitData.lease._id
                      );
                      
                      if (leasePayments.length === 0) return null;
                      
                      return (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign size={16} />
                            Payment History
                          </h4>
                          <div className="space-y-1.5">
                            {leasePayments.map((payment, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between text-sm p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex items-center gap-2">
                                  <Calendar size={12} className="text-gray-500" />
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    ${payment.amount}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    payment.status === 'COMPLETED' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : payment.status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {payment.status}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {payment.paymentMethod}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {/* Payment Summary */}
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between text-sm font-semibold">
                              <span className="text-gray-700 dark:text-gray-300">Total Paid:</span>
                              <span className="text-green-600 dark:text-green-400">
                                ${leasePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Units and No History Message */}
        {tenantData.currentUnits.length === 0 && tenantData.previousUnits.length === 0 && (!tenantData.allLeaseHistory || tenantData.allLeaseHistory.length === 0) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">No Units Found</h3>
                <p className="text-yellow-700 dark:text-yellow-300">
                  You are not currently assigned to any units and have no previous rental history. Please contact your property manager.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Admin/Owner Dashboard
  return (
    <div className="space-y-6">

      {/* Compact Property & Unit Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Property & Unit Statistics</h2>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Building size={16} className="text-blue-600" />
                <span className="text-gray-600 dark:text-gray-400">Properties:</span>
                <span className="font-bold text-gray-900 dark:text-white">{propertyStats.totalProperties}</span>
              </div>
              <div className="flex items-center gap-1">
                <Home size={16} className="text-green-600" />
                <span className="text-gray-600 dark:text-gray-400">Units:</span>
                <span className="font-bold text-gray-900 dark:text-white">{propertyStats.totalUnits}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle size={16} className="text-yellow-600" />
                <span className="text-gray-600 dark:text-gray-400">Vacant:</span>
                <span className="font-bold text-gray-900 dark:text-white">{propertyStats.vacantUnits}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} className="text-red-600" />
                <span className="text-gray-600 dark:text-gray-400">Maintenance:</span>
                <span className="font-bold text-gray-900 dark:text-white">{propertyStats.maintenanceUnits}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Property-wise Breakdown */}
        <div className="p-4">
          {propertyStats.propertyStats.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {propertyStats.propertyStats.map((property) => (
                <div key={property.propertyId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{property.propertyName}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{property.propertyAddress}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{property.totalUnits} Units</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-xs text-green-800 dark:text-green-200">{property.occupied}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle size={14} className="text-yellow-600" />
                        <span className="text-xs text-yellow-800 dark:text-yellow-200">{property.vacant}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-red-600" />
                        <span className="text-xs text-red-800 dark:text-red-200">{property.maintenance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Building size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No properties found</p>
            </div>
          )}
        </div>
      </div>

      {/* Compact Tenant & Rent Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={20} className="text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tenant & Rent Statistics</h2>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <User size={16} className="text-purple-600" />
                <span className="text-gray-600 dark:text-gray-400">Tenants:</span>
                <span className="font-bold text-gray-900 dark:text-white">{tenantRentStats.totalActiveTenants}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                <span className="font-bold text-gray-900 dark:text-white">${tenantRentStats.totalPaidRent.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} className="text-yellow-600" />
                <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                <span className="font-bold text-gray-900 dark:text-white">${tenantRentStats.totalPendingRent.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle size={16} className="text-red-600" />
                <span className="text-gray-600 dark:text-gray-400">Due:</span>
                <span className="font-bold text-gray-900 dark:text-white">${tenantRentStats.totalDueRent.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Property-wise Tenant & Rent Breakdown */}
        <div className="p-4">
          {tenantRentStats.propertyTenantStats.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {tenantRentStats.propertyTenantStats.map((property) => (
                <div key={property.propertyId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{property.propertyName}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{property.propertyAddress}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{property.activeTenants}/{property.totalUnits} Tenants</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-xs text-green-800 dark:text-green-200">${property.paidRent.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-yellow-600" />
                        <span className="text-xs text-yellow-800 dark:text-yellow-200">${property.pendingRent.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle size={14} className="text-red-600" />
                        <span className="text-xs text-red-800 dark:text-red-200">${property.dueRent.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Tenant Details */}
                  {property.tenantDetails.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {property.tenantDetails.slice(0, 3).map((tenant, index) => (
                          <div key={index} className="flex items-center gap-1 bg-white dark:bg-gray-600 rounded px-2 py-1 text-xs">
                            <User size={12} className="text-gray-500" />
                            <span className="text-gray-900 dark:text-white">{tenant.tenantName}</span>
                            <span className="text-gray-500 dark:text-gray-400">({tenant.unitName})</span>
                          </div>
                        ))}
                        {property.tenantDetails.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                            +{property.tenantDetails.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <User size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No tenant data found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


