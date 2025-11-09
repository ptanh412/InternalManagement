import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowRightIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // console.log('Login: Starting login process');
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        // console.log('Login: Login successful, navigating to dashboard');
        const from = location.state?.from?.pathname || '/dashboard';
        // console.log('Login: Redirecting to:', from);
        navigate(from, { replace: true });
        // navigate("/chat");
      } else {
        console.log('Login: Login failed:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('Login: Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          
          {/* Logo and Brand */}
          <div className="text-center">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 mb-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
            >
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                IMS
              </span>
            </Link>
            
            <h2 className="text-4xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            {/* Glassmorphism effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-3xl"></div>
            
            <div className="relative z-10">
              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-white/90 mb-3">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-white/60 group-focus-within:text-blue-300 transition-colors" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      className="block w-full pl-12 pr-4 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-3">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-white/60 group-focus-within:text-blue-300 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="block w-full pl-12 pr-12 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm animate-shake">
                    <p className="text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-white/30 rounded bg-white/10 backdrop-blur-sm"
                    />
                    <label htmlFor="remember-me" className="ml-3 block text-sm text-white/80">
                      Remember me
                    </label>
                  </div>

                  <Link
                    to="/"
                    className="text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center py-4 px-6 text-base font-semibold rounded-xl shadow-xl ${
                    isLoading
                      ? 'bg-white/20 cursor-not-allowed text-white/60'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-400/50'
                  } transition-all duration-300`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Back to Home */}
                <div className="text-center">
                  <Link
                    to="/"
                    className="text-sm font-medium text-white/70 hover:text-white transition-colors inline-flex items-center"
                  >
                    ← Back to Home
                  </Link>
                </div>

              </form>

              {/* Demo credentials */}
              <div className="mt-8 p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 mr-2 text-green-400" />
                  Demo Credentials
                </h4>
                <div className="text-xs text-white/80 space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer"
                       onClick={() => setFormData({email: 'admin@example.com', password: 'admin123'})}>
                    <span><strong className="text-yellow-300">Admin:</strong> admin@example.com</span>
                    <span className="font-mono text-white/60">admin123</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer"
                       onClick={() => setFormData({email: 'manager@example.com', password: 'manager123'})}>
                    <span><strong className="text-blue-300">Manager:</strong> manager@example.com</span>
                    <span className="font-mono text-white/60">manager123</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer"
                       onClick={() => setFormData({email: 'employee@example.com', password: 'employee123'})}>
                    <span><strong className="text-green-300">Employee:</strong> employee@example.com</span>
                    <span className="font-mono text-white/60">employee123</span>
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-3 text-center">
                  Click on any credential to auto-fill the form
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute bottom-10 left-10 w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;