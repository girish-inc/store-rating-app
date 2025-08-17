import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Owner dashboard - this was the most complex component to build
const OwnerDashboard = () => {
  const { apiCall } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [ratings, setRatings] = useState([]); // all ratings for owner's stores
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // error messages
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [editingRating, setEditingRating] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filters, setFilters] = useState({
    rating: '',
    customerName: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'ratings') {
      fetchRatings();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ratings') {
      fetchRatings();
    }
  }, [sortConfig, pagination.page, pagination.limit]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/owner/dashboard');
      setDashboardData(data); // main dashboard stats and info
      // console.log('Dashboard data loaded:', data); // debug line I kept
    } catch (error) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', error); // helpful for debugging
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };
      
      // Add filter parameters if they exist
      if (filters.rating) params.rating = filters.rating;
      if (filters.customerName) params.customerName = filters.customerName;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      const data = await apiCall('/owner/ratings', { params });
      setRatings(data.ratings || []); // update ratings list
      
      // Only update pagination if total has actually changed - this fixed the rerender issue!
      const newTotal = data.total || 0;
      const newTotalPages = Math.ceil(newTotal / pagination.limit);
      setPagination(prev => {
        if (prev.total !== newTotal || prev.totalPages !== newTotalPages) {
          return {
            ...prev,
            total: newTotal,
            totalPages: newTotalPages
          };
        }
        return prev;
      });
      // console.log('Fetched ratings:', data.ratings.length); // debug trace
    } catch (error) {
      setError('Failed to fetch ratings');
      console.error('Ratings fetch error:', error); // keeping this for troubleshooting
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await apiCall('/owner/analytics');
      setAnalytics(data);
    } catch (error) {
      setError('Failed to fetch analytics');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDeleteRating = async (ratingId) => {
    try {
      await apiCall(`/owner/ratings/${ratingId}`, {
        method: 'DELETE'
      });
      setRatings(ratings.filter(rating => rating.id !== ratingId));
      setDeleteConfirm(null);
      // Refresh dashboard data to update statistics
      fetchDashboardData();
    } catch (error) {
      setError('Failed to delete rating');
    }
  };

  const handleUpdateRating = async (ratingId, newRating) => {
    try {
      const updatedRating = await apiCall(`/owner/ratings/${ratingId}`, {
        method: 'PUT',
        body: { rating: newRating }
      });
      setRatings(ratings.map(rating => 
        rating.id === ratingId ? { ...rating, rating: newRating } : rating
      ));
      setEditingRating(null);
      // Refresh dashboard data to update statistics
      fetchDashboardData();
    } catch (error) {
      setError('Failed to update rating');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchRatings();
  };

  const clearFilters = () => {
    setFilters({
      rating: '',
      customerName: '',
      dateFrom: '',
      dateTo: ''
    });
    fetchRatings();
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 fill-current'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderOverview = () => {
    if (!dashboardData) return null;

    return (
      <div className="space-y-8">
        {/* Enhanced Store Info */}
        <div className="bg-theme-white p-6 rounded-lg shadow-md border border-theme-gray-100">
          <div className="flex items-center mb-6">
            <svg className="w-6 h-6 mr-3 text-theme-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold text-theme-gray-800">Store Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-theme-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-theme-gray-600 mb-1">Store Name</p>
              <p className="text-lg font-semibold text-theme-gray-800">{dashboardData.store?.name || 'Store Name Not Available'}</p>
            </div>
            <div className="bg-theme-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-theme-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold text-theme-gray-800">{dashboardData.store?.email || 'Email Not Available'}</p>
            </div>
            <div className="md:col-span-2 bg-theme-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-theme-gray-600 mb-1">Address</p>
              <p className="text-lg font-semibold text-theme-gray-800">{dashboardData.store?.address || 'Address Not Available'}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Rating Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-theme-white p-6 rounded-lg shadow-md border border-theme-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-theme-gray-800">Average Rating</h3>
              <div className="bg-theme-blue-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-theme-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-4xl font-bold text-theme-blue-600">
                {dashboardData.store?.average_rating ? dashboardData.store.average_rating.toFixed(1) : 'N/A'}
              </span>
              {dashboardData.store?.average_rating && (
                <div className="flex flex-col">
                  {renderStars(Math.round(dashboardData.store.average_rating))}
                  <span className="text-xs text-theme-gray-500 mt-1">out of 5</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-theme-white p-6 rounded-lg shadow-md border border-theme-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-theme-gray-800">Total Ratings</h3>
              <div className="bg-theme-orange-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-theme-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-theme-orange-600">
              {dashboardData.store?.total_ratings || 0}
            </p>
            <p className="text-sm text-theme-gray-500 mt-2">customer reviews</p>
          </div>
          
          <div className="bg-theme-white p-6 rounded-lg shadow-md border border-theme-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-theme-gray-800">Unique Customers</h3>
              <div className="bg-theme-purple-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-theme-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-theme-purple-600">
              {dashboardData.users_who_rated?.length || 0}
            </p>
            <p className="text-sm text-theme-gray-500 mt-2">individual reviewers</p>
          </div>
        </div>

        {/* Rating Distribution */}
        {dashboardData.statistics?.rating_breakdown && (
          <div className="bg-theme-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-theme-gray-800 mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {(() => {
                // Calculate total ratings for accurate percentage calculation
                const totalRatings = dashboardData.statistics.rating_breakdown.reduce((sum, item) => sum + (item.count || 0), 0);
                
                return [5, 4, 3, 2, 1].map((rating) => {
                  const ratingData = dashboardData.statistics.rating_breakdown.find(r => r.rating === rating);
                  const count = ratingData?.count || 0;
                  // Calculate percentage on frontend for accuracy
                  const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                  
                  return (
                  <div key={rating} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="bg-theme-gray-200 rounded-full h-2">
                        <div 
                          className="bg-theme-purple h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm text-theme-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Recent Ratings */}
        {dashboardData.recentRatings?.length > 0 && (
          <div className="bg-theme-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-theme-gray-800 mb-4">Recent Ratings</h3>
            <div className="space-y-3">
              {dashboardData.recentRatings.slice(0, 5).map((rating) => (
                <div key={rating.id} className="flex items-center justify-between p-3 bg-theme-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-theme-gray-800">{rating.user_name}</p>
                    <p className="text-sm text-theme-gray-600">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderStars(rating.rating)}
                    <span className="font-medium text-theme-gray-800">{rating.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRatings = () => (
    <div className="bg-theme-white rounded-lg shadow-md border border-theme-gray-100">
      <div className="p-6 border-b border-theme-gray-200">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-3 text-theme-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-theme-gray-800">All Ratings</h3>
        </div>
        
        {/* Filter Controls */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-gray-700 mb-1">Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="w-full px-3 py-2 border border-theme-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-blue-500 focus:border-transparent"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-theme-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={filters.customerName}
              onChange={(e) => handleFilterChange('customerName', e.target.value)}
              placeholder="Search by customer name"
              className="w-full px-3 py-2 border border-theme-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-theme-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-theme-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-theme-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-theme-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button
            onClick={applyFilters}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-theme-blue-600 hover:bg-theme-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-blue-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Apply Filters
          </button>
          
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 border border-theme-gray-300 rounded-md shadow-sm text-sm font-medium text-theme-gray-700 bg-white hover:bg-theme-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-blue-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-theme-gray-200">
          <thead className="bg-gradient-to-r from-theme-gray-50 to-theme-gray-100">
            <tr>
              <th
                onClick={() => handleSort('user_name')}
                className="px-6 py-4 text-left text-xs font-semibold text-theme-gray-700 uppercase tracking-wider cursor-pointer hover:bg-theme-gray-200 transition-colors duration-200 select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Customer</span>
                  {sortConfig.key === 'user_name' && (
                    <span className="text-theme-purple-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('rating')}
                className="px-6 py-4 text-left text-xs font-semibold text-theme-gray-700 uppercase tracking-wider cursor-pointer hover:bg-theme-gray-200 transition-colors duration-200 select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Rating</span>
                  {sortConfig.key === 'rating' && (
                    <span className="text-theme-purple-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="px-6 py-4 text-left text-xs font-semibold text-theme-gray-700 uppercase tracking-wider cursor-pointer hover:bg-theme-gray-200 transition-colors duration-200 select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortConfig.key === 'created_at' && (
                    <span className="text-theme-purple-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-theme-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-theme-white divide-y divide-theme-gray-200">
            {ratings.map((rating, index) => (
              <tr key={rating.id} className={`hover:bg-theme-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-theme-white' : 'bg-theme-gray-25'}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-theme-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-theme-blue-600">
                        {rating.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-theme-gray-800">{rating.user_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {renderStars(rating.rating)}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-purple-100 text-theme-purple-800">
                      {rating.rating}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-theme-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-theme-gray-600">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingRating(rating)}
                      className="inline-flex items-center px-3 py-1 border border-theme-blue-300 rounded-md text-xs font-medium text-theme-blue-700 bg-theme-blue-50 hover:bg-theme-blue-100 transition-colors duration-200"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(rating)}
                      className="inline-flex items-center px-3 py-1 border border-theme-red-300 rounded-md text-xs font-medium text-theme-red-700 bg-theme-red-50 hover:bg-theme-red-100 transition-colors duration-200"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Enhanced Pagination */}
      <div className="px-6 py-4 border-t border-theme-gray-200 bg-theme-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-theme-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Showing page <span className="font-medium text-theme-gray-800">{pagination.page}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="inline-flex items-center px-4 py-2 border border-theme-gray-300 rounded-lg text-sm font-medium text-theme-gray-700 bg-theme-white hover:bg-theme-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={ratings.length < pagination.limit}
              className="inline-flex items-center px-4 py-2 border border-theme-gray-300 rounded-lg text-sm font-medium text-theme-gray-700 bg-theme-white hover:bg-theme-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Rating Modal */}
      {editingRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-theme-gray-900">Edit Rating</h3>
              <button
                onClick={() => setEditingRating(null)}
                className="text-theme-gray-400 hover:text-theme-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-theme-gray-600 mb-2">
                Customer: <span className="font-medium">{editingRating.customer_name}</span>
              </p>
              <p className="text-sm text-theme-gray-600 mb-4">
                Store: <span className="font-medium">{editingRating.store_name}</span>
              </p>
              
              <label className="block text-sm font-medium text-theme-gray-700 mb-2">
                Rating
              </label>
              <select
                value={editingRating.rating}
                onChange={(e) => setEditingRating({...editingRating, rating: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-theme-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-blue-500 focus:border-transparent"
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingRating(null)}
                className="px-4 py-2 border border-theme-gray-300 rounded-md text-sm font-medium text-theme-gray-700 bg-white hover:bg-theme-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-blue-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRating(editingRating.id, editingRating.rating)}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-theme-blue-600 hover:bg-theme-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-blue-500 transition-colors duration-200"
              >
                Update Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-theme-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-theme-gray-900">Delete Rating</h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-theme-gray-600">
                Are you sure you want to delete this rating from <span className="font-medium">{deleteConfirm.customer_name}</span> for <span className="font-medium">{deleteConfirm.store_name}</span>?
              </p>
              <p className="text-sm text-theme-red-600 mt-2">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-theme-gray-300 rounded-md text-sm font-medium text-theme-gray-700 bg-white hover:bg-theme-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-blue-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRating(deleteConfirm.id)}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-theme-red-600 hover:bg-theme-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-red-500 transition-colors duration-200"
              >
                Delete Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    if (!analytics) {
      return (
        <div className="bg-theme-white rounded-lg shadow-md border border-theme-gray-100 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-purple-600 mr-3"></div>
            <span className="text-theme-gray-600">Loading analytics...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-theme-white rounded-lg shadow-md border border-theme-gray-100">
          <div className="p-6 border-b border-theme-gray-200">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3 text-theme-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-semibold text-theme-gray-800">Rating Trends</h3>
            </div>
          </div>
          
          <div className="p-6">
            {analytics.trends && (analytics.trends?.current_period || analytics.trends?.previous_period) ? (
              <div className="grid gap-4">
                {/* Current Period */}
                {analytics.trends?.current_period && (
                  <div className="bg-gradient-to-r from-theme-blue-50 to-theme-blue-100 p-4 rounded-lg border border-theme-blue-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-theme-blue-100 p-3 rounded-lg">
                          <svg className="w-6 h-6 text-theme-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-theme-gray-800">Current Period ({analytics.period_days || 'N/A'} days)</p>
                          <p className="text-sm text-theme-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {analytics.trends.current_period?.total_ratings || 0} ratings received
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-3">
                          <div className="bg-theme-white p-3 rounded-lg shadow-sm">
                            <p className="text-2xl font-bold text-theme-blue-600">
                              {analytics.trends.current_period?.average_rating ? analytics.trends.current_period.average_rating.toFixed(1) : 'N/A'}
                            </p>
                            <p className="text-xs text-theme-gray-500 text-center">avg rating</p>
                          </div>
                          {analytics.trends.current_period?.average_rating && (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center">
                                {renderStars(Math.round(analytics.trends.current_period.average_rating))}
                              </div>
                              <span className="text-xs text-theme-gray-500 mt-1">out of 5</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Previous Period */}
                {analytics.trends.previous_period && analytics.trends.previous_period.total_ratings > 0 && (
                  <div className="bg-gradient-to-r from-theme-gray-50 to-theme-gray-100 p-4 rounded-lg border border-theme-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-theme-gray-100 p-3 rounded-lg">
                          <svg className="w-6 h-6 text-theme-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-theme-gray-800">Previous Period ({analytics.period_days} days ago)</p>
                          <p className="text-sm text-theme-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {analytics.trends.previous_period?.total_ratings || 0} ratings received
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-3">
                          <div className="bg-theme-white p-3 rounded-lg shadow-sm">
                            <p className="text-2xl font-bold text-theme-gray-600">
                              {analytics.trends.previous_period?.average_rating ? analytics.trends.previous_period.average_rating.toFixed(1) : 'N/A'}
                            </p>
                            <p className="text-xs text-theme-gray-500 text-center">avg rating</p>
                          </div>
                          {analytics.trends.previous_period?.average_rating && (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center">
                                {renderStars(Math.round(analytics.trends.previous_period.average_rating))}
                              </div>
                              <span className="text-xs text-theme-gray-500 mt-1">out of 5</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Changes Summary */}
                {analytics.trends.changes && (
                  <div className="bg-gradient-to-r from-theme-orange-50 to-theme-orange-100 p-4 rounded-lg border border-theme-orange-200">
                    <h4 className="text-lg font-semibold text-theme-gray-800 mb-3">Period Comparison</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-theme-gray-600">Rating Count Change</p>
                        <p className="text-xl font-bold text-theme-orange-600">
                          {analytics.trends.changes.rating_count_change > 0 ? '+' : ''}{analytics.trends.changes.rating_count_change}
                        </p>
                        <p className="text-xs text-theme-gray-500">
                          {analytics.trends.changes.rating_count_percentage !== 'N/A' ? `${analytics.trends.changes.rating_count_percentage}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-theme-gray-600">Average Rating Change</p>
                        <p className="text-xl font-bold text-theme-orange-600">
                          {analytics.trends.changes.average_rating_change > 0 ? '+' : ''}{analytics.trends.changes.average_rating_change}
                        </p>
                        <p className="text-xs text-theme-gray-500">
                          {analytics.trends.changes.average_rating_percentage !== 'N/A' ? `${analytics.trends.changes.average_rating_percentage}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-theme-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-theme-gray-500 text-lg">No analytics data available</p>
                <p className="text-theme-gray-400 text-sm mt-1">Analytics will appear here once you receive more ratings</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Ratings Over Time */}
        {analytics.ratings_over_time && analytics.ratings_over_time.length > 0 && (
          <div className="bg-theme-white rounded-lg shadow-md border border-theme-gray-100">
            <div className="p-6 border-b border-theme-gray-200">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-theme-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <h3 className="text-xl font-semibold text-theme-gray-800">Ratings Over Time</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {analytics.ratings_over_time.map((dayData, index) => {
                  const date = new Date(dayData.date);
                  const formattedDate = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  });
                  
                  return (
                    <div key={index} className="bg-gradient-to-r from-theme-purple-50 to-theme-purple-100 p-4 rounded-lg border border-theme-purple-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-theme-purple-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-theme-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-theme-gray-800">{formattedDate}</p>
                            <p className="text-sm text-theme-gray-600 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              {dayData.count} ratings received
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-3">
                            <div className="bg-theme-white p-3 rounded-lg shadow-sm">
                              <p className="text-2xl font-bold text-theme-purple-600">
                                {dayData.avg_rating ? parseFloat(dayData.avg_rating).toFixed(1) : 'N/A'}
                              </p>
                              <p className="text-xs text-theme-gray-500 text-center">avg rating</p>
                            </div>
                            {dayData.avg_rating && (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center">
                                  {renderStars(Math.round(parseFloat(dayData.avg_rating)))}
                                </div>
                                <span className="text-xs text-theme-gray-500 mt-1">out of 5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-theme-gray-800 mb-2">Store Owner Dashboard</h1>
        <p className="text-theme-gray-600">Manage your store and track customer feedback</p>
      </div>
      
      {error && (
        <div className="bg-theme-orange-50 border border-theme-orange-200 text-theme-orange-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError('')}
            className="float-right text-theme-orange-500 hover:text-theme-orange-700 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Enhanced Tabs */}
      <div className="bg-theme-white rounded-lg shadow-md mb-6">
        <nav className="flex space-x-1 p-1">
          {[
            { key: 'overview', label: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v-2m0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2M7 13h10M7 17h4' },
            { key: 'ratings', label: 'Ratings', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
            { key: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-theme-purple text-theme-white shadow-md'
                  : 'text-theme-gray-800 hover:text-theme-gray-800 hover:bg-theme-gray-100'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'ratings' && renderRatings()}
      {activeTab === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default OwnerDashboard;