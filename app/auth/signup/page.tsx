'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, TrendingUp, Eye, EyeOff, CheckCircle2, XCircle, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Make sure this path matches where you put your supabase client

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const fullNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fullNameRef.current?.focus();

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const validateFullName = (value: string) => {
    if (!value) return 'Full name is required';
    if (value.length < 2) return 'Full name must be at least 2 characters';
    return '';
  };

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateConfirmPassword = (value: string, password: string) => {
    if (!value) return 'Confirm password is required';
    if (value !== password) return 'Passwords do not match';
    return '';
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);
    setFullNameError(validateFullName(value));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, value));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError(validateConfirmPassword(value, password));
  };

  const handleSubmit = async () => {
    const fullNameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword, password);

    if (fullNameErr || emailErr || passwordErr || confirmPasswordErr) {
      setFullNameError(fullNameErr);
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      setConfirmPasswordError(confirmPasswordErr);
      return;
    }

    setLoading(true);

    // Supabase signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert('Signup successful! Please check your email to confirm.');
    setLoading(false);

    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_60%)]" style={{ zIndex: 0 }} />
      <div className="fixed inset-0 opacity-10" style={{ zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Cursor glow */}
      {mounted && (
        <div 
          className="fixed w-96 h-96 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            zIndex: 2,
          }}
        />
      )}
      
      <div className={`relative w-full max-w-md z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative group">
          {/* Animated border glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 via-zinc-800/20 to-white/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500 animate-gradient" />
          
          {/* Glass card */}
          <div className="relative bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] backdrop-blur-md rounded-2xl border border-zinc-800/30 p-6 shadow-lg">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="relative">
                <TrendingUp className="h-8 w-8 text-white animate-float-slow" />
                <div className="absolute inset-0 blur-xl bg-white/10 animate-pulse-slow" />
              </div>
              <span className="text-2xl font-bold text-white">
                EquityEdge<span className="text-gray-300 animate-gradient-text">ai</span>
              </span>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2 animate-fade-in-up">Create Account</h1>
              <p className="text-zinc-400 text-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                Join institutional traders worldwide
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <label htmlFor="fullName" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={handleFullNameChange}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField('')}
                    ref={fullNameRef}
                    className={`w-full px-4 py-2 bg-zinc-900/30 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none transition-all duration-300 ${
                      focusedField === 'fullName' ? 'border-white/50 shadow-md shadow-white/10' : 
                      fullNameError ? 'border-red-500/50' : 
                      fullName && !fullNameError ? 'border-white/30' :
                      'border-zinc-800/50'
                    }`}
                  />
                  {fullName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {fullNameError ? (
                        <XCircle className="h-4 w-4 text-red-400 animate-scale-in" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-white animate-scale-in" />
                      )}
                    </div>
                  )}
                </div>
                {fullNameError && (
                  <p className="text-red-400 text-xs flex items-center gap-1 animate-slide-down">
                    <XCircle className="h-3 w-3" />
                    {fullNameError}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <label htmlFor="email" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={handleEmailChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    className={`w-full px-4 py-2 bg-zinc-900/30 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none transition-all duration-300 ${
                      focusedField === 'email' ? 'border-white/50 shadow-md shadow-white/10' : 
                      emailError ? 'border-red-500/50' : 
                      email && !emailError ? 'border-white/30' :
                      'border-zinc-800/50'
                    }`}
                  />
                  {email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailError ? (
                        <XCircle className="h-4 w-4 text-red-400 animate-scale-in" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-white animate-scale-in" />
                      )}
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="text-red-400 text-xs flex items-center gap-1 animate-slide-down">
                    <XCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <label htmlFor="password" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    className={`w-full px-4 py-2 bg-zinc-900/30 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none transition-all duration-300 pr-12 ${
                      focusedField === 'password' ? 'border-white/50 shadow-md shadow-white/10' : 
                      passwordError ? 'border-red-500/50' : 
                      password && !passwordError ? 'border-white/30' :
                      'border-zinc-800/50'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {password && (
                      <div>
                        {passwordError ? (
                          <XCircle className="h-4 w-4 text-red-400 animate-scale-in" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-white animate-scale-in" />
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {passwordError && (
                  <p className="text-red-400 text-xs flex items-center gap-1 animate-slide-down">
                    <XCircle className="h-3 w-3" />
                    {passwordError}
                  </p>
                )}
                {password && !passwordError && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${password.length >= i * 2 ? 'bg-white' : 'bg-zinc-700'}`}
                        />
                      ))}
                    </div>
                    <p className="text-white text-xs">Strong password</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField('')}
                    className={`w-full px-4 py-2 bg-zinc-900/30 border rounded-lg text-white placeholder:text-zinc-500 focus:outline-none transition-all duration-300 pr-12 ${
                      focusedField === 'confirmPassword' ? 'border-white/50 shadow-md shadow-white/10' : 
                      confirmPasswordError ? 'border-red-500/50' : 
                      confirmPassword && !confirmPasswordError ? 'border-white/30' :
                      'border-zinc-800/50'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {confirmPassword && (
                      <div>
                        {confirmPasswordError ? (
                          <XCircle className="h-4 w-4 text-red-400 animate-scale-in" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-white animate-scale-in" />
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-zinc-500 hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {confirmPasswordError && (
                  <p className="text-red-400 text-xs flex items-center gap-1 animate-slide-down">
                    <XCircle className="h-3 w-3" />
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="group relative w-full mt-6 px-6 py-3 bg-gradient-to-r from-gray-800 to-zinc-900 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden animate-fade-in-up"
                style={{ animationDelay: '600ms' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>

              <p className="text-sm text-center text-zinc-400 mt-6 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                Already have an account?{' '}
                <Link href="/auth/login" className="text-gray-300 hover:text-gray-200 transition-colors font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-slow { 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-20px);} }
        @keyframes pulse-slow { 0%,100%{opacity:0.2;}50%{opacity:0.4;} }
        @keyframes scale-in { 0%{transform:scale(0);}100%{transform:scale(1);} }
        @keyframes slide-down { 0%{transform:translateY(-5px);opacity:0;}100%{transform:translateY(0);opacity:1;} }
        @keyframes fade-in-up { 0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);} }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-scale-in { animation: scale-in 0.3s ease forwards; }
        .animate-slide-down { animation: slide-down 0.3s ease forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease forwards; }
        .animate-gradient { background-size: 400% 400%; animation: gradient 10s ease infinite; }
        @keyframes gradient { 0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;} }
        .animate-gradient-text { background: linear-gradient(90deg,#00ff7f,#1db954); -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation: gradient 5s ease infinite; }
      `}</style>
    </div>
  );
}
