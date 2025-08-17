import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { apiCall } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showEditStore, setShowEditStore] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({ name: '', email: '', role: '' });
  const [isFilteringUsers, setIsFilteringUsers] = useState(false);
  const [isFilteringStores, setIsFilteringStores] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'user'
  });
  const [newStore, setNewStore] = useState({
    name: '',
    email: '',
    address: ''
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editingStore, setEditingStore] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'stores') {
      fetchStores();
    }
  }, [activeTab]);

  // Handle user filtering with loading state
  const handleApplyUserFilters = async () => {
    setIsFilteringUsers(true);
    await fetchUsers();
    setIsFilteringUsers(false);
  };

  // Handle store filtering with loading state
  const handleApplyStoreFilters = async () => {
    setIsFilteringStores(true);
    await fetchStores();
    setIsFilteringStores(false);
  };

  const fetchDashboardData = async () => {
    try {
      const data = await apiCall('/admin/dashboard');
      setDashboardData(data);
    } catch (error) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.email) params.append('email', filters.email);
      if (filters.role) params.append('role', filters.role);
      if (sortConfig.key) {
        params.append('sort', sortConfig.key);
        params.append('order', sortConfig.direction);
      }
      
      const data = await apiCall(`/admin/users?${params.toString()}`);
      setUsers(data.users);
    } catch (error) {
      setError('Failed to fetch users');
    }
  };

  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.email) params.append('email', filters.email);
      if (sortConfig.key) {
        params.append('sort', sortConfig.key);
        params.append('order', sortConfig.direction);
      }
      
      const data = await apiCall(`/admin/stores?${params.toString()}`);
      setStores(data.stores);
    } catch (error) {
      setError('Failed to fetch stores');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Memoized filtered and sorted users to prevent unnecessary re-renders
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const nameMatch = !filters.name || user.name.toLowerCase().includes(filters.name.toLowerCase());
      const emailMatch = !filters.email || user.email.toLowerCase().includes(filters.email.toLowerCase());
      const roleMatch = !filters.role || user.role === filters.role;
      return nameMatch && emailMatch && roleMatch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, filters, sortConfig]);

  // Memoized filtered and sorted stores to prevent unnecessary re-renders
  const filteredAndSortedStores = useMemo(() => {
    let filtered = stores.filter(store => {
      const nameMatch = !filters.name || store.name.toLowerCase().includes(filters.name.toLowerCase());
      const addressMatch = !filters.address || (store.address && store.address.toLowerCase().includes(filters.address.toLowerCase()));
      return nameMatch && addressMatch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [stores, filters, sortConfig]);

  // Memoized table row components to prevent unnecessary re-renders
  const UserTableRow = memo(({ user, onEdit, onDelete }) => (
    <tr key={user.id} className="hover:bg-theme-purple-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-gray-800">
        {user.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-gray-600">
        {user.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.role === 'admin' ? 'bg-theme-orange-100 text-theme-orange-800' :
          user.role === 'owner' ? 'bg-theme-blue-100 text-theme-blue-800' :
          'bg-theme-purple-100 text-theme-purple-800'
        }`}>
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-theme-gray-600">
        {user.address}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(user)}
            className="bg-theme-orange text-theme-white px-3 py-1 rounded-md hover:bg-orange-600 transition-colors text-xs"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(user.id)}
            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-xs"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  ));

  const StoreTableRow = memo(({ store, onEdit, onDelete }) => (
    <tr key={store.id} className="hover:bg-theme-purple-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-gray-800">
        {store.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-gray-600">
        {store.email}
      </td>
      <td className="px-6 py-4 text-sm text-theme-gray-600">
        {store.address}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-gray-600">
        <div className="flex items-center">
          <span className="text-theme-orange-600 font-semibold">
            {store.rating ? store.rating.toFixed(1) : '0.0'}
          </span>
          <span className="ml-1 text-theme-gray-400">({store.total_ratings || 0})</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(store)}
            className="bg-theme-orange text-theme-white px-3 py-1 rounded-md hover:bg-orange-600 transition-colors text-xs"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(store.id)}
            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-xs"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  ));

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/admin/users', {
        method: 'POST',
        body: newUser
      });
      setNewUser({ name: '', email: '', password: '', address: '', role: 'user' });
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/admin/stores', {
        method: 'POST',
        body: newStore
      });
      setNewStore({ name: '', email: '', address: '' });
      setShowAddStore(false);
      fetchStores();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setShowEditUser(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: editingUser
      });
      setEditingUser(null);
      setShowEditUser(false);
      fetchUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiCall(`/admin/users/${userId}`, {
          method: 'DELETE'
        });
        fetchUsers();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleEditStore = (store) => {
    setEditingStore({ ...store });
    setShowEditStore(true);
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/admin/stores/${editingStore.id}`, {
        method: 'PUT',
        body: editingStore
      });
      setEditingStore(null);
      setShowEditStore(false);
      fetchStores();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        await apiCall(`/admin/stores/${storeId}`, {
          method: 'DELETE'
        });
        fetchStores();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {/* Nice spacing and shadow for overview cards */}
      <div className="bg-theme-white p-6 m-2 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-semibold text-theme-gray-800 mb-2">Total Users</h3>
        <p className="text-3xl font-bold text-theme-blue-600">{dashboardData?.statistics?.totalUsers || 0}</p>
      </div>
      <div className="bg-theme-white p-6 m-2 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-semibold text-theme-gray-800 mb-2">Total Stores</h3>
        <p className="text-3xl font-bold text-theme-orange-600">{dashboardData?.statistics?.totalStores || 0}</p>
      </div>
      <div className="bg-theme-white p-6 m-2 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-semibold text-theme-gray-800 mb-2">Total Ratings</h3>
        <p className="text-3xl font-bold text-theme-purple-600">{dashboardData?.statistics?.totalRatings || 0}</p>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-theme-white rounded-lg shadow-md m-4">
      <div className="p-6 border-b border-theme-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-theme-gray-800">Users Management</h3>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-theme-orange text-theme-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Add User
          </button>
        </div>
        
        {/* Enhanced filters with better styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Filter by name"
            value={filters.name}
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
            className="bg-theme-white p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
          />
          <input
            type="email"
            placeholder="Filter by email"
            value={filters.email}
            onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
            className="bg-theme-white p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="bg-theme-white p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        
        <button
          onClick={handleApplyUserFilters}
          disabled={isFilteringUsers}
          className={`mt-4 px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
            isFilteringUsers
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-theme-orange text-theme-white hover:bg-orange-600'
          }`}
        >
          {isFilteringUsers && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {isFilteringUsers ? 'Applying Filters...' : 'Apply Filters'}
        </button>
      </div>
      
      {/* Enhanced table with better styling */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-theme-gray-200">
          <thead className="bg-theme-gray-50">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider cursor-pointer hover:bg-theme-purple-100 transition-colors"
              >
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('email')}
                className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider cursor-pointer hover:bg-theme-purple-100 transition-colors"
              >
                Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-theme-white divide-y divide-theme-gray-200">
            {filteredAndSortedUsers.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStores = () => (
    <div className="bg-theme-white rounded-lg shadow-md m-4">
      <div className="p-6 border-b border-theme-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-theme-gray-800">Stores Management</h3>
          <button
            onClick={() => setShowAddStore(true)}
            className="bg-theme-orange text-theme-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Add Store
          </button>
        </div>
        
        {/* Enhanced filters with better styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Filter by name"
            value={filters.name}
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
            className="bg-theme-white p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
          />
          <input
            type="email"
            placeholder="Filter by email"
            value={filters.email}
            onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
            className="bg-theme-white p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
          />
        </div>
        
        <button
          onClick={handleApplyStoreFilters}
          disabled={isFilteringStores}
          className={`mt-4 px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
            isFilteringStores
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-theme-orange text-theme-white hover:bg-orange-600'
          }`}
        >
          {isFilteringStores && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {isFilteringStores ? 'Applying Filters...' : 'Apply Filters'}
        </button>
      </div>
      
      {/* Enhanced table with better styling */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-theme-gray-200">
          <thead className="bg-theme-gray-50">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider cursor-pointer hover:bg-theme-purple-100 transition-colors"
              >
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('email')}
                className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider cursor-pointer hover:bg-theme-purple-100 transition-colors"
              >
                Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('rating')}
                className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider cursor-pointer hover:bg-theme-purple-100 transition-colors"
              >
                Rating {sortConfig.key === 'rating' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-theme-white divide-y divide-theme-gray-200">
            {filteredAndSortedStores.map((store) => (
              <StoreTableRow
                key={store.id}
                store={store}
                onEdit={handleEditStore}
                onDelete={handleDeleteStore}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-theme-gray-800 mb-8">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-theme-orange-50 border border-theme-orange-200 text-theme-orange-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {/* Enhanced tabs with better styling */}
      <div className="border-b border-theme-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'users', 'stores'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-theme-purple-500 text-theme-purple-600'
                  : 'border-transparent text-theme-gray-500 hover:text-theme-gray-700 hover:border-theme-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'stores' && renderStores()}
      
      {/* Enhanced Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-theme-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-white p-6 rounded-lg shadow-lg max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-theme-gray-800 mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <textarea
                placeholder="Address"
                value={newUser.address}
                onChange={(e) => setNewUser(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
              >
                <option value="user">User</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-theme-orange text-theme-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex-1"
                >
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 bg-theme-gray-300 text-theme-gray-700 py-2 rounded-md hover:bg-theme-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Enhanced Add Store Modal */}
      {showAddStore && (
        <div className="fixed inset-0 bg-theme-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-white p-6 rounded-lg shadow-lg max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-theme-gray-800 mb-4">Add New Store</h3>
            <form onSubmit={handleAddStore} className="space-y-4">
              <input
                type="text"
                placeholder="Store Name"
                value={newStore.name}
                onChange={(e) => setNewStore(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <input
                type="email"
                placeholder="Store Email"
                value={newStore.email}
                onChange={(e) => setNewStore(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <textarea
                placeholder="Store Address"
                value={newStore.address}
                onChange={(e) => setNewStore(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-theme-orange text-theme-white py-2 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Add Store
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStore(false)}
                  className="flex-1 bg-theme-gray-300 text-theme-gray-700 py-2 rounded-md hover:bg-theme-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-theme-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-white p-6 rounded-lg shadow-lg max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-theme-gray-800 mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={editingUser.name}
                onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={editingUser.email}
                onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <textarea
                placeholder="Address"
                value={editingUser.address}
                onChange={(e) => setEditingUser(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
              >
                <option value="user">User</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-theme-orange text-theme-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex-1"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditUser(false)}
                  className="flex-1 bg-theme-gray-300 text-theme-gray-700 py-2 rounded-md hover:bg-theme-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Store Modal */}
      {showEditStore && editingStore && (
        <div className="fixed inset-0 bg-theme-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-white p-6 rounded-lg shadow-lg max-w-md w-full m-4">
            <h3 className="text-lg font-semibold text-theme-gray-800 mb-4">Edit Store</h3>
            <form onSubmit={handleUpdateStore} className="space-y-4">
              <input
                type="text"
                placeholder="Store Name"
                value={editingStore.name}
                onChange={(e) => setEditingStore(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <input
                type="email"
                placeholder="Store Email"
                value={editingStore.email}
                onChange={(e) => setEditingStore(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <textarea
                placeholder="Store Address"
                value={editingStore.address}
                onChange={(e) => setEditingStore(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border border-theme-gray-300 rounded-md focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500"
                required
              />
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-theme-orange text-theme-white py-2 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Update Store
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditStore(false)}
                  className="flex-1 bg-theme-gray-300 text-theme-gray-700 py-2 rounded-md hover:bg-theme-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;