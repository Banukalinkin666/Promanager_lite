import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Calendar,
  DollarSign,
  Building,
  User,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import api from '../lib/api.js';

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('due-rent');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    status: '',
    dueDateFrom: '',
    dueDateTo: '',
    amountFrom: '',
    amountTo: '',
    year: '',
    month: '',
    ownerId: '',
    reportType: 'income-expenses',
    sortBy: 'dueDate',
    sortOrder: 'asc',
    page: 1,
    limit: 50
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const currentYear = new Date().getFullYear();
  const [properties, setProperties] = useState([]);
  const [dueRentFilters, setDueRentFilters] = useState({
    propertyIds: [],
    year: currentYear.toString(),
    asOfDate: new Date().toISOString().split('T')[0]
  });
  const [dueRentData, setDueRentData] = useState(null);
  const [dueRentLoading, setDueRentLoading] = useState(false);
  const [expandedDueRentProperties, setExpandedDueRentProperties] = useState({});
  const [uncollectedFilters, setUncollectedFilters] = useState({
    propertyIds: ['ALL'],
    year: currentYear.toString()
  });
  const [uncollectedData, setUncollectedData] = useState(null);
  const [uncollectedLoading, setUncollectedLoading] = useState(false);
  const [expandedUncollectedProperties, setExpandedUncollectedProperties] = useState({});

  // Fetch data based on active report
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/${activeReport}`, { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === 'due-rent' || activeReport === 'uncollected-rent') return;
    fetchReportData();
  }, [activeReport, filters.page]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await api.get('/properties');
        setProperties(response.data || []);
      } catch (error) {
        console.error('Error loading properties:', error);
      }
    };

    loadProperties();
  }, []);

  useEffect(() => {
    if (properties.length > 0 && dueRentFilters.propertyIds.length === 0) {
      setDueRentFilters(prev => ({
        ...prev,
        propertyIds: [properties[0]._id]
      }));
    }
    if (properties.length > 0 && (!uncollectedFilters.propertyIds.length || uncollectedFilters.propertyIds[0] === 'ALL')) {
      setUncollectedFilters(prev => ({
        ...prev,
        propertyIds: ['ALL']
      }));
    }
  }, [properties, dueRentFilters.propertyIds.length, uncollectedFilters.propertyIds.length]);

  const handleSearch = () => {
    fetchReportData();
  };

  const handleResetFilters = () => {
    setFilters({
      propertyId: '',
      unitId: '',
      tenantId: '',
      status: '',
      dueDateFrom: '',
      dueDateTo: '',
      amountFrom: '',
      amountTo: '',
      sortBy: 'dueDate',
      sortOrder: 'asc',
      page: 1,
      limit: 50
    });
  };

  const handleDueRentFilterChange = (key, value) => {
    setDueRentFilters(prev => {
      const updated = { ...prev, [key]: value };

      if (key === 'year' && value) {
        const minDateForYear = `${value}-01-01`;
        const maxDateForYear = `${value}-12-31`;
        const todayStr = new Date().toISOString().split('T')[0];
        let clampedDate = updated.asOfDate;

        if (!clampedDate || clampedDate < minDateForYear || clampedDate > maxDateForYear) {
          clampedDate = todayStr > maxDateForYear ? maxDateForYear : todayStr < minDateForYear ? minDateForYear : todayStr;
        }

        updated.asOfDate = clampedDate;
      }

      return updated;
    });
    setExpandedDueRentProperties({});
    setDueRentData(null);
  };

  const handleUncollectedFilterChange = (key, value) => {
    setUncollectedFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setExpandedUncollectedProperties({});
    setUncollectedData(null);
  };

  const fetchDueRentReport = async () => {
    if (!dueRentFilters.propertyIds.length || !dueRentFilters.year) {
      console.warn('Property and year are required for the due rent report');
      return;
    }

    setDueRentLoading(true);
    try {
      const params = {
        propertyId:
          dueRentFilters.propertyIds.length === 0 || dueRentFilters.propertyIds[0] === 'ALL'
            ? ''
            : dueRentFilters.propertyIds.join(','),
        year: dueRentFilters.year,
        asOfDate: dueRentFilters.asOfDate
      };

      const response = await api.get('/reports/due-rent', { params });
      if (response.data?.success) {
        setDueRentData(response.data.data);
        setExpandedDueRentProperties({});
        const reportContainer = document.getElementById('due-rent-report-container');
        if (reportContainer) {
          reportContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        setDueRentData(null);
      }
    } catch (error) {
      console.error('Error fetching due rent report:', error);
      setDueRentData(null);
    } finally {
      setDueRentLoading(false);
    }
  };

  const toggleDueRentProperty = (propertyId) => {
    setExpandedDueRentProperties(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };

  const formatDueRentAmount = (value = 0) => {
    const amount = Number(value) || 0;
    return amount.toFixed(3);
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yearOptions = Array.from({ length: 7 }, (_, index) => (currentYear - 3 + index).toString());
  const asOfMinDate = `${dueRentFilters.year}-01-01`;
  const asOfMaxDate = `${dueRentFilters.year}-12-31`;
  const dueRentMonthLabels = dueRentData?.monthLabels || monthLabels;
  const dueRentProperties = dueRentData?.properties || [];
  const dueRentTotals = dueRentData?.totals || { months: Array(12).fill(0), ytd: 0 };

  const fetchUncollectedReport = async () => {
    if (!uncollectedFilters.year) {
      console.warn('Year is required for the uncollected rent report');
      return;
    }

    setUncollectedLoading(true);
    try {
      const params = {
        propertyId:
          !uncollectedFilters.propertyIds.length || uncollectedFilters.propertyIds[0] === 'ALL'
            ? ''
            : uncollectedFilters.propertyIds.join(','),
        year: uncollectedFilters.year
      };

      const response = await api.get('/reports/uncollected-rent', { params });
      if (response.data?.success) {
        setUncollectedData(response.data.data);
        setExpandedUncollectedProperties({});
        const container = document.getElementById('uncollected-rent-report-container');
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        setUncollectedData(null);
      }
    } catch (error) {
      console.error('Error fetching uncollected rent report:', error);
      setUncollectedData(null);
    } finally {
      setUncollectedLoading(false);
    }
  };

  const toggleUncollectedProperty = (propertyId) => {
    setExpandedUncollectedProperties(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };

  const formatUncollectedAmount = (value = 0) => {
    const amount = Number(value) || 0;
    return amount.toFixed(3);
  };

  const uncollectedMonthLabels = uncollectedData?.monthLabels || monthLabels;
  const uncollectedProperties = uncollectedData?.properties || [];
  const uncollectedTotals = uncollectedData?.totals || { months: Array(12).fill(0), ytd: 0 };

  const handleExport = async (format) => {
    if (activeReport === 'due-rent' && (!dueRentFilters.propertyIds.length || !dueRentFilters.year)) {
      console.warn('Property and year are required to export the due rent report');
      return;
    }

    if (activeReport === 'uncollected-rent' && !uncollectedFilters.year) {
      console.warn('Year is required to export the uncollected rent report');
      return;
    }

    setExporting(true);
    try {
      const endpoint =
        activeReport === 'due-rent'
          ? `/reports/due-rent/export/${format}`
          : activeReport === 'uncollected-rent'
            ? `/reports/uncollected-rent/export/${format}`
            : `/reports/${activeReport}/export/${format}`;

      const params =
        activeReport === 'due-rent'
          ? {
              propertyId:
                dueRentFilters.propertyIds.length === 0 || dueRentFilters.propertyIds[0] === 'ALL'
                  ? ''
                  : dueRentFilters.propertyIds.join(','),
              year: dueRentFilters.year,
              asOfDate: dueRentFilters.asOfDate
            }
          : activeReport === 'uncollected-rent'
            ? {
                propertyId:
                  !uncollectedFilters.propertyIds.length || uncollectedFilters.propertyIds[0] === 'ALL'
                    ? ''
                    : uncollectedFilters.propertyIds.join(','),
                year: uncollectedFilters.year
              }
            : filters;

      const response = await api.get(endpoint, {
        params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeReport}-report-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300', label: 'Pending' },
      'OVERDUE': { color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300', label: 'Overdue' },
      'PAID': { color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300', label: 'Paid' },
      'FAILED': { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300', label: 'Failed' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Generate and export professional reports</p>
            </div>
            {activeReport !== 'due-rent' && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Loading...' : 'Search'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeReport === 'due-rent' && (
        <div id="due-rent-filters" className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[220px] max-w-[480px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property *
                </label>
                <select
                  value={dueRentFilters.propertyIds[0] || 'ALL'}
                  onChange={(e) => {
                    if (e.target.value === 'ALL') {
                      handleDueRentFilterChange('propertyIds', ['ALL']);
                    } else {
                      handleDueRentFilterChange('propertyIds', [e.target.value]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Properties</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-40 min-w-[160px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year *
                </label>
                <select
                  value={dueRentFilters.year}
                  onChange={(e) => handleDueRentFilterChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map(yearOption => (
                    <option key={yearOption} value={yearOption}>{yearOption}</option>
                  ))}
                </select>
              </div>

              <div className="w-48 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  As of Date
                </label>
                <input
                  type="date"
                  value={dueRentFilters.asOfDate}
                  min={asOfMinDate}
                  max={asOfMaxDate}
                  onChange={(e) => handleDueRentFilterChange('asOfDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={fetchDueRentReport}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {dueRentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'uncollected-rent' && (
        <div id="uncollected-rent-filters" className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[220px] max-w-[480px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property *
                </label>
                <select
                  value={uncollectedFilters.propertyIds[0] || 'ALL'}
                  onChange={(e) => {
                    if (e.target.value === 'ALL') {
                      handleUncollectedFilterChange('propertyIds', ['ALL']);
                    } else {
                      handleUncollectedFilterChange('propertyIds', [e.target.value]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Properties</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-40 min-w-[160px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year *
                </label>
                <select
                  value={uncollectedFilters.year}
                  onChange={(e) => handleUncollectedFilterChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map(yearOption => (
                    <option key={yearOption} value={yearOption}>{yearOption}</option>
                  ))}
                </select>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={fetchUncollectedReport}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {uncollectedLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Report Types</h3>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveReport('due-rent')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                  activeReport === 'due-rent'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 mr-3" />
                Due Rent Report
              </button>
              <button
                onClick={() => setActiveReport('uncollected-rent')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                  activeReport === 'uncollected-rent'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 mr-3" />
                Uncollected Rent Report
              </button>
              <button
                onClick={() => setActiveReport('property-management')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                  activeReport === 'property-management'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 mr-3" />
                Property Management Report
              </button>
              {/* Add more report types here */}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Property Management Report Tabs */}
          {activeReport === 'property-management' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Property Management Report</h3>
              </div>
              <div className="p-4">
                <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleFilterChange('reportType', 'income-expenses')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      filters.reportType === 'income-expenses'
                        ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Income & Expenses Report
                  </button>
                  <button
                    onClick={() => handleFilterChange('reportType', 'occupancy-by-property')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      filters.reportType === 'occupancy-by-property'
                        ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Occupancy Report By Property
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters Panel */}
          {activeReport !== 'due-rent' && showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Property Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Property *
                    </label>
                    <input
                      type="text"
                      value={filters.propertyId}
                      onChange={(e) => handleFilterChange('propertyId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Select Property"
                    />
                  </div>


                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year *
                    </label>
                    <select
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose Year</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>

                  {/* Month Filter (for uncollected rent report) */}
                  {activeReport === 'uncollected-rent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Month
                      </label>
                      <select
                        value={filters.month}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Months</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                  )}

                  {/* Unit Filter (for due rent report) */}
                  {activeReport === 'due-rent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={filters.unitId}
                        onChange={(e) => handleFilterChange('unitId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Unit ID"
                      />
                    </div>
                  )}

                  {/* Tenant Filter (for due rent report) */}
                  {activeReport === 'due-rent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tenant
                      </label>
                      <input
                        type="text"
                        value={filters.tenantId}
                        onChange={(e) => handleFilterChange('tenantId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tenant ID"
                      />
                    </div>
                  )}

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="PAID">Paid</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>

                  {/* Due Date From (for due rent report) */}
                  {activeReport === 'due-rent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Due Date From
                      </label>
                      <input
                        type="date"
                        value={filters.dueDateFrom}
                        onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Due Date To (for due rent report) */}
                  {activeReport === 'due-rent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Due Date To
                      </label>
                      <input
                        type="date"
                        value={filters.dueDateTo}
                        onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Amount From (for due rent report) */}
                  {activeReport === 'due-rent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount From
                      </label>
                      <input
                        type="number"
                        value={filters.amountFrom}
                        onChange={(e) => handleFilterChange('amountFrom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Amount To (for due rent report) */}
                  {activeReport === 'due-rent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount To
                      </label>
                      <input
                        type="number"
                        value={filters.amountTo}
                        onChange={(e) => handleFilterChange('amountTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sort By
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="dueDate">Due Date</option>
                      <option value="amount">Amount</option>
                      <option value="tenant">Tenant</option>
                      <option value="property">Property</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sort Order
                    </label>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {activeReport !== 'due-rent' && activeReport !== 'uncollected-rent' && data?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(data.summary.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Records</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {data.summary.totalCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Amount</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(data.summary.averageAmount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Building className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Properties</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {data.breakdown?.property?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Buttons */}
          {activeReport !== 'due-rent' && activeReport !== 'uncollected-rent' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Options</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleExport('excel')}
                      disabled={exporting}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      disabled={exporting}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {exporting ? 'Exporting...' : 'Export PDF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {activeReport === 'due-rent' 
                  ? 'Due Rent Report' 
                  : activeReport === 'uncollected-rent' 
                    ? 'Uncollected Rent Report'
                    : activeReport === 'property-management'
                      ? `Property Management Report - ${filters.reportType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
                      : 'Report'
                }
              </h3>
            </div>
            <div className="overflow-x-auto">
              {activeReport === 'due-rent' ? (
                dueRentLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-300">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating due rent report...
                  </div>
                ) : dueRentProperties.length ? (
                  <div className="min-w-full">
                    <div className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      Reporting year {dueRentData?.year} • As of {dueRentData?.asOfDate}
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                            No
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Property
                          </th>
                          {dueRentMonthLabels.map((monthLabel) => (
                            <th
                              key={`due-rent-header-${monthLabel}`}
                              className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {monthLabel}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            YTD
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {dueRentProperties.map((property, index) => {
                          const propertyIdStr = property.propertyId?.toString
                            ? property.propertyId.toString()
                            : property.propertyId || property.propertyName;
                          const isExpanded = !!expandedDueRentProperties[propertyIdStr];
                          const hasUnits = property.units && property.units.length > 0;

                          return (
                            <React.Fragment key={propertyIdStr}>
                              <tr className="bg-gray-50 dark:bg-gray-700">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{index + 1}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                  <button
                                    type="button"
                                    className={`flex items-center gap-2 focus:outline-none ${hasUnits ? 'text-blue-600 dark:text-blue-300 hover:underline' : ''}`}
                                    onClick={() => hasUnits && toggleDueRentProperty(propertyIdStr)}
                                  >
                                    {hasUnits ? (
                                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                    ) : (
                                      <span className="w-4 h-4" />
                                    )}
                                    <span className="font-semibold">{property.propertyName}</span>
                                  </button>
                                </td>
                                {dueRentMonthLabels.map((_, monthIndex) => (
                                  <td
                                    key={`${propertyIdStr}-summary-${monthIndex}`}
                                    className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    {formatDueRentAmount(property.summary?.months?.[monthIndex] || 0)}
                                  </td>
                                ))}
                                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatDueRentAmount(property.summary?.ytd || 0)}
                                </td>
                              </tr>

                              {isExpanded && property.units?.map((unit, unitIndex) => (
                                <tr key={`${propertyIdStr}-unit-${unit.unitId || unitIndex}`} className="bg-white dark:bg-gray-900">
                                  <td className="px-6 py-3" />
                                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">
                                    <div className="font-medium">Unit: {unit.unitName}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Tenant: {unit.tenantName || '-'}</div>
                                  </td>
                                  {dueRentMonthLabels.map((_, monthIndex) => (
                                    <td
                                      key={`${propertyIdStr}-unit-${unit.unitId || unitIndex}-${monthIndex}`}
                                      className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300"
                                    >
                                      {formatDueRentAmount(unit.summary?.months?.[monthIndex] || 0)}
                                    </td>
                                  ))}
                                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                    {formatDueRentAmount(unit.summary?.ytd || 0)}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-100 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white" colSpan={2}>
                            Total Due Rent
                          </th>
                          {dueRentMonthLabels.map((_, monthIndex) => (
                            <th
                              key={`due-rent-total-${monthIndex}`}
                              className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              {formatDueRentAmount(dueRentTotals.months?.[monthIndex] || 0)}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDueRentAmount(dueRentTotals.ytd || 0)}
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {dueRentFilters.propertyIds.length
                      ? 'No due rent found for the selected criteria.'
                      : 'Select a property and year, then generate the report.'}
                  </div>
                )
              ) : activeReport === 'uncollected-rent' ? (
                uncollectedLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-300">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating uncollected rent report...
                  </div>
                ) : uncollectedProperties.length ? (
                  <div className="min-w-full">
                    <div className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      Reporting year {uncollectedData?.year}
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                            No
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Property
                          </th>
                          {uncollectedMonthLabels.map((monthLabel) => (
                            <th
                              key={`uncollected-header-${monthLabel}`}
                              className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {monthLabel}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            YTD
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {uncollectedProperties.map((property, index) => {
                          const propertyIdStr = property.propertyId?.toString?.() || property.propertyId || property.propertyName;
                          const isExpanded = !!expandedUncollectedProperties[propertyIdStr];
                          const hasUnits = property.units && property.units.length > 0;
                          const difference = property.occupancyDifference || { months: Array(12).fill(0), ytd: 0 };

                          return (
                            <React.Fragment key={`uncollected-property-${propertyIdStr}`}> 
                              <tr className="bg-gray-50 dark:bg-gray-700">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{index + 1}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                  <button
                                    type="button"
                                    className={`flex items-center gap-2 focus:outline-none ${hasUnits ? 'text-blue-600 dark:text-blue-300 hover:underline' : ''}`}
                                    onClick={() => hasUnits && toggleUncollectedProperty(propertyIdStr)}
                                  >
                                    {hasUnits ? (
                                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                    ) : (
                                      <span className="w-4 h-4" />
                                    )}
                                    <span className="font-semibold">{property.propertyName}</span>
                                  </button>
                                </td>
                                {uncollectedMonthLabels.map((_, monthIndex) => (
                                  <td
                                    key={`${propertyIdStr}-summary-${monthIndex}`}
                                    className="px-4 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white"
                                  >
                                    {formatUncollectedAmount(property.summary?.months?.[monthIndex] || 0)}
                                  </td>
                                ))}
                                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatUncollectedAmount(property.summary?.ytd || 0)}
                                </td>
                              </tr>

                              {difference && (difference.ytd !== 0 || difference.months?.some((value) => Math.abs(value) > 0)) && (
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                  <td className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300" colSpan={2}>
                                    Occupancy Difference
                                  </td>
                                  {uncollectedMonthLabels.map((_, monthIndex) => (
                                    <td
                                      key={`${propertyIdStr}-difference-${monthIndex}`}
                                      className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300"
                                    >
                                      {formatUncollectedAmount(difference.months?.[monthIndex] || 0)}
                                    </td>
                                  ))}
                                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                    {formatUncollectedAmount(difference.ytd || 0)}
                                  </td>
                                </tr>
                              )}

                              {isExpanded && property.units?.map((unit, unitIndex) => (
                                <tr key={`${propertyIdStr}-unit-${unit.unitId || unitIndex}`} className="bg-white dark:bg-gray-900">
                                  <td className="px-6 py-3" />
                                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">
                                    <div className="font-medium">Unit: {unit.unitName}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Tenant: {unit.tenantName || '-'}</div>
                                  </td>
                                  {uncollectedMonthLabels.map((_, monthIndex) => (
                                    <td
                                      key={`${propertyIdStr}-unit-${unit.unitId || unitIndex}-${monthIndex}`}
                                      className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300"
                                    >
                                      {formatUncollectedAmount(unit.summary?.months?.[monthIndex] || 0)}
                                    </td>
                                  ))}
                                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                    {formatUncollectedAmount(unit.summary?.ytd || 0)}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-100 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white" colSpan={2}>
                            Total Uncollected Rent
                          </th>
                          {uncollectedMonthLabels.map((_, monthIndex) => (
                            <th
                              key={`uncollected-total-${monthIndex}`}
                              className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              {formatUncollectedAmount(uncollectedTotals.months?.[monthIndex] || 0)}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                            {formatUncollectedAmount(uncollectedTotals.ytd || 0)}
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {uncollectedFilters.propertyIds.length
                      ? 'No uncollected rent found for the selected criteria.'
                      : 'Select a property and year, then generate the report.'}
                  </div>
                )
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      {activeReport === 'uncollected-rent' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Days Overdue
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data?.payments?.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payment.tenant.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {payment.tenant.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {payment.property}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {payment.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(payment.dueDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {payment.description}
                        </td>
                        {activeReport === 'uncollected-rent' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {payment.daysOverdue > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">
                                {payment.daysOverdue} days
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {activeReport !== 'due-rent' && data?.pagination && (
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((data.pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                    {Math.min(data.pagination.currentPage * filters.limit, data.pagination.totalCount)} of{' '}
                    {data.pagination.totalCount} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      disabled={!data.pagination.hasPrev}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      disabled={!data.pagination.hasNext}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;