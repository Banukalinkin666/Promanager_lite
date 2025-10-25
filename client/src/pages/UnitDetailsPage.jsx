import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Home, User, Calendar, DollarSign, Zap, Droplets, Car, Wrench, ChevronDown, ChevronUp, Building, Settings, Mail, Phone, CreditCard } from 'lucide-react';
import { useToast } from '../components/ToastContainer';
import api from '../lib/api';

const UnitDetailsPage = () => {
  const { propertyId, unitId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState([1, 2, 3]);

  useEffect(() => {
    if (location.state?.property && location.state?.unit) {
      setProperty(location.state.property);
      setUnit(location.state.unit);
      setLoading(false);
      loadAdditionalData();
    } else {
      loadData();
    }
  }, [location.state, propertyId, unitId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [propertyResponse, unitResponse] = await Promise.all([
        api.get(`/properties/${propertyId}`),
        api.get(`/properties/${propertyId}/units/${unitId}`)
      ]);
      
      setProperty(propertyResponse.data);
      setUnit(unitResponse.data);
      loadAdditionalData();
    } catch (err) {
      setError('Failed to load unit data');
      console.error('Error loading unit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalData = async () => {
    if (!unit) return;

    try {
      // Load tenant if unit is occupied
      if (unit.status === 'OCCUPIED' && unit.tenant) {
        try {
          const tenantResponse = await api.get(`/tenants/${unit.tenant}`);
          setTenant(tenantResponse.data);
        } catch (err) {
          console.error('Error loading tenant:', err);
        }
      }

      // Load lease information
      if (unit.status === 'OCCUPIED') {
        try {
          const leaseResponse = await api.get(`/move-in/leases?unitId=${unitId}`);
          if (leaseResponse.data && leaseResponse.data.length > 0) {
            setLease(leaseResponse.data[0]);
          }
        } catch (err) {
          console.error('Error loading lease:', err);
        }
      }
    } catch (err) {
      console.error('Error loading additional data:', err);
    }
  };

  const handleEditUnit = () => {
    navigate(`/properties/${propertyId}/units/${unitId}/edit`, {
      state: { property, unit }
    });
  };

  const handleEditLease = () => {
    if (lease) {
      navigate(`/properties/${propertyId}/units/${unitId}/lease/edit`, {
        state: { property, unit, lease }
      });
    }
  };

  const handleViewLeaseDetails = () => {
    if (lease) {
      navigate(`/properties/${propertyId}/units/${unitId}/lease/details`, {
        state: { property, unit, lease, tenant }
      });
    }
  };

  const toggleSection = (sectionNumber) => {
    setExpandedSections(prev => 
      prev.includes(sectionNumber) 
        ? prev.filter(num => num !== sectionNumber)
        : [...prev, sectionNumber]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading unit details...</p>
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
              onClick={() => navigate(`/properties/${propertyId}`)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Property
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Unit Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {property?.title} - {unit?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleEditUnit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={16} />
            Edit Unit
          </button>
        </div>

        <div className="max-w-6xl mx-auto space-y-4">
          {/* Section 1: Unit Information */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(1)}
              className="w-full bg-blue-50 dark:bg-blue-900 p-4 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <Home size={20} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">Unit Information</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unit details and specifications</div>
              {expandedSections.includes(1) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.includes(1) && (
              <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unit Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{unit?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                    <p className="font-medium text-gray-900 dark:text-white">{unit?.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      unit?.status === 'OCCUPIED' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : unit?.status === 'AVAILABLE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {unit?.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bedrooms</p>
                    <p className="font-medium text-gray-900 dark:text-white">{unit?.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bathrooms</p>
                    <p className="font-medium text-gray-900 dark:text-white">{unit?.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</p>
                    <p className="font-medium text-gray-900 dark:text-white">${unit?.rentAmount}</p>
                  </div>
                </div>

                {/* Utilities */}
                {(unit?.utilities?.electricity || unit?.utilities?.water) && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Utilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unit?.utilities?.electricity && (
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-yellow-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Electricity:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{unit.utilities.electricity}</span>
                        </div>
                      )}
                      {unit?.utilities?.water && (
                        <div className="flex items-center gap-2">
                          <Droplets size={16} className="text-blue-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Water:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{unit.utilities.water}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Parking */}
                {unit?.parking && (
                  <div className="flex items-center gap-2">
                    <Car size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Parking Available</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Tenant Information */}
          {tenant && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(2)}
                className="w-full bg-green-50 dark:bg-green-900 p-4 flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={20} className="text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">Current Tenant</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tenant contact and details</div>
                {expandedSections.includes(2) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(2) && (
                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {tenant.firstName} {tenant.middleName || ''} {tenant.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{tenant.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{tenant.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Lease Information */}
          {lease && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(3)}
                className="w-full bg-purple-50 dark:bg-purple-900 p-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">Lease Information</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Lease terms and agreements</div>
                {expandedSections.includes(3) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.includes(3) && (
                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lease Details</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditLease}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Lease
                      </button>
                      <button
                        onClick={handleViewLeaseDetails}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Agreement Number</p>
                      <p className="font-medium text-gray-900 dark:text-white">{lease.agreementNumber}</p>
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        lease.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : lease.status === 'EXPIRED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {lease.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Lease Information */}
          {!lease && unit?.status === 'OCCUPIED' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center">
                <Wrench size={20} className="text-yellow-400 mr-2" />
                <p className="text-yellow-800 dark:text-yellow-200">
                  Unit is occupied but no lease information found.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitDetailsPage;
