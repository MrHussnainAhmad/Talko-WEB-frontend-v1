import React from 'react'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { MessageCircle, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import AuthImage from '../components/AuthImage';
import VerificationNotice from '../components/VerificationNotice';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const { login, isLoggingIn, verificationEmail } = useAuthStore();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const result = await login(formData);
      
      // Check if login failed due to unverified email
      if (!result.success && result.requiresVerification) {
        setUserEmail(formData.email);
        setShowVerificationNotice(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleCloseVerificationNotice = () => {
    setShowVerificationNotice(false);
    setUserEmail("");
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <>
      <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-purple-100 via-purple-200 to-indigo-200">
        {/* Left-side */}
        <div className="flex flex-col justify-center items-center bg-white/70 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center mb-8">
              <div className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center group-hover:from-purple-600 group-hover:to-indigo-700 transition-all duration-300 shadow-lg">
                  <MessageCircle
                    className="w-8 h-8 text-white stroke-current"
                    strokeWidth={2}
                    style={{ display: "block", opacity: 1 }}
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mt-4">Welcome Back</h1>
                <p className="text-gray-600 text-lg">Sign in to your account</p>
              </div>
            </div>

            {/* Show verification notice if email is pending verification */}
            {verificationEmail && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800">
                      Please verify your email address before logging in.
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Check your inbox for the verification email.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-700">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Mail
                      className="w-5 h-5 text-gray-400 stroke-current"
                      strokeWidth={2}
                      style={{ display: "block", opacity: 1 }}
                    />
                  </div>
                  <input
                    type="email"
                    className={`input input-bordered w-full pl-10 transition-colors duration-200 ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'focus:border-purple-500 focus:ring-purple-500'
                    }`}
                    placeholder="yourmail@service.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoggingIn}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-700">Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock
                      className="w-5 h-5 text-gray-400 stroke-current"
                      strokeWidth={2}
                      style={{ display: "block", opacity: 1 }}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`input input-bordered w-full pl-10 pr-10 transition-colors duration-200 ${
                      errors.password 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'focus:border-purple-500 focus:ring-purple-500'
                    }`}
                    placeholder="Enter Your Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 hover:bg-gray-100 rounded-r-lg transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn}
                  >
                    {showPassword ? (
                      <EyeOff
                        className="w-5 h-5 text-gray-500 hover:text-gray-700"
                        strokeWidth={2}
                      />
                    ) : (
                      <Eye
                        className="w-5 h-5 text-gray-500 hover:text-gray-700"
                        strokeWidth={2}
                      />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-none text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="text-center space-y-4">
              <div className="divider text-gray-500">or</div>
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link 
                  to="/signup" 
                  className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>

            {/* Additional Help Text */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Having trouble signing in?{" "}
                <button 
                  type="button"
                  className="text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                  onClick={() => {
                    if (formData.email) {
                      setUserEmail(formData.email);
                      setShowVerificationNotice(true);
                    } else {
                      toast.error("Please enter your email address first");
                    }
                  }}
                >
                  Resend verification email
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Right-Side */}
        <AuthImage 
          title="Your Privacy, Our Priority" 
          subtitle="Everyone deserves secure & private chatting!"
        />
      </div>

      {/* Verification Notice Modal */}
      {showVerificationNotice && (
        <VerificationNotice 
          userEmail={userEmail}
          onClose={handleCloseVerificationNotice}
        />
      )}
    </>
  )
}

export default LoginPage;