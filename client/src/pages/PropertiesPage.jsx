import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Home, Edit, Trash2, Eye, FileText, Plus, 
  Building, MapPin, DollarSign, Users, 
  Wrench, CheckCircle, AlertCircle, 
  Bed, Bath, Car, Zap, Droplets,
  Circle, Building2, UserCheck, Search, X,
  Calendar, Clock
} from 'lucide-react';
import api from '../lib/api.js';
import MoveInModal from '../components/MoveInModal.jsx';
import UnitDetailsModal from '../components/UnitDetailsModal.jsx';
import RentScheduleModal from '../components/RentScheduleModal.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import EditLeaseModal from '../components/EditLeaseModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/ToastContainer.jsx';

// Get API base URL for images
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
};

// Get image URL (handles both local and cloud URLs)
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    console.log('getImageUrl: No image path provided');
    return '';
  }
  
  // If it's already a full URL (Cloudinary), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('getImageUrl: Full URL detected:', imagePath);
    return imagePath;
  }
  
  // Otherwise, it's a local path, prepend API base URL
  const fullUrl = `${getApiBaseUrl()}${imagePath}`;
  console.log('getImageUrl: Local path, constructing URL:', { imagePath, fullUrl });
  return fullUrl;
};

// Edit Lease Button Component
const EditLeaseButton = ({ unit, onEdit }) => {
  const [hasRent, setHasRent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRentCollection();
  }, [unit._id]);

  const checkRentCollection = async () => {
    try {
      const response = await api.get(`/payments?unitId=${unit._id}&status=SUCCEEDED`);
      setHasRent(response.data && response.data.length > 0);
    } catch (error) {
      console.error('Error checking rent collection:', error);
      setHasRent(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="px-3 py-1 bg-gray-400 text-white text-xs rounded-lg cursor-not-allowed flex items-center gap-1"
      >
        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
        Loading...
      </button>
    );
  }

  if (hasRent) {
    return null; // Don't show button if rent has been collected
  }

  return (
    <button
      onClick={() => onEdit(unit)}
      className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
      title="Edit Lease Details"
    >
      <Edit size={12} />
      Edit Lease
    </button>
  );
};

const PROPERTY_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'MIXED'];
const PROPERTY_STRUCTURES = ['SINGLE_UNIT', 'MULTI_UNIT'];

const FEATURES = [
  'Air conditioning', 'Balcony, deck, patio', 'Cable Ready', 'Carpet', 'Ceiling Fans',
  'Central Heating', 'Dishwasher', 'Fenced Yard', 'Fireplace', 'Garbage Disposal',
  'Hardwood floors', 'Internet', 'Microwave', 'Oven/Range', 'Refrigerator',
  'Stainless Steel Appliance', 'Storage', 'Stove', 'Telephone', 'Tile',
  'Towels', 'Vacuum Cleaner', 'Walk-in closets', 'Washer/Dryer', 'Window Coverings', 'Yard'
];

export default function PropertiesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [showMoveInModal, setShowMoveInModal] = useState(false);
  const [selectedUnitForMoveIn, setSelectedUnitForMoveIn] = useState(null);
  const [showUnitDetailsModal, setShowUnitDetailsModal] = useState(false);
  const [selectedUnitForDetails, setSelectedUnitForDetails] = useState(null);
  const [showRentScheduleModal, setShowRentScheduleModal] = useState(false);
  const [selectedUnitForSchedule, setSelectedUnitForSchedule] = useState(null);
  const [showEndLeaseConfirmation, setShowEndLeaseConfirmation] = useState(false);
  const [unitToEndLease, setUnitToEndLease] = useState(null);
  const [showEditLeaseModal, setShowEditLeaseModal] = useState(false);
  const [selectedUnitForEditLease, setSelectedUnitForEditLease] = useState(null);
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', data: null });
  const [uploading, setUploading] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unit: '',
    type: 'APARTMENT',
    sizeSqFt: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    rentAmount: '',
    electricityMeterNo: '',
    waterMeterNo: '',
    amenities: []
  });
  const [formData, setFormData] = useState({
    title: '',
    propertyType: 'RESIDENTIAL',
    country: '',
    city: '',
    state: '',
    zipCode: '',
    propertyStructure: 'SINGLE_UNIT',
    baseRent: '',
    electricityMeterNo: '',
    waterMeterNo: '',
    features: [],
    images: []
  });

  const load = async () => {
    const res = await api.get('/properties');
    setProperties(res.data);
  };

  const loadProperty = async (propertyId) => {
    const res = await api.get(`/properties/${propertyId}`);
    setSelectedProperty(res.data);
  };

  useEffect(() => { 
    load(); 
    if (id) {
      loadProperty(id);
    }
  }, [id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Please upload only image files (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file sizes (5MB max per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast.error('Each image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      files.forEach(file => {
        uploadFormData.append('images', file);
      });

      toast.info(`Uploading ${files.length} image(s)...`);

      const response = await api.post('/properties/upload-images', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrls = response.data.imageUrls;
      
      if (imageUrls && imageUrls.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, ...imageUrls] 
        }));
        toast.success(`${imageUrls.length} image(s) uploaded successfully!`);
      } else {
        toast.error('No images were uploaded. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      const errorMessage = error.response?.data?.message || 'Error uploading images. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const resetForm = () => {
    setFormData({
      title: '', propertyType: 'RESIDENTIAL', country: '', city: '', state: '', zipCode: '',
      propertyStructure: 'SINGLE_UNIT', baseRent: '', electricityMeterNo: '', waterMeterNo: '',
      features: [], images: []
    });
    setEditingProperty(null);
    setShowForm(false);
  };

  const editProperty = (property) => {
    console.log('📝 Editing property:', property);
    console.log('📸 Property photos:', property.photos);
    
    setEditingProperty(property);
    setFormData({
      title: property.title || '',
      propertyType: property.type || 'RESIDENTIAL',
      country: property.country || '',
      city: property.city || '',
      state: property.state || '',
      zipCode: property.zipCode || '',
      propertyStructure: property.propertyStructure || 'SINGLE_UNIT',
      baseRent: property.baseRent || '',
      electricityMeterNo: property.electricityMeterNo || '',
      waterMeterNo: property.waterMeterNo || '',
      features: property.features || [],
      images: property.photos || []
    });
    
    console.log('📋 Form data images set to:', property.photos || []);
    setShowForm(true);
  };

  const deleteProperty = (propertyId) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      title: 'Delete Property',
      message: 'Are you sure you want to delete this property? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/properties/${propertyId}`);
          toast.success('Property deleted successfully');
          load();
          if (selectedProperty && selectedProperty._id === propertyId) {
            setSelectedProperty(null);
            navigate('/properties');
          }
        } catch (error) {
          console.error('Error deleting property:', error);
          toast.error(error.response?.data?.message || 'Failed to delete property');
        } finally {
          setConfirmDialog({ isOpen: false, type: '', data: null });
        }
      },
      onCancel: () => {
        setConfirmDialog({ isOpen: false, type: '', data: null });
      }
    });
  };

  const resetUnitForm = () => {
    setUnitForm({ 
      unit: '', type: 'APARTMENT', sizeSqFt: '', floor: '',
      bedrooms: '', bathrooms: '', parking: '', rentAmount: '', 
      electricityMeterNo: '', waterMeterNo: '', amenities: [] 
    });
    setEditingUnit(null);
    setShowUnitForm(false);
  };

  const editUnit = (unit) => {
    setEditingUnit(unit);
    setUnitForm({
      unit: unit.name || '',
      type: unit.type || 'APARTMENT',
      sizeSqFt: unit.sizeSqFt || '',
      floor: unit.floor || '',
      bedrooms: unit.bedrooms || '',
      bathrooms: unit.bathrooms || '',
      parking: unit.parking || '',
      rentAmount: unit.rentAmount || '',
      electricityMeterNo: unit.electricityMeterNo || '',
      waterMeterNo: unit.waterMeterNo || '',
      amenities: unit.amenities || []
    });
    setShowUnitForm(true);
  };

  const deleteUnit = (unitId) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      title: 'Delete Unit',
      message: 'Are you sure you want to delete this unit? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/properties/${selectedProperty._id}/units/${unitId}`);
          toast.success('Unit deleted successfully');
          loadProperty(selectedProperty._id);
        } catch (error) {
          console.error('Error deleting unit:', error);
          toast.error(error.response?.data?.message || 'Failed to delete unit');
        } finally {
          setConfirmDialog({ isOpen: false, type: '', data: null });
        }
      },
      onCancel: () => {
        setConfirmDialog({ isOpen: false, type: '', data: null });
      }
    });
  };

  const addUnit = async (e) => {
    e.preventDefault();
    const unitData = {
      ...unitForm,
      name: unitForm.unit, // Map unit field to name for backend
      sizeSqFt: parseFloat(unitForm.sizeSqFt),
      rentAmount: parseFloat(unitForm.rentAmount),
      bedrooms: parseInt(unitForm.bedrooms) || 0,
      bathrooms: parseInt(unitForm.bathrooms) || 0,
      parking: parseInt(unitForm.parking) || 0,
      floor: parseInt(unitForm.floor) || 0,
      status: editingUnit ? editingUnit.status : 'AVAILABLE'
    };
    
    if (editingUnit && editingUnit._id) {
      await api.put(`/properties/${selectedProperty._id}/units/${editingUnit._id}`, unitData);
    } else {
      await api.post(`/properties/${selectedProperty._id}/units`, unitData);
    }
    
    resetUnitForm();
    loadProperty(selectedProperty._id);
  };

  const updateUnitStatus = async (unitId, status) => {
    await api.put(`/properties/${selectedProperty._id}/units/${unitId}`, { status });
    loadProperty(selectedProperty._id);
  };

  const handleMoveIn = (unit) => {
    setSelectedUnitForMoveIn(unit);
    setShowMoveInModal(true);
  };

  const handleMoveInSuccess = () => {
    loadProperty(selectedProperty._id);
    setShowMoveInModal(false);
    setSelectedUnitForMoveIn(null);
  };

  const handleViewUnit = (unit) => {
    setSelectedUnitForDetails(unit);
    setShowUnitDetailsModal(true);
  };

  const handleViewRentSchedule = (unit) => {
    setSelectedUnitForSchedule(unit);
    setShowRentScheduleModal(true);
  };

  // Check if any rent has been collected for a unit
  const hasCollectedRent = async (unitId) => {
    try {
      const response = await api.get(`/payments?unitId=${unitId}&status=SUCCEEDED`);
      return response.data && response.data.length > 0;
    } catch (error) {
      console.error('Error checking rent collection:', error);
      return false;
    }
  };

  // Handle edit lease
  const handleEditLease = async (unit) => {
    const hasRent = await hasCollectedRent(unit._id);
    if (hasRent) {
      toast.warning('Cannot edit lease after rent has been collected.');
      return;
    }
    setSelectedUnitForEditLease(unit);
    setShowEditLeaseModal(true);
  };

  const handleEndLease = (unit) => {
    setUnitToEndLease(unit);
    setShowEndLeaseConfirmation(true);
  };

  const confirmEndLease = async () => {
    if (!unitToEndLease) return;

    try {
      // Update unit status to AVAILABLE
      await api.put(`/properties/${selectedProperty._id}/units/${unitToEndLease._id}`, {
        status: 'AVAILABLE',
        tenant: null
      });

      // Remove pending payments for this unit
      await api.delete(`/payments/unit/${unitToEndLease._id}/pending`);

      // Reload the property to get updated data
      await loadProperty(selectedProperty._id);
      
      // Close confirmation modal
      setShowEndLeaseConfirmation(false);
      setUnitToEndLease(null);
      
      // Trigger a global refresh event for tenant dashboard
      window.dispatchEvent(new CustomEvent('leaseEnded', {
        detail: { 
          unitId: unitToEndLease._id,
          tenantId: unitToEndLease.tenant
        }
      }));
      
      toast.success('Lease ended successfully. All pending rent payments have been removed.');
    } catch (error) {
      console.error('Error ending lease:', error);
      toast.error(error.response?.data?.message || 'Error ending lease. Please try again.');
    }
  };

  const cancelEndLease = () => {
    setShowEndLeaseConfirmation(false);
    setUnitToEndLease(null);
  };


  const addProperty = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProperty) {
        // For editing, don't include units to preserve existing ones
        const propertyData = {
          ...formData,
          address: `${formData.city}, ${formData.state}, ${formData.country} ${formData.zipCode}`,
          type: formData.propertyType,
          baseRent: parseFloat(formData.baseRent),
          photos: formData.images
          // Note: Not including units array to preserve existing units
        };
        
        console.log('📤 Updating property with data:', propertyData);
        await api.put(`/properties/${editingProperty._id}`, propertyData);
        toast.success('Property updated successfully');
      } else {
        // For new properties, include units based on structure
        const propertyData = {
          ...formData,
          address: `${formData.city}, ${formData.state}, ${formData.country} ${formData.zipCode}`,
          type: formData.propertyType,
          baseRent: parseFloat(formData.baseRent),
          photos: formData.images,
          units: formData.propertyStructure === 'SINGLE_UNIT' ? [{
            name: 'Main Unit',
            type: 'APARTMENT',
            rentAmount: parseFloat(formData.baseRent),
            status: 'AVAILABLE',
            amenities: formData.features
          }] : []
        };
        
        console.log('📤 Creating property with data:', propertyData);
        const response = await api.post('/properties', propertyData);
        console.log('✅ Property created:', response.data);
        toast.success('Property created successfully');
      }
      
      resetForm();
      await load(); // Ensure we wait for reload
    } catch (error) {
      console.error('❌ Error saving property:', error);
      toast.error(error.response?.data?.message || 'Failed to save property');
    }
  };

  // Calculate rent statistics
  const calculateRentStats = (property) => {
    if (!property || !property.units) return { totalRent: 0, collectedRent: 0 };
    
    const totalRent = property.units.reduce((sum, unit) => sum + (unit.rentAmount || 0), 0);
    // For demo purposes, assume 70% collection rate
    const collectedRent = totalRent * 0.7;
    
    return { totalRent, collectedRent };
  };

  // Calculate unit status counts
  const calculateUnitStats = (property) => {
    if (!property || !property.units) return { vacant: 0, occupied: 0, maintenance: 0 };
    
    const stats = { vacant: 0, occupied: 0, maintenance: 0 };
    property.units.forEach(unit => {
      if (unit.status === 'AVAILABLE') stats.vacant++;
      else if (unit.status === 'OCCUPIED') stats.occupied++;
      else if (unit.status === 'MAINTENANCE') stats.maintenance++;
    });
    
    return stats;
  };

  // Calculate unit stats for property cards
  const getPropertyUnitStats = (property) => {
    if (!property || !property.units) return { available: 0, occupied: 0, maintenance: 0, total: 0 };
    
    const stats = { available: 0, occupied: 0, maintenance: 0, total: property.units.length };
    property.units.forEach(unit => {
      if (unit.status === 'AVAILABLE') stats.available++;
      else if (unit.status === 'OCCUPIED') stats.occupied++;
      else if (unit.status === 'MAINTENANCE') stats.maintenance++;
    });
    
    return stats;
  };

  // If viewing a specific property
  if (selectedProperty) {
    const rentStats = calculateRentStats(selectedProperty);
    const unitStats = calculateUnitStats(selectedProperty);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setSelectedProperty(null);
              navigate('/properties');
            }}
            className="btn bg-gray-500 hover:bg-gray-600"
          >
            ← Back to Properties
          </button>
          <h1 className="text-2xl font-bold">{selectedProperty.title}</h1>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg">{selectedProperty.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-lg">{selectedProperty.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Structure</label>
                  <p className="text-lg">{selectedProperty.propertyStructure === 'SINGLE_UNIT' ? 'Single Unit' : 'Multi Unit'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Base Rent</label>
                  <p className="text-lg">${selectedProperty.baseRent}</p>
                </div>
                {selectedProperty.electricityMeterNo && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Electricity Meter</label>
                    <p className="text-lg">{selectedProperty.electricityMeterNo}</p>
                  </div>
                )}
                {selectedProperty.waterMeterNo && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Water Meter</label>
                    <p className="text-lg">{selectedProperty.waterMeterNo}</p>
                  </div>
                )}
              </div>
              
              {selectedProperty.features && selectedProperty.features.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Features</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProperty.features.map((feature, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Units Management */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Units</h2>
                <button 
                  onClick={() => setShowUnitForm(!showUnitForm)}
                  className="btn"
                >
                  {showUnitForm ? 'Cancel' : 'Add Unit'}
                </button>
              </div>

              {/* Unit Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search units by name, type, or status..."
                    value={unitSearchTerm}
                    onChange={(e) => setUnitSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  {unitSearchTerm && (
                    <button
                      onClick={() => setUnitSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>

              {showUnitForm && (
                <form onSubmit={addUnit} className="mb-6 p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
                    {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                  </h3>
                  
                  {/* Basic Information */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Basic Information</h4>
                    <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Property:</div>
                      <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">{selectedProperty?.title}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Unit *</label>
                        <input 
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="e.g., Unit 1A, Apt 2B"
                          value={unitForm.unit}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, unit: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Unit Type</label>
                        <select 
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={unitForm.type}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="APARTMENT">Apartment</option>
                          <option value="OFFICE">Office</option>
                          <option value="VILLA">Villa</option>
                          <option value="STUDIO">Studio</option>
                          <option value="PENTHOUSE">Penthouse</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Size (sq ft) *</label>
                        <input 
                          type="number"
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="650"
                          value={unitForm.sizeSqFt}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, sizeSqFt: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Floor</label>
                        <input 
                          type="number"
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="1"
                          value={unitForm.floor}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, floor: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Unit Details */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Unit Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">No of Bedrooms</label>
                        <input 
                          type="number"
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="2"
                          value={unitForm.bedrooms}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, bedrooms: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">No of Bathrooms</label>
                        <input 
                          type="number"
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="1"
                          value={unitForm.bathrooms}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, bathrooms: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Parking Spaces</label>
                        <input 
                          type="number"
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="1"
                          value={unitForm.parking}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, parking: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Rental Amount *</label>
                        <input 
                          type="number"
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="1200"
                          value={unitForm.rentAmount}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, rentAmount: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meter Information */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Meter Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Electricity Meter No</label>
                        <input 
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="EL123456"
                          value={unitForm.electricityMeterNo}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, electricityMeterNo: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Water Meter No</label>
                        <input 
                          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="WT789012"
                          value={unitForm.waterMeterNo}
                          onChange={(e) => setUnitForm(prev => ({ ...prev, waterMeterNo: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                      {editingUnit ? 'Update Unit' : 'Add Unit'}
                    </button>
                    <button type="button" onClick={resetUnitForm} className="btn bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {(() => {
                  const filteredUnits = selectedProperty.units?.filter(unit => {
                    if (!unitSearchTerm) return true;
                    const searchLower = unitSearchTerm.toLowerCase();
                    return (
                      unit.name?.toLowerCase().includes(searchLower) ||
                      unit.type?.toLowerCase().includes(searchLower) ||
                      unit.status?.toLowerCase().includes(searchLower) ||
                      unit.floor?.toString().includes(searchLower) ||
                      unit.bedrooms?.toString().includes(searchLower) ||
                      unit.bathrooms?.toString().includes(searchLower) ||
                      unit.rentAmount?.toString().includes(searchLower)
                    );
                  }) || [];

                  if (filteredUnits.length === 0 && unitSearchTerm) {
                    return (
                      <div className="text-center py-8">
                        <Search size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No units found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          No units match your search for "{unitSearchTerm}". Try adjusting your search terms.
                        </p>
                      </div>
                    );
                  }

                  if (filteredUnits.length === 0 && !unitSearchTerm) {
                    return (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🏢</div>
                        <p className="text-gray-500 dark:text-gray-400">No units added yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Click "Add Unit" to get started</p>
                      </div>
                    );
                  }

                  return filteredUnits.map((unit, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-gray-800 dark:text-white">
                            {unit.name} - {unit.status === 'OCCUPIED' ? 'Occupied' : unit.status === 'AVAILABLE' ? 'Available' : 'Maintenance'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {unit.type} • {unit.sizeSqFt} sq ft • Floor {unit.floor || 'N/A'} • ${unit.rentAmount}/month
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {unit.bedrooms > 0 && (
                              <div className="flex items-center gap-1">
                                <Bed size={12} />
                                {unit.bedrooms} Bed
                              </div>
                            )}
                            {unit.bathrooms > 0 && (
                              <div className="flex items-center gap-1">
                                <Bath size={12} />
                                {unit.bathrooms} Bath
                              </div>
                            )}
                            {unit.parking > 0 && (
                              <div className="flex items-center gap-1">
                                <Car size={12} />
                                {unit.parking} Parking
                              </div>
                            )}
                            {unit.electricityMeterNo && (
                              <div className="flex items-center gap-1">
                                <Zap size={12} />
                                {unit.electricityMeterNo}
                              </div>
                            )}
                            {unit.waterMeterNo && (
                              <div className="flex items-center gap-1">
                                <Droplets size={12} />
                                {unit.waterMeterNo}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {unit.status === 'OCCUPIED' ? (
                            <button
                              onClick={() => handleEndLease(unit)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                              title="End Lease"
                            >
                              <X size={12} />
                              End Lease
                            </button>
                          ) : (
                            <select 
                              value={unit.status}
                              onChange={(e) => updateUnitStatus(unit._id, e.target.value)}
                              className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="MAINTENANCE">Maintenance</option>
                            </select>
                          )}
                          {unit.status === 'AVAILABLE' && (
                            <button 
                              onClick={() => handleMoveIn(unit)}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                              title="Move In Tenant"
                            >
                              <Home size={12} />
                              Move In
                            </button>
                          )}
                          <button 
                            onClick={() => editUnit(unit)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                            title="Edit Unit"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteUnit(unit._id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                            title="Delete Unit"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                          <button
                            onClick={() => handleViewUnit(unit)}
                            className="px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                            title="View Unit Details"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          {unit.status === 'OCCUPIED' && (
                            <>
                              <EditLeaseButton unit={unit} onEdit={handleEditLease} />
                              <button
                                onClick={() => handleViewRentSchedule(unit)}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                                title="View Rent Payment Schedule"
                              >
                                <Calendar size={12} />
                                Schedule
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Widgets Sidebar */}
          <div className="space-y-6">
            {/* Rent Collection Widget */}
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign size={18} />
                Rent Collection
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Building size={14} />
                    Total Rent
                  </span>
                  <span className="font-medium text-lg">${rentStats.totalRent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500" />
                    Collected
                  </span>
                  <span className="font-medium text-lg text-green-600">${rentStats.collectedRent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <AlertCircle size={14} className="text-red-500" />
                    Pending
                  </span>
                  <span className="font-medium text-lg text-red-600">${(rentStats.totalRent - rentStats.collectedRent).toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(rentStats.collectedRent / rentStats.totalRent) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {((rentStats.collectedRent / rentStats.totalRent) * 100).toFixed(1)}% Collected
                </div>
              </div>
            </div>

            {/* Unit Status Widget */}
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 size={18} />
                Unit Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle size={16} className="text-green-500" />
                    <span className="text-sm">Available</span>
                  </div>
                  <span className="font-medium text-lg">{unitStats.vacant}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-blue-500" />
                    <span className="text-sm">Occupied</span>
                  </div>
                  <span className="font-medium text-lg">{unitStats.occupied}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-yellow-500" />
                    <span className="text-sm">Under Maintenance</span>
                  </div>
                  <span className="font-medium text-lg">{unitStats.maintenance}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Building size={16} />
                      Total Units
                    </span>
                    <span className="font-medium text-lg">{selectedProperty.units?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Image */}
            <div className="card">
              <h3 className="font-semibold mb-3">Property Image</h3>
              {selectedProperty.photos && selectedProperty.photos.length > 0 ? (
                <img 
                  src={getImageUrl(selectedProperty.photos[0])}
                  alt={selectedProperty.title}
                  className="w-full h-48 object-cover rounded"
                  onError={(e) => {
                    console.log('Image failed to load:', selectedProperty.photos[0]);
                    console.log('Full URL attempted:', `${getApiBaseUrl()}${selectedProperty.photos[0]}`);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center" style={{display: selectedProperty.photos && selectedProperty.photos.length > 0 ? 'none' : 'flex'}}>
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">🏠</div>
                  <p>No image available</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Move-In Modal */}
        <MoveInModal
          isOpen={showMoveInModal}
          onClose={() => {
            setShowMoveInModal(false);
            setSelectedUnitForMoveIn(null);
          }}
          unit={selectedUnitForMoveIn}
          property={selectedProperty}
          onSuccess={handleMoveInSuccess}
        />

        {/* Unit Details Modal */}
        <UnitDetailsModal
          isOpen={showUnitDetailsModal}
          onClose={() => {
            setShowUnitDetailsModal(false);
            setSelectedUnitForDetails(null);
          }}
          unit={selectedUnitForDetails}
          property={selectedProperty}
        />

        {/* Rent Schedule Modal */}
        <RentScheduleModal
          isOpen={showRentScheduleModal}
          onClose={() => {
            setShowRentScheduleModal(false);
            setSelectedUnitForSchedule(null);
          }}
          unit={selectedUnitForSchedule}
          property={selectedProperty}
        />

        {/* End Lease Confirmation Modal */}
        <ConfirmationModal
          isOpen={showEndLeaseConfirmation}
          onClose={cancelEndLease}
          onConfirm={confirmEndLease}
          title="End Lease"
          message="End lease without collecting due rents?"
          confirmText="OK"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600 hover:bg-red-700"
        />

        {/* Edit Lease Modal */}
        <EditLeaseModal
          isOpen={showEditLeaseModal}
          onClose={() => setShowEditLeaseModal(false)}
          unit={selectedUnitForEditLease}
          onSuccess={() => {
            // Refresh property data
            loadProperties();
          }}
        />

      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Properties</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn"
        >
          {showForm ? 'Cancel' : 'Add Property'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">Add New Property</h2>
          <form onSubmit={addProperty} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Property Title *</label>
                <input 
                  className="w-full p-2 rounded border" 
                  placeholder="Property Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property Type *</label>
                <select 
                  className="w-full p-2 rounded border"
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  required
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-medium mb-3">Property Location *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Country *</label>
                  <input 
                    className="w-full p-2 rounded border" 
                    placeholder="Country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City/Area *</label>
                  <input 
                    className="w-full p-2 rounded border" 
                    placeholder="City/Area"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State/Region *</label>
                  <input 
                    className="w-full p-2 rounded border" 
                    placeholder="State/Region"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP/PIN/PO *</label>
                  <input 
                    className="w-full p-2 rounded border" 
                    placeholder="ZIP/PIN/PO"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Property Structure & Rent */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Property Structure *</label>
                <select 
                  className="w-full p-2 rounded border"
                  value={formData.propertyStructure}
                  onChange={(e) => handleInputChange('propertyStructure', e.target.value)}
                  required
                >
                  {PROPERTY_STRUCTURES.map(structure => (
                    <option key={structure} value={structure}>
                      {structure === 'SINGLE_UNIT' ? 'Single Unit' : 'Multi Unit'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Rent (USD) *</label>
                <input 
                  type="number"
                  className="w-full p-2 rounded border" 
                  placeholder="Base Rent"
                  value={formData.baseRent}
                  onChange={(e) => handleInputChange('baseRent', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Meter Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Electricity Meter No</label>
                <input 
                  className="w-full p-2 rounded border" 
                  placeholder="Electricity Meter Number"
                  value={formData.electricityMeterNo}
                  onChange={(e) => handleInputChange('electricityMeterNo', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Water Meter No</label>
                <input 
                  className="w-full p-2 rounded border" 
                  placeholder="Water Meter Number"
                  value={formData.waterMeterNo}
                  onChange={(e) => handleInputChange('waterMeterNo', e.target.value)}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-medium mb-3">Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {FEATURES.map(feature => (
                  <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="rounded"
                    />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h3 className="font-medium mb-3">Property Images</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Upload Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="w-full p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploading && (
                    <div className="mt-2 flex items-center gap-2 text-blue-600 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading images...</span>
                    </div>
                  )}
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={getImageUrl(image)} 
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded border border-gray-300 dark:border-gray-600"
                          onLoad={(e) => {
                            console.log('✅ Image loaded successfully:', image);
                            e.target.style.opacity = '1';
                          }}
                          onError={(e) => {
                            console.error('❌ Image failed to load');
                            console.error('Original path:', image);
                            console.error('Attempted URL:', getImageUrl(image));
                            console.error('API Base URL:', getApiBaseUrl());
                            console.error('VITE_API_URL:', import.meta.env.VITE_API_URL);
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="128" viewBox="0 0 200 128"%3E%3Crect fill="%23f0f0f0" width="200" height="128"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%23999"%3EImage not found%3C/text%3E%3C/svg%3E';
                            e.target.style.opacity = '1';
                          }}
                          style={{ opacity: 0, transition: 'opacity 0.3s' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {formData.images.length === 0 && !uploading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    No images uploaded. You can upload up to 5 images (max 5MB each).
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn">
                {editingProperty ? 'Update Property' : 'Create Property'}
              </button>
              <button type="button" onClick={resetForm} className="btn bg-gray-500 hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Property Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search properties by name, address, or type..."
            value={propertySearchTerm}
            onChange={(e) => setPropertySearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          {propertySearchTerm && (
            <button
              onClick={() => setPropertySearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Properties List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties
          .filter(property => {
            if (!propertySearchTerm) return true;
            const searchLower = propertySearchTerm.toLowerCase();
            return (
              property.title?.toLowerCase().includes(searchLower) ||
              property.address?.toLowerCase().includes(searchLower) ||
              property.type?.toLowerCase().includes(searchLower) ||
              property.city?.toLowerCase().includes(searchLower) ||
              property.state?.toLowerCase().includes(searchLower) ||
              property.country?.toLowerCase().includes(searchLower)
            );
          })
          .map((p) => (
          <div key={p._id} className="card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/properties/${p._id}`)}>
            <div className="flex">
              {/* Left side - Property Info */}
              <div className="flex-1 p-4">
                <div className="font-semibold text-lg mb-2">{p.title}</div>
                <div className="text-sm text-gray-500 mb-2">{p.address}</div>
                <div className="text-sm mb-1">
                  <span className="font-medium">Type:</span> {p.type}
                </div>
                <div className="text-sm mb-1">
                  <span className="font-medium">Units:</span> {p.units?.length || 0}
                </div>
                {p.baseRent && (
                  <div className="text-sm mb-2">
                    <span className="font-medium">Base Rent:</span> ${p.baseRent}
                  </div>
                )}
                
                {/* Unit Status Breakdown */}
                {p.units && p.units.length > 0 && (
                  <div className="text-xs mb-3 space-y-1">
                    {(() => {
                      const unitStats = getPropertyUnitStats(p);
                      return (
                        <>
                          {unitStats.available > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Circle size={12} />
                              <span>{unitStats.available} Available</span>
                            </div>
                          )}
                          {unitStats.occupied > 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <UserCheck size={12} />
                              <span>{unitStats.occupied} Occupied</span>
                            </div>
                          )}
                          {unitStats.maintenance > 0 && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Wrench size={12} />
                              <span>{unitStats.maintenance} Maintenance</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => editProperty(p)}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteProperty(p._id)}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Right side - Property Image */}
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {p.photos && p.photos.length > 0 ? (
                  <img 
                    src={getImageUrl(p.photos[0])}
                    alt={p.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image load error:', e.target.src);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="text-gray-400 text-xs text-center" style={{ display: p.photos && p.photos.length > 0 ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="text-2xl mb-1">🏢</div>
                  <div>No Image</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* No Properties Found */}
        {properties.filter(property => {
          if (!propertySearchTerm) return true;
          const searchLower = propertySearchTerm.toLowerCase();
          return (
            property.title?.toLowerCase().includes(searchLower) ||
            property.address?.toLowerCase().includes(searchLower) ||
            property.type?.toLowerCase().includes(searchLower) ||
            property.city?.toLowerCase().includes(searchLower) ||
            property.state?.toLowerCase().includes(searchLower) ||
            property.country?.toLowerCase().includes(searchLower)
          );
        }).length === 0 && propertySearchTerm && (
          <div className="col-span-full text-center py-12">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No properties found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No properties match your search for "{propertySearchTerm}". Try adjusting your search terms.
            </p>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={confirmDialog.onCancel}
      />
    </div>
  );
}


