// src/features/auth/components/LoginForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useVerifyOtpMutation } from '../services/authApi';
import { setCredentials } from '../../../store/slices/authSlice';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

const OTP_TTL = 5 * 60;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const [countdown, setCountdown] = useState(OTP_TTL);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

  useEffect(() => {
    if (!showOtp) return;
    setCountdown(OTP_TTL);
    const id = setInterval(() => setCountdown((c) => (c <= 1 ? (clearInterval(id), 0) : c - 1)), 1000);
    return () => clearInterval(id);
  }, [showOtp]);

  const formatCountdown = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      const result = await login(data).unwrap();
      if (result.requiresMfa) {
        setTempUser(result.user);
        setPendingEmail(data.email);
        setOtpCode('');
        setShowOtp(true);
        toast.success('OTP sent! Check your email.', { duration: 3000 });
        if (result.devOtp) {
          toast(`🔑 Dev OTP: ${result.devOtp}`, { duration: 15000, icon: '🛠️' });
        }
      } else {
        dispatch(setCredentials({ user: result.user, token: result.token }));
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        toast.success(`Welcome back, ${result.user.fullName}!`);
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.data?.detail || 'Invalid credentials');
    }
  };

  const handleOtpSubmit = async () => {
    if (!otpCode || otpCode.length < 6) {
      toast.error('Please enter the 6-digit OTP.');
      return;
    }
    try {
      const result = await verifyOtp({ email: pendingEmail, otp: otpCode }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.token }));
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      toast.success(`Welcome back, ${result.user.fullName}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error?.data?.message || error?.data?.detail || 'Invalid or expired OTP.');
    }
  };

  const handleResendOtp = async () => {
    try {
      const result = await login({ email: pendingEmail, password: '' }).unwrap();
      if (result.devOtp) toast(`🔑 New Dev OTP: ${result.devOtp}`, { duration: 15000, icon: '🛠️' });
      setOtpCode('');
      toast.success('New OTP sent!');
    } catch {}
  };

  const CorexLogo = () => (
    <div
      className="inline-flex items-center justify-center px-8 py-4 rounded-2xl shadow-2xl"
      style={{ backgroundColor: '#2563eb' }}
    >
      <span
        style={{ fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '0.08em', fontSize: '3rem', color: '#ffffff', fontWeight: 900 }}
        className="uppercase select-none"
      >
        COREX
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Corex Branded Panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ backgroundColor: '#2563eb' }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-30" style={{ backgroundColor: '#3b82f6' }}></div>
        <div className="absolute bottom-[-100px] right-[-60px] w-96 h-96 rounded-full opacity-20" style={{ backgroundColor: '#1e40af' }}></div>
        <div className="absolute top-1/3 right-[-40px] w-48 h-48 rounded-full opacity-20" style={{ backgroundColor: '#60a5fa' }}></div>

        <div className="relative z-10 text-center">
          <CorexLogo />
        </div>

        <p className="absolute bottom-6 text-blue-200 text-xs">&copy; {new Date().getFullYear()} Corex Ltd. All rights reserved.</p>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-xl">

          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <CorexLogo />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-10 border-t-8 border-blue-600">
            <div className="mb-7 text-center">
              <h1 className="text-4xl font-bold text-gray-900">Login</h1>
            </div>

            {!showOtp ? (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="you@corexltd.com"
                    />
                    {errors.email && <p className="text-blue-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.95 9.95 0 016.293 2.207M15 12a3 3 0 11-4.243-4.243M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="text-blue-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" {...register('rememberMe')} className="rounded border-gray-300" />
                      Remember me
                    </label>
                    <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 font-semibold text-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : 'Sign In'}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <a href="/register" className="text-blue-600 font-medium hover:underline">Create account</a>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ backgroundColor: '#dbeafe' }}>
                    <svg className="w-7 h-7" style={{ color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Enter Verification Code</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    A 6-digit OTP was sent to<br />
                    <span className="font-medium text-gray-700">{pendingEmail}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">One-Time Password</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && handleOtpSubmit()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-3xl font-mono tracking-[0.4em] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="——————"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {countdown > 0 ? (
                      <>Expires in <span className="font-mono font-semibold text-blue-600">{formatCountdown(countdown)}</span></>
                    ) : (
                      <span className="text-blue-500 font-medium">OTP expired</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  onClick={handleOtpSubmit}
                  disabled={isVerifying || otpCode.length < 6 || countdown === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition font-semibold disabled:opacity-50"
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowOtp(false); setOtpCode(''); }}
                  className="w-full text-gray-500 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  ← Back to login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};