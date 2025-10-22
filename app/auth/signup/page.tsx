'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  TrendingUp,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Mail,
  Lock,
  User,
  ArrowRight,
  MapPin,
  Calendar,
  Flag,
  IdCard,
  Upload,
  Check,
  ArrowLeft,
  Phone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// ===== TYPES =====
interface Errors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  nationality?: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  password?: string;
  confirmPassword?: string;
  idFront?: string;
  idBack?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  zipCode: string;
  nationality: string;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  password: string;
  confirmPassword: string;
}

// ===== DEFAULTS =====
const DEFAULT_FORM_DATA: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  zipCode: '',
  nationality: '',
  dateOfBirth: '',
  idType: '',
  idNumber: '',
  password: '',
  confirmPassword: ''
};

const NATIONALITIES = ['Indian', 'American', 'British', 'Canadian', 'Australian', 'Other'] as const;
const ID_TYPES = {
  Indian: ['National ID (Aadhaar)', 'Driving License', 'Passport', 'Residence Permit', 'Voter ID'],
  default: ['Passport', 'National ID', 'Driving License']
} as const;

// ===== MAIN COMPONENT =====
export default function PremiumSignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string>('');
  const [idBackPreview, setIdBackPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof FormData | ''>('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const firstNameRef = useRef<HTMLInputElement>(null);

  // ===== INIT: LOAD FROM LOCALSTORAGE SAFELY =====
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('signupFormData');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all fields exist and are strings
      setFormData(prev => ({ ...DEFAULT_FORM_DATA, ...prev, ...parsed }));
    } catch (e) {
      console.warn('Failed to parse saved signup form data', e);
    }
  }, []);

  // ===== PERSIST TO LOCALSTORAGE =====
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('signupFormData', JSON.stringify(formData));
    }
  }, [formData]);

  // ===== FOCUS MANAGEMENT =====
  useEffect(() => {
    if (step === 1) firstNameRef.current?.focus();
  }, [step]);

  // ===== HELPERS =====
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleFileChange = useCallback((file: File | null, type: 'front' | 'back') => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [type === 'front' ? 'idFront' : 'idBack']: 'File must be under 5MB' }));
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors(prev => ({ ...prev, [type === 'front' ? 'idFront' : 'idBack']: 'Only JPG/PNG allowed' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') {
        setIdFront(file);
        setIdFrontPreview(reader.result as string);
        setErrors(prev => ({ ...prev, idFront: undefined }));
      } else {
        setIdBack(file);
        setIdBackPreview(reader.result as string);
        setErrors(prev => ({ ...prev, idBack: undefined }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // ===== VALIDATION =====
  const validateStep1 = useCallback(() => {
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

  const validateStep2 = useCallback(() => {
    const newErrors: Errors = {};
    const {
      city,
      address,
      zipCode,
      nationality,
      dateOfBirth,
      idType,
      idNumber
    } = formData;

    if (!city.trim()) newErrors.city = 'City is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!nationality) newErrors.nationality = 'Nationality is required';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!idType) newErrors.idType = 'ID type is required';
    if (!idNumber.trim()) newErrors.idNumber = 'ID number is required';
    if (!idFront) newErrors.idFront = 'Front ID is required';
    if (!idBack) newErrors.idBack = 'Back ID is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, idFront, idBack]);

  // ===== FILE UPLOAD TO SUPABASE =====
  const uploadFile = useCallback(async (file: File, userId: string, type: 'front' | 'back') => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${type}.${ext}`;
    const { error } = await supabase.storage.from('user-ids').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('user-ids').getPublicUrl(path);
    return data.publicUrl;
  }, []);

  // ===== SUBMIT =====
  const handleSubmit = useCallback(async () => {
    if (!validateStep2()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone
          }
        }
      });

      if (error || !data.user) {
        toast.error(error?.message || 'Signup failed');
        setLoading(false);
        return;
      }

      let idFrontUrl = '';
      let idBackUrl = '';
      if (idFront && idBack) {
        idFrontUrl = await uploadFile(idFront, data.user.id, 'front');
        idBackUrl = await uploadFile(idBack, data.user.id, 'back');
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        zip_code: formData.zipCode,
        nationality: formData.nationality,
        date_of_birth: formData.dateOfBirth,
        id_type: formData.idType,
        id_number: formData.idNumber,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        is_admin: false
      });

      if (profileError) {
        toast.error('Profile save failed: ' + profileError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      localStorage.removeItem('signupFormData');
      toast.success('Account created! Redirecting...');
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [formData, idFront, idBack, validateStep2, uploadFile]);

  const nextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const prevStep = () => setStep(1);

  // ===== PASSWORD STRENGTH =====
  const getPasswordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return 0;
    if (len < 6) return 1;
    if (len < 8) return 2;
    if (len < 12) return 3;
    return 4;
  };

  const passwordStrength = getPasswordStrength();

  // ===== STYLES =====
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

  // ===== SUCCESS VIEW =====
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl"
          role="alertdialog"
          aria-labelledby="success-title"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
          </motion.div>
          <motion.h1
            id="success-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-center mb-3"
          >
            Welcome aboard, {formData.firstName}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 text-center mb-8"
          >
            Your account has been successfully created.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-3.5 bg-white text-black font-semibold rounded-xl transition-all duration-300 hover:bg-white/90"
            onClick={() => (window.location.href = '/dashboard')}
          >
            Go to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ===== MAIN FORM =====
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-xl z-10"
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

          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <motion.span
                className={`text-sm font-medium transition-colors ${step === 1 ? 'text-white' : 'text-zinc-500'}`}
                animate={{ opacity: step === 1 ? 1 : 0.5 }}
              >
                Step 1: Account Basics
              </motion.span>
              <motion.span
                className={`text-sm font-medium transition-colors ${step === 2 ? 'text-white' : 'text-zinc-500'}`}
                animate={{ opacity: step === 2 ? 1 : 0.5 }}
              >
                Step 2: Verification
              </motion.span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: '50%' }}
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Name */}
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

                {/* Email */}
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

                {/* Phone */}
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

                {/* Password */}
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

                {/* Confirm Password */}
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
                  onClick={nextStep}
                  className="w-full mt-6 px-6 py-3.5 bg-white text-black font-semibold rounded-xl transition-all duration-300 hover:bg-white/90 flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* City & Address */}
                <div>
                  <label htmlFor="city" className={labelClass}>
                    <MapPin className="h-4 w-4" /> City
                  </label>
                  <input
                    id="city"
                    type="text"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('city')}
                    aria-required="true"
                  />
                  {errors.city && (
                    <p className={errorClass}>
                      <XCircle className="h-3 w-3" /> {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className={labelClass}>
                    <MapPin className="h-4 w-4" /> Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="123 Main Street, Apt 4B"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('address')}
                    aria-required="true"
                  />
                  {errors.address && (
                    <p className={errorClass}>
                      <XCircle className="h-3 w-3" /> {errors.address}
                    </p>
                  )}
                </div>

                {/* Zip & Nationality */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className={labelClass}>
                      <MapPin className="h-4 w-4" /> Zip Code
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      placeholder="12345"
                      value={formData.zipCode}
                      onChange={(e) => updateField('zipCode', e.target.value)}
                      onFocus={() => setFocusedField('zipCode')}
                      onBlur={() => setFocusedField('')}
                      className={inputClass('zipCode')}
                      aria-required="true"
                    />
                    {errors.zipCode && (
                      <p className={errorClass}>
                        <XCircle className="h-3 w-3" /> {errors.zipCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="nationality" className={labelClass}>
                      <Flag className="h-4 w-4" /> Nationality
                    </label>
                    <select
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => {
                        updateField('nationality', e.target.value);
                        updateField('idType', '');
                      }}
                      onFocus={() => setFocusedField('nationality')}
                      onBlur={() => setFocusedField('')}
                      className={inputClass('nationality')}
                      aria-required="true"
                    >
                      <option value="">Select</option>
                      {NATIONALITIES.map((nat) => (
                        <option key={nat} value={nat} className="bg-zinc-900">
                          {nat}
                        </option>
                      ))}
                    </select>
                    {errors.nationality && (
                      <p className={errorClass}>
                        <XCircle className="h-3 w-3" /> {errors.nationality}
                      </p>
                    )}
                  </div>
                </div>

                {/* DOB */}
                <div>
                  <label htmlFor="dateOfBirth" className={labelClass}>
                    <Calendar className="h-4 w-4" /> Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    onFocus={() => setFocusedField('dateOfBirth')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('dateOfBirth')}
                    aria-required="true"
                  />
                  {errors.dateOfBirth && (
                    <p className={errorClass}>
                      <XCircle className="h-3 w-3" /> {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                {/* ID Type & Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="idType" className={labelClass}>
                      <IdCard className="h-4 w-4" /> ID Type
                    </label>
                    <select
                      id="idType"
                      value={formData.idType}
                      onChange={(e) => updateField('idType', e.target.value)}
                      onFocus={() => setFocusedField('idType')}
                      onBlur={() => setFocusedField('')}
                      className={inputClass('idType')}
                      disabled={!formData.nationality}
                      aria-required="true"
                    >
                      <option value="">Select</option>
                      {(formData.nationality === 'Indian'
                        ? ID_TYPES.Indian
                        : ID_TYPES.default
                      ).map((type) => (
                        <option key={type} value={type} className="bg-zinc-900">
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.idType && (
                      <p className={errorClass}>
                        <XCircle className="h-3 w-3" /> {errors.idType}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="idNumber" className={labelClass}>
                      <IdCard className="h-4 w-4" /> ID Number
                    </label>
                    <input
                      id="idNumber"
                      type="text"
                      placeholder="ID Number"
                      value={formData.idNumber}
                      onChange={(e) => updateField('idNumber', e.target.value)}
                      onFocus={() => setFocusedField('idNumber')}
                      onBlur={() => setFocusedField('')}
                      className={inputClass('idNumber')}
                      aria-required="true"
                    />
                    {errors.idNumber && (
                      <p className={errorClass}>
                        <XCircle className="h-3 w-3" /> {errors.idNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* ID Uploads */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="idFront" className={labelClass}>
                      <Upload className="h-4 w-4" /> ID Front
                    </label>
                    <div className="relative">
                      <input
                        id="idFront"
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'front')}
                        className="hidden"
                        aria-required="true"
                      />
                      <label
                        htmlFor="idFront"
                        className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          errors.idFront
                            ? 'border-red-500/50 bg-red-500/5'
                            : idFrontPreview
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {idFrontPreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={idFrontPreview}
                              alt="ID Front"
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <Upload className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                            <span className="text-xs text-zinc-400">Upload Front</span>
                          </>
                        )}
                      </label>
                    </div>
                    {errors.idFront && (
                      <p className={errorClass}>
                        <XCircle className="h-3 w-3" /> {errors.idFront}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="idBack" className={labelClass}>
                      <Upload className="h-4 w-4" /> ID Back
                    </label>
                    <div className="relative">
                      <input
                        id="idBack"
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'back')}
                        className="hidden"
                        aria-required="true"
                      />
                      <label
                        htmlFor="idBack"
                        className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          errors.idBack
                            ? 'border-red-500/50 bg-red-500/5'
                            : idBackPreview
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {idBackPreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={idBackPreview}
                              alt="ID Back"
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <Upload className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                            <span className="text-xs text-zinc-400">Upload Back</span>
                          </>
                        )}
                      </label>
                    </div>
                    {errors.idBack && (
                      <p className={errorClass}>
                        <XCircle className="h-3 w-3" /> {errors.idBack}
                      </p>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={prevStep}
                    className="px-6 py-3.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/20 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-6 py-3.5 bg-white text-black font-semibold rounded-xl transition-all duration-300 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account <Check className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-center text-zinc-400 flex items-center justify-center gap-2 mb-4">
              <Lock className="h-3 w-3" /> Your information is securely encrypted and never shared.
            </p>
            <p className="text-sm text-center text-zinc-400">
              Already have an account?{' '}
              <a
                href="/auth/login"
                className="text-white hover:underline font-medium transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Fonts & Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * {
          font-family: 'Inter', sans-serif;
        }
        input[type='date']::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }
      `}</style>
    </div>
  );
}