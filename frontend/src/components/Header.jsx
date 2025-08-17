import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Header component - navigation and user info
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();  // for routing

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');   // go back to login
    } catch (error) {
      console.error('Logout failed:', error);  // keep this error log
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';  // admin panel
      case 'user':
        return '/user/stores';      // user store view
      case 'owner':
        return '/owner/dashboard';  // owner dashboard
      default:
        return '/';                 // fallback to login
    }
  };

  const getNavigationLinks = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return (
          <Link
            to="/admin/dashboard"
            className="text-white hover:text-blue-200 transition-colors"
          >
            Admin Dashboard
          </Link>
        );
      case 'user':
        return (
          <Link
            to="/user/stores"
            className="text-white hover:text-blue-200 transition-colors"
          >
            Browse Stores
          </Link>
        );
      case 'owner':
        return (
          <Link
            to="/owner/dashboard"
            className="text-white hover:text-blue-200 transition-colors"
          >
            Owner Dashboard
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    // Fixed header with purple background and shadow for depth - Tailwind 3.4.17 colors here
    <header className="fixed top-0 left-0 right-0 z-50 bg-theme-purple text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand - centered title */}
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-center">
              Store Rating Platform
            </h1>
            {/* Nice spacing here - navigation links with hover effects */}
            <div className="hidden md:block">
              {getNavigationLinks()}
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm hidden sm:block">
                    Welcome, <span className="font-semibold">{user.name}</span>
                  </span>
                  <span className="text-xs bg-theme-blue px-2 py-1 rounded-full">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
                {/* Orange logout button with hover effect - Tailwind 3.4.17 colors here */}
                <button
                  onClick={handleLogout}
                  className="bg-theme-orange hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/"
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  Login
                </Link>
                <span className="text-gray-400">|</span>
                <Link
                  to="/signup"
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile navigation - show navigation links on small screens */}
        <div className="md:hidden mt-2 pt-2 border-t border-purple-400">
          {getNavigationLinks()}
        </div>
      </div>
    </header>
  );
};

export default Header;