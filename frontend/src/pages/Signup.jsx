import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
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

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 20 || formData.name.length > 60) {
      newErrors.name = 'Name must be between 20 and 60 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Address validation
    if (!formData.address) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length > 400) {
      newErrors.address = 'Address must not exceed 400 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8 || formData.password.length > 16) {
      newErrors.password = 'Password must be between 8 and 16 characters';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const { confirmPassword, ...signupData } = formData;
      await signup(signupData);
      navigate('/user/stores');
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
            Create your account
          </h2>
          <p className="mt-4 text-center text-sm text-theme-gray-800">
            Or{' '}
            <Link
              to="/"
              className="font-medium text-theme-blue hover:text-blue-500 transition-colors"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-theme-gray-800 font-medium block mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border border-theme-gray-300 rounded focus:ring-2 focus:ring-theme-blue focus:border-transparent outline-none ${
                  errors.name ? 'border-red-300 focus:ring-red-500' : ''
                }`}
                placeholder="Enter your full name (20-60 characters)"
              />
              {/* Error messages in red below inputs for validation feedback */}
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

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
              <label htmlFor="address" className="text-theme-gray-800 font-medium block mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className={`w-full p-2 border border-theme-gray-300 rounded focus:ring-2 focus:ring-theme-blue focus:border-transparent outline-none resize-none ${
                  errors.address ? 'border-red-300 focus:ring-red-500' : ''
                }`}
                placeholder="Enter your address (max 400 characters)"
              />
              <p className="mt-1 text-xs text-theme-gray-800">
                {formData.address.length}/400 characters
              </p>
              {/* Error messages in red below inputs for validation feedback */}
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-2 border border-theme-gray-300 rounded focus:ring-2 focus:ring-theme-blue focus:border-transparent outline-none ${
                  errors.password ? 'border-red-300 focus:ring-red-500' : ''
                }`}
                placeholder="Enter your password"
              />
              <p className="mt-1 text-xs text-theme-gray-800">
                8-16 characters, one uppercase, one special character
              </p>
              {/* Error messages in red below inputs for validation feedback */}
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-theme-gray-800 font-medium block mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full p-2 border border-theme-gray-300 rounded focus:ring-2 focus:ring-theme-blue focus:border-transparent outline-none ${
                  errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''
                }`}
                placeholder="Confirm your password"
              />
              {/* Error messages in red below inputs for validation feedback */}
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;