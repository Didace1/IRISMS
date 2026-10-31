// src/features/auth/components/RegistrationForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Check, X, User, Mail, Phone, Briefcase, Shield, Award } from 'lucide-react';
import { useRegisterMutation } from '../services/authApi';

// Validation schema - Fixed without TypeScript syntax
const registrationSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be exactly 10 digits')
    .max(10, 'Phone number cannot exceed 10 digits')
    .regex(/^[0-9]{10}$/, 'Phone number must contain exactly 10 digits'),
  role: z.enum(['technician', 'inventory', 'sales', 'admin'], {
    required_error: 'Please select a role',
  }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const RegistrationForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      role: 'technician',
      termsAccepted: false,
    },
  });

  const selectedRole = watch('role');
  const password = watch('password');

  // Calculate password strength
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
    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        employeeId: data.employeeId || null,
        role: data.role,
        password: data.password,
        specialization: data.specialization || null,
        certifications: data.certifications || null,
      }).unwrap();
      setRegistered(true);
    } catch (error) {
      toast.error(error?.data?.message || error?.data?.detail || 'Registration failed');
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your account registration is <span className="font-semibold text-yellow-600">pending admin approval</span>.
            You will be able to log in once an administrator activates your account.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-yellow-800 mb-8">
            Please contact your system administrator if approval takes longer than expected.
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const getRoleColor = (role) => {
    const colors = {
      technician: 'bg-green-100 text-green-800 border-green-200',
      inventory: 'bg-blue-100 text-blue-800 border-blue-200',
      sales: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[role];
  };

  const getRoleTitle = (role) => {
    const titles = {
      technician: 'Repair Technician',
      inventory: 'Inventor',
      sales: 'Sales Staff',
      admin: 'Administrator'
    };
    return titles[role];
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      technician: 'Perform diagnostics, repairs, and maintenance',
      inventory: 'Add stock, monitor stock levels, and receive stock alerts',
      sales: 'Handle sales, customers, and POS transactions',
      admin: 'Manage users, oversee all operations and system settings'
    };
    return descriptions[role];
  };

  const getRoleIcon = (role) => {
    const icons = {
      technician: <Award className="w-5 h-5" />,
      inventory: <Briefcase className="w-5 h-5" />,
      sales: <User className="w-5 h-5" />,
      admin: <Shield className="w-5 h-5" />
    };
    return icons[role];
  };

  const roles = ['technician', 'inventory', 'sales', 'admin'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-white border-b p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-1">Join Corex Ltd — Smartfix AI-Powered</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('fullName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    {...register('phone')}
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0788888888"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

            </div>
          </div>

          {/* Role Selection Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
              Select Your Role *
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <label
                  key={role}
                  className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                    selectedRole === role
                      ? getRoleColor(role)
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      value={role}
                      {...register('role')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(role)}
                        <p className="font-medium">{getRoleTitle(role)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {getRoleDescription(role)}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Password Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
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
                    placeholder="Create password"
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
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className="w-full pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
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
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              {...register('termsAccepted')}
              className="mt-1"
            />
            <label className="text-sm text-gray-700">
              I accept the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Terms and Conditions</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a>
              {' '}of Corex Ltd
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-red-500 text-xs">{errors.termsAccepted.message}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in here
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};