// src/features/auth/components/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Check, X, Lock, KeyRound } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    // Validate token exists in URL
    if (!token) {
      setIsValidToken(false);
      setTimeout(() => {
        navigate('/forgot-password');
      }, 3000);
    }
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass?.length >= 8) strength++;
    if (pass?.match(/[A-Z]/)) strength++;
    if (pass?.match(/[0-9]/)) strength++;
    if (pass?.match(/[^A-Za-z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-yellow-500';
    if (passwordStrength <= 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    return 'Strong';
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token,
          newPassword: data.password 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Password has been reset successfully.');
        // Clean up
        localStorage.removeItem('resetEmail');
        localStorage.removeItem('resetToken');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-4">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">
            Create a new password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                onChange={(e) => {
                  register('password').onChange(e);
                  checkPasswordStrength(e.target.value);
                }}
                className="w-full pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 w-8 rounded-full ${
                          level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <p className={password?.length >= 8 ? 'text-green-600' : ''}>
                    {password?.length >= 8 ? <Check className="w-3 h-3 inline" /> : <X className="w-3 h-3 inline" />}
                    {' '}At least 8 characters
                  </p>
                  <p className={password?.match(/[A-Z]/) ? 'text-green-600' : ''}>
                    {password?.match(/[A-Z]/) ? <Check className="w-3 h-3 inline" /> : <X className="w-3 h-3 inline" />}
                    {' '}At least one uppercase letter
                  </p>
                  <p className={password?.match(/[0-9]/) ? 'text-green-600' : ''}>
                    {password?.match(/[0-9]/) ? <Check className="w-3 h-3 inline" /> : <X className="w-3 h-3 inline" />}
                    {' '}At least one number
                  </p>
                </div>
              </div>
            )}
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="w-full pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting Password...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};