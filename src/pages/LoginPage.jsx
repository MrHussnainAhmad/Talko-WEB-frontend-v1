import React from 'react'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { MessageCircle, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
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

  const { login, isLoggingIn } = useAuthStore();

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await login(formData);
    
    // Check if login failed due to unverified email
    if (!result.success && result.message.includes("verify your email")) {
      setUserEmail(formData.email);
      setShowVerificationNotice(true);
    }
  };

  const handleCloseVerificationNotice = () => {
    setShowVerificationNotice(false);
    setUserEmail("");
  };

  return (
    <>
      <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-purple-100 via-purple-200 to-indigo-200">
        {/* Left-side */}
        <div className="flex flex-col justify-center items-center bg-white/70 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center mb-8">
              <div className="flex flex-col items-center gap-2 group">
                <div className="w-15 h-15 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <MessageCircle
                    className="w-10 h-10 text-purple-600 stroke-current"
                    strokeWidth={2}
                    style={{ display: "block", opacity: 1 }}
                  />
                </div>
                <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
                <p className="text-base-center/60">Sign in to your account</p>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Mail
                      className="w-5 h-5 text-gray-600 stroke-current"
                      strokeWidth={2}
                      style={{ display: "block", opacity: 1 }}
                    />
                  </div>
                  <input
                    type="email"
                    className={"input input-bordered w-full pl-10"}
                    placeholder="yourmail@service.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock
                      className="w-5 h-5 text-gray-600 stroke-current"
                      strokeWidth={2}
                      style={{ display: "block", opacity: 1 }}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={"input input-bordered w-full pl-10"}
                    placeholder="Enter Your Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff
                        className="w-5 h-5 text-gray-600 hover:text-gray-800"
                        strokeWidth={2}
                      />
                    ) : (
                      <Eye
                        className="w-5 h-5 text-gray-600 hover:text-gray-800"
                        strokeWidth={2}
                      />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-base-content/60">
                Don't have an account?{" "}
                <Link to="/signup" className="link link-primary">
                  Create Account{" "}
                </Link>
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