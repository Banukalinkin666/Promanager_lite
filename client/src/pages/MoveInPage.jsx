import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Building, User } from 'lucide-react';
import EnhancedMoveInModal from '../components/EnhancedMoveInModal.jsx';
import api from '../lib/api.js';

export default function MoveInPage() {
  const { propertyId, unitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoveInModal, setShowMoveInModal] = useState(true);

  // Get unit and property data from location state or fetch from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // If data is passed via location state, use it
        if (location.state?.property && location.state?.unit) {
          setProperty(location.state.property);
          setUnit(location.state.unit);
        } else {
          // Otherwise fetch from API
          if (propertyId) {
            const propertyRes = await api.get(`/properties/${propertyId}`);
            setProperty(propertyRes.data);
            
            if (unitId) {
              const unitData = propertyRes.data.units?.find(u => u._id === unitId);
              if (unitData) {
                setUnit(unitData);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading move-in data:', error);
        // Redirect back to properties if there's an error
        navigate('/properties');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [propertyId, unitId, location.state, navigate]);

  const handleMoveInSuccess = () => {
    // Navigate back to the property page after successful move-in
    if (propertyId) {
      navigate(`/properties/${propertyId}`);
    } else {
      navigate('/properties');
    }
  };

  const handleClose = () => {
    // Navigate back to the property page
    if (propertyId) {
      navigate(`/properties/${propertyId}`);
    } else {
      navigate('/properties');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property || !unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Unit or Property Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The requested unit or property could not be found.
          </p>
          <button
            onClick={() => navigate('/properties')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleClose}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Building size={18} />
                  <span className="font-medium">{property.title}</span>
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Home size={18} />
                  <span className="font-medium">{unit.name}</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Move-In Process
            </div>
          </div>
        </div>
      </div>

      {/* Move-In Modal as Full Page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <EnhancedMoveInModal
            isOpen={showMoveInModal}
            onClose={handleClose}
            unit={unit}
            property={property}
            onSuccess={handleMoveInSuccess}
            isFullPage={true}
          />
        </div>
      </div>
    </div>
  );
}
