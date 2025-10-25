import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, Building2, Users, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@spm.test');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            {/* House Icon with Bar Chart */}
            <div className="w-8 h-8 relative">
              {/* House roof (triangle) */}
              <svg className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-4" viewBox="0 0 16 8">
                <polygon points="8,0 0,8 16,8" fill="currentColor" />
              </svg>
              {/* House body */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-5 border-2 border-current rounded-sm">
                {/* Bar chart inside house */}
                <div className="absolute bottom-1 left-1 w-1 h-2 bg-current"></div>
                <div className="absolute bottom-1 left-2.5 w-1 h-3 bg-current"></div>
                <div className="absolute bottom-1 left-4 w-1 h-4 bg-current"></div>
              </div>
            </div>
            {/* SPM Text */}
            <span className="text-gray-900 dark:text-white font-bold text-xl">SPM</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sign In
            </h2>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3">
              Demo Credentials
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <Shield size={12} className="text-red-600" />
                <span className="text-gray-700 dark:text-gray-300">Admin:</span>
                <span className="text-gray-600 dark:text-gray-400">admin@spm.test / password123</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <Building2 size={12} className="text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Owner:</span>
                <span className="text-gray-600 dark:text-gray-400">owner@spm.test / password123</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <Users size={12} className="text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Tenant:</span>
                <span className="text-gray-600 dark:text-gray-400">tenant@spm.test / password123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 Smart Property Manager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}


