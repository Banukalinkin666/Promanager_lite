import React, { useState, useEffect } from 'react';
import { 
  Home, Building, MapPin, Square, 
  Bed, Bath, Car, Zap, Droplets, 
  CheckCircle, AlertCircle, Clock, User,
  FileText, Download, Calendar
} from 'lucide-react';
import api from '../lib/api.js';

const UnitDetailsModal = ({ unit, property, isOpen, onClose }) => {
  const [leaseHistory, setLeaseHistory] = useState([]);
  const [showLeaseHistory, setShowLeaseHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && unit) {
      setLeaseHistory([]);
      setShowLeaseHistory(false);
    }
  }, [isOpen, unit]);

  const loadLeaseHistory = async () => {
    if (leaseHistory.length > 0) return; // Already loaded
    
    setLoadingHistory(true);
    try {
      const response = await api.get(`/move-in/units/${unit._id}/lease-history`);
      setLeaseHistory(response.data || []);
    } catch (error) {
      console.error('Error loading lease history:', error);
      alert('Failed to load lease history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleLeaseHistory = () => {
    if (!showLeaseHistory && leaseHistory.length === 0) {
      loadLeaseHistory();
    }
    setShowLeaseHistory(!showLeaseHistory);
  };

  const downloadAgreement = async (lease) => {
    if (!lease) return;
    
    try {
      console.log('📄 Downloading PDF for lease:', lease._id);
      const token = localStorage.getItem('token');
      
      // Show loading state
      const loadingToast = document.createElement('div');
      loadingToast.textContent = 'Generating PDF...';
      loadingToast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:12px 24px;border-radius:8px;z-index:10000;';
      document.body.appendChild(loadingToast);
      
      // Fetch the PDF with proper authentication
      const response = await fetch(`/api/move-in/agreement/${lease._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      document.body.removeChild(loadingToast);
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', response.headers.get('content-type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Failed to download PDF: ${response.status}`);
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'bytes');
      console.log('📦 Blob type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('PDF is empty');
      }
      
      // Create a URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      console.log('🔗 Blob URL created:', blobUrl);
      
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
        alert('Popup was blocked. PDF has been downloaded instead.');
      }
    } catch (error) {
      console.error('❌ Error downloading agreement:', error);
      alert(`Failed to download rent agreement: ${error.message}`);
    }
  };

  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Unit Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Unit Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {unit.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {unit.type}
                </span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                  {unit.status}
                </span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">
                  ${unit.rentAmount}/month
                </span>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Property Information
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
                </div>
              </div>
            </div>

            {/* Unit Specifications */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Unit Specifications
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Size:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{unit.sizeSqFt} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Floor:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{unit.floor || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bedrooms:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{unit.bedrooms || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bathrooms:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{unit.bathrooms || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Parking:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{unit.parking || 0} spaces</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Rent Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">${unit.rentAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        unit.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        unit.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {unit.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meter Information */}
            {(unit.electricityMeterNo || unit.waterMeterNo) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Meter Information
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {unit.electricityMeterNo && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Zap size={14} />
                          Electricity Meter:
                        </span>
                        <p className="text-gray-900 dark:text-white">{unit.electricityMeterNo}</p>
                      </div>
                    )}
                    {unit.waterMeterNo && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Droplets size={14} />
                          Water Meter:
                        </span>
                        <p className="text-gray-900 dark:text-white">{unit.waterMeterNo}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Amenities */}
            {property?.features && property.features.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Property Amenities
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Current Tenant (if occupied) */}
            {unit.status === 'OCCUPIED' && unit.tenant && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Current Tenant
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Name: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{unit.tenant.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Email: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{unit.tenant.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lease History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lease History
                </h4>
                <button
                  onClick={toggleLeaseHistory}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  <FileText size={16} />
                  {showLeaseHistory ? 'Hide' : 'View'} History
                </button>
              </div>
              
              {showLeaseHistory && (
                <div className="space-y-3">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading lease history...</span>
                    </div>
                  ) : leaseHistory.length > 0 ? (
                    leaseHistory.map((lease, index) => {
                      // Check if lease is active based on status field and date
                      // Lease is active if:
                      // 1. Status is 'ACTIVE' (not TERMINATED or EXPIRED)
                      // 2. AND leaseEndDate hasn't passed yet
                      const leaseEndDate = new Date(lease.leaseEndDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
                      const isLeaseActive = lease.status === 'ACTIVE' && leaseEndDate >= today;
                      
                      console.log('📅 Lease Status Check:', {
                        agreementNumber: lease.agreementNumber,
                        status: lease.status,
                        leaseEndDate: leaseEndDate.toLocaleDateString(),
                        today: today.toLocaleDateString(),
                        isLeaseActive,
                        reason: lease.status !== 'ACTIVE' 
                          ? 'Lease terminated/expired' 
                          : leaseEndDate < today 
                            ? 'End date passed' 
                            : 'Active'
                      });
                      
                      return (
                        <div 
                          key={lease._id}
                          className={`p-4 rounded-lg border ${
                            isLeaseActive 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isLeaseActive ? (
                                <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                              ) : (
                                <AlertCircle size={18} className="text-gray-500" />
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">
                                Agreement #{lease.agreementNumber}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                isLeaseActive
                                  ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                              }`}>
                                {isLeaseActive ? 'Active' : 'Inactive'}
                              </span>
                              {/* Show "Current Lease" badge for active leases */}
                              {isLeaseActive && unit.status === 'OCCUPIED' && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold">
                                  Current Lease
                                </span>
                              )}
                            </div>
                          {lease.agreementPdfPath && (
                            <button
                              onClick={() => downloadAgreement(lease)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                            >
                              <Download size={12} />
                              PDF
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Period:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {new Date(lease.leaseStartDate).toLocaleDateString()} - {new Date(lease.leaseEndDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Rent:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              ${lease.monthlyRent}/month
                            </span>
                          </div>
                          {lease.securityDeposit && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Deposit:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                ${lease.securityDeposit}
                              </span>
                            </div>
                          )}
                          {/* Show termination or end date for inactive leases */}
                          {!isLeaseActive && (
                            <div className="col-span-2">
                              {lease.status === 'TERMINATED' && lease.terminatedDate ? (
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                  <AlertCircle size={14} />
                                  <span className="text-gray-600 dark:text-gray-400">Terminated:</span>
                                  <span className="font-medium">
                                    {new Date(lease.terminatedDate).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : leaseEndDate < today ? (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Clock size={14} />
                                  <span>Lease Ended:</span>
                                  <span className="font-medium">
                                    {new Date(lease.leaseEndDate).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          )}
                          {lease.moveOutDate && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Move-out:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {new Date(lease.moveOutDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {lease.tenant && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Tenant:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {lease.tenant.name}
                              </span>
                              {lease.tenant.email && (
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                  ({lease.tenant.email})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No lease history found for this unit.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitDetailsModal;
