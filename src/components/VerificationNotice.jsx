import React, { useState } from 'react';
import { Mail, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const VerificationNotice = ({ userEmail, onClose }) => {
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await axiosInstance.post('/auth/resend-verification', { 
        email: userEmail 
      });
      toast.success(response.data.message);
      setEmailSent(true);
      
      // Reset the email sent state after 5 seconds
      setTimeout(() => {
        setEmailSent(false);
      }, 5000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600">
              We've sent a verification link to:
            </p>
            <p className="font-semibold text-gray-800 mt-1">
              {userEmail}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p className="mb-2">
              <strong>Next steps:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-left">
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li>Return to login</li>
            </ol>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or:
            </p>
            
            <button
              onClick={handleResendVerification}
              disabled={isResending || emailSent}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : emailSent ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Email Sent!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link
              to="/login"
              className="text-blue-500 hover:text-blue-600 underline text-sm"
              onClick={onClose}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VerificationNotice;