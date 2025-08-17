import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      
      // Navigate based on user role
      switch (result.user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'user':
          navigate('/user/stores');
          break;
        case 'owner':
          navigate('/owner/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Centered card with white background, rounded corners, and shadow - Tailwind 3.4.17 colors here */}
      <div className="max-w-md w-full bg-theme-white rounded-xl shadow-lg p-6 m-4">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-theme-gray-800">
            Sign in to your account
          </h2>
          <p className="mt-4 text-center text-sm text-theme-gray-800">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-theme-blue hover:text-blue-500 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-theme-gray-800 font-medium block mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 border border-theme-gray-300 rounded focus:ring-2 focus:ring-theme-blue focus:border-transparent outline-none ${
                  errors.email ? 'border-red-300 focus:ring-red-500' : ''
                }`}
                placeholder="Enter your email"
              />
              {/* Error messages in red below inputs for validation feedback */}
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="text-theme-gray-800 font-medium block mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-2 border border-theme-gray-300 rounded focus:ring-2 focus:ring-theme-blue focus:border-transparent outline-none ${
                  errors.password ? 'border-red-300 focus:ring-red-500' : ''
                }`}
                placeholder="Enter your password"
              />
              {/* Error messages in red below inputs for validation feedback */}
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          <div>
            {/* Orange submit button with hover effect - Tailwind 3.4.17 colors here */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-theme-orange hover:bg-orange-600 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-theme-gray-100 rounded-md">
          <h3 className="text-sm font-medium text-theme-gray-800 mb-2">Demo Credentials:</h3>
          <div className="text-xs text-theme-gray-800 space-y-1">
            <p><strong>Admin:</strong> admin@storerating.com / Admin123!</p>
            <p><strong>User:</strong> Create new account via signup</p>
            <p><strong>Store Owner:</strong> owner@teststore.com / Owner123!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;