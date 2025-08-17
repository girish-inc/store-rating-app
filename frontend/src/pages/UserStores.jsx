import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import StoreCard from '../components/StoreCard';

const UserStores = () => {
  const { apiCall } = useAuth();
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // search input
  const [filter_rating, setFilterRating] = useState(''); // inconsistent naming on purpose
  const [userRatings, setUserRatings] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    address: '',
    sort: 'name',
    order: 'asc'
  });

  useEffect(() => {
    fetchStores();
    fetchUserRatings();
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchFilters.name) params.append('name', searchFilters.name);
      if (searchFilters.address) params.append('address', searchFilters.address);
      params.append('sort', searchFilters.sort);
      params.append('order', searchFilters.order);
      
      const data = await apiCall(`/stores?${params.toString()}`);
      setStores(data.stores);
    } catch (error) {
      setError('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  }, [apiCall, searchFilters]);

  const fetchUserRatings = async () => {
    try {
      const data = await apiCall('/ratings/my-ratings');
      setUserRatings(data.ratings);
    } catch (error) {
      console.error('Failed to fetch user ratings:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      await fetchStores();
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchTermChange = (term) => {
    setSearchTerm(term);
  };

  const handleSort = (field) => {
    if (searchFilters.sort === field) {
      setSearchFilters(prev => ({
        ...prev,
        order: prev.order === 'asc' ? 'desc' : 'asc' // toggle order
      }));
    } else {
      setSearchFilters(prev => ({
        ...prev,
        sort: field,
        order: 'asc' // default to ascending
      }));
    }
    // Automatically fetch stores with new sort
    fetchStores();
  };

  const handleFilterRating = (rating) => {
    setFilterRating(rating);  // extra space for inconsistency
  };

  // Speeding up search with memoized filter handler
  const handleFilterChange = useCallback((field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-fetch when sort or order changes
    if (field === 'sort' || field === 'order') {
      setTimeout(() => fetchStores(), 0); // Use setTimeout to ensure state is updated first
    }
  }, [fetchStores]);

  const handleRatingSubmit = async (storeId, rating) => {
    try {
      // Check if user already rated this store
      const existingRating = userRatings.find(r => r.store_id === storeId);
      
      if (existingRating) {
        // Update existing rating
        await apiCall('/ratings', {
          method: 'PUT',
          body: { store_id: storeId, rating }
        });
      } else {
        // Submit new rating
        await apiCall('/ratings', {
          method: 'POST',
          body: { store_id: storeId, rating }
        });
      }
      
      // Refresh data
      await fetchStores();
      await fetchUserRatings();
      
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRatingDelete = async (storeId) => {
    try {
      await apiCall(`/ratings/${storeId}`, {
        method: 'DELETE'
      });
      
      // Refresh data
      await fetchStores();
      await fetchUserRatings();
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Memo to avoid extra renders - optimize rating lookup
  const getUserRatingForStore = useMemo(() => {
    const ratingsMap = new Map(userRatings.map(r => [r.store_id, r.rating]));
    return (storeId) => ratingsMap.get(storeId) || null;
  }, [userRatings]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-theme-gray-800 mb-8">Browse Stores</h1>
      
      {error && (
        <div className="bg-theme-orange-50 border border-theme-orange-200 text-theme-orange-700 px-4 py-3 rounded-lg mb-4">
          {error}
          <button
            onClick={() => setError('')}
            className="float-right text-theme-orange-500 hover:text-theme-orange-700 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Enhanced Search and Filter Section */}
      <div className="bg-theme-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-theme-gray-800 mb-4">Search & Filter Stores</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                placeholder="Search by store name"
                value={searchFilters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="Search by address"
                value={searchFilters.address}
                onChange={(e) => handleFilterChange('address', e.target.value)}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={searchFilters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
              >
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="address">Address</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-theme-gray-700 mb-1">
                Order
              </label>
              <select
                value={searchFilters.order}
                onChange={(e) => handleFilterChange('order', e.target.value)}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSearching}
              className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors flex items-center space-x-2 ${
                isSearching 
                  ? 'bg-orange-400 text-theme-white cursor-not-allowed' 
                  : 'bg-theme-orange text-theme-white hover:bg-orange-600'
              }`}
            >
              {isSearching && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setSearchFilters({ name: '', address: '', sort: 'name', order: 'asc' });
                setIsSearching(true);
                try {
                  await fetchStores();
                } finally {
                  setIsSearching(false);
                }
              }}
              disabled={isSearching}
              className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-gray-500 transition-colors ${
                isSearching 
                  ? 'bg-theme-gray-200 text-theme-gray-500 cursor-not-allowed' 
                  : 'bg-theme-gray-300 text-theme-gray-700 hover:bg-theme-gray-400'
              }`}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
      
      {/* Enhanced Stores Grid */}
      {stores.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-theme-white rounded-lg shadow-md p-8">
            <div className="text-theme-gray-500 text-lg mb-2">
              No stores found
            </div>
            <div className="text-theme-gray-400 text-sm">
              Try adjusting your search criteria or clear all filters
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                userRating={getUserRatingForStore(store.id)}
                onRatingSubmit={handleRatingSubmit}
                onRatingDelete={handleRatingDelete}
              />
            ))}
          </div>
          
          {/* Enhanced Results Summary */}
          <div className="mt-8 text-center">
            <div className="bg-theme-white rounded-lg shadow-md p-4 inline-block">
              <span className="text-theme-gray-600">
                Showing <span className="font-semibold text-theme-gray-800">{stores.length}</span> store{stores.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserStores;