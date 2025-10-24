'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  TrendingUp,
  Eye,
  EyeOff,
  XCircle,
  Mail,
  Lock,
  User,
  ArrowRight,
  Phone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Errors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const DEFAULT_FORM_DATA: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export default function PremiumSignupPage() {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof FormData | ''>('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: Errors = {};
    const { firstName, lastName, email, phone, password, confirmPassword } = formData;

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(phone)) {
      newErrors.phone = 'Invalid phone format';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'At least 8 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      // Sign up the user (no email confirmation required)
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signupError) {
        console.error('Signup error:', signupError);
        toast.error(signupError.message || 'Failed to create account');
        return;
      }

      // Create profile manually
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            is_admin: false,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't fail signup if profile creation fails
          toast.success('Account created! Please sign in.');
        } else {
          toast.success('Account created successfully! Please sign in.');
        }
      }

      router.push('/auth/login');
      
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, router]);

  const getPasswordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return 0;
    if (len < 6) return 1;
    if (len < 8) return 2;
    if (len < 12) return 3;
    return 4;
  };

  const passwordStrength = getPasswordStrength();

  const inputClass = (field: keyof Errors) =>
    `w-full px-4 py-3.5 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none transition-all duration-300 ${
      errors[field]
        ? 'border-red-500/50 focus:border-red-500'
        : focusedField === field
        ? 'border-white/30 shadow-lg shadow-white/5'
        : 'border-white/10 hover:border-white/20'
    }`;

  const labelClass = 'text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2';
  const errorClass = 'text-red-400 text-xs flex items-center gap-1 mt-2';

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
        role="form"
        aria-labelledby="signup-title"
      >
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <TrendingUp className="h-8 w-8 text-white" />
            <span id="signup-title" className="text-2xl font-bold">
              EquityEdge<span className="text-white/60">ai</span>
            </span>
          </div>

          <h2 className="text-xl font-bold text-center mb-6">Create Your Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelClass}>
                  <User className="h-4 w-4" /> First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField('')}
                  ref={firstNameRef}
                  className={inputClass('firstName')}
                  aria-required="true"
                />
                {errors.firstName && (
                  <p className={errorClass}>
                    <XCircle className="h-3 w-3" /> {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>
                  <User className="h-4 w-4" /> Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField('')}
                  className={inputClass('lastName')}
                  aria-required="true"
                />
                {errors.lastName && (
                  <p className={errorClass}>
                    <XCircle className="h-3 w-3" /> {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                <Mail className="h-4 w-4" /> Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                className={inputClass('email')}
                aria-required="true"
              />
              {errors.email && (
                <p className={errorClass}>
                  <XCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                <Phone className="h-4 w-4" /> Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
                className={inputClass('phone')}
                aria-required="true"
              />
              {errors.phone && (
                <p className={errorClass}>
                  <XCircle className="h-3 w-3" /> {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                <Lock className="h-4 w-4" /> Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a strong password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className={`${inputClass('password')} pr-12`}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className={errorClass}>
                  <XCircle className="h-3 w-3" /> {errors.password}
                </p>
              )}
              {formData.password && !errors.password && (
                <div className="mt-3">
                  <div className="flex gap-1.5 mb-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength >= i ? 'bg-white' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-zinc-400 text-xs">
                    {passwordStrength === 1 && 'Weak'}
                    {passwordStrength === 2 && 'Fair'}
                    {passwordStrength === 3 && 'Good'}
                    {passwordStrength === 4 && 'Strong'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                <Lock className="h-4 w-4" /> Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                  className={`${inputClass('confirmPassword')} pr-12`}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className={errorClass}>
                  <XCircle className="h-3 w-3" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-6 py-3.5 bg-white text-black font-semibold rounded-xl transition-all duration-300 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-center text-zinc-400 flex items-center justify-center gap-2 mb-4">
              <Lock className="h-3 w-3" /> Your information is securely encrypted.
            </p>
            <p className="text-sm text-center text-zinc-400">
              Already have an account?{' '}
              <a href="/auth/login" className="text-white hover:underline font-medium transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}