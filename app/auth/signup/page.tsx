'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, Eye, EyeOff, CheckCircle2, XCircle, Mail, Lock, User, ArrowRight, MapPin, Calendar, Flag, IdCard, Upload, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Define interface for errors state
interface Errors {
  firstName?: string;
  lastName?: string;
  emailOrPhone?: string;
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

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState(localStorage.getItem('signup_firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('signup_lastName') || '');
  const [emailOrPhone, setEmailOrPhone] = useState(localStorage.getItem('signup_emailOrPhone') || '');
  const [address, setAddress] = useState(localStorage.getItem('signup_address') || '');
  const [zipCode, setZipCode] = useState(localStorage.getItem('signup_zipCode') || '');
  const [nationality, setNationality] = useState(localStorage.getItem('signup_nationality') || '');
  const [dateOfBirth, setDateOfBirth] = useState(localStorage.getItem('signup_dateOfBirth') || '');
  const [idType, setIdType] = useState(localStorage.getItem('signup_idType') || '');
  const [idNumber, setIdNumber] = useState(localStorage.getItem('signup_idNumber') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);

  const nationalities = ['Indian', 'American', 'British', 'Canadian', 'Other'];
  const idTypes = {
    Indian: ['National ID', 'Driving License', 'Passport', 'Residence Permit', 'Voter ID'],
    default: ['Passport', 'National ID', 'Driving License']
  };

  useEffect(() => {
    firstNameRef.current?.focus();
    return () => {
      localStorage.setItem('signup_firstName', firstName);
      localStorage.setItem('signup_lastName', lastName);
      localStorage.setItem('signup_emailOrPhone', emailOrPhone);
      localStorage.setItem('signup_address', address);
      localStorage.setItem('signup_zipCode', zipCode);
      localStorage.setItem('signup_nationality', nationality);
      localStorage.setItem('signup_dateOfBirth', dateOfBirth);
      localStorage.setItem('signup_idType', idType);
      localStorage.setItem('signup_idNumber', idNumber);
    };
  }, [firstName, lastName, emailOrPhone, address, zipCode, nationality, dateOfBirth, idType, idNumber]);

  const validateStep1 = () => {
    const newErrors: Errors = {};
    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';
    if (!emailOrPhone) newErrors.emailOrPhone = 'Email or phone is required';
    if (emailOrPhone.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone)) {
      newErrors.emailOrPhone = 'Invalid email format';
    }
    if (!password) newErrors.password = 'Password is required';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Errors = {};
    if (!address) newErrors.address = 'Address is required';
    if (!zipCode) newErrors.zipCode = 'Zip code is required';
    if (!nationality) newErrors.nationality = 'Nationality is required';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!idType) newErrors.idType = 'ID type is required';
    if (!idNumber) newErrors.idNumber = 'ID number is required';
    if (!idFront) newErrors.idFront = 'Front ID image is required';
    if (!idBack) newErrors.idBack = 'Back ID image is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File, userId: string, type: 'front' | 'back') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${type}.${fileExt}`;
    const { error } = await supabase.storage.from('user-ids').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('user-ids').getPublicUrl(fileName).data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: emailOrPhone.includes('@') ? emailOrPhone as string : undefined,
      phone: !emailOrPhone.includes('@') ? emailOrPhone as string : undefined,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          address,
          zip_code: zipCode,
          nationality,
          date_of_birth: dateOfBirth,
          id_type: idType,
          id_number: idNumber
        }
      }
    });

    if (error || !data.user) {
      alert(error?.message || 'User creation failed.');
      setLoading(false);
      return;
    }

    let idFrontUrl = '';
    let idBackUrl = '';
    try {
      if (idFront && idBack) {
        idFrontUrl = await uploadFile(idFront, data.user.id, 'front');
        idBackUrl = await uploadFile(idBack, data.user.id, 'back');
      }
    } catch (error) {
      alert('Failed to upload ID images.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email_or_phone: emailOrPhone,
        address,
        zip_code: zipCode,
        nationality,
        date_of_birth: dateOfBirth,
        id_type: idType,
        id_number: idNumber,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl
      }]);

    if (profileError) {
      alert(profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
    localStorage.removeItem('signup_firstName');
    localStorage.removeItem('signup_lastName');
    localStorage.removeItem('signup_emailOrPhone');
    localStorage.removeItem('signup_address');
    localStorage.removeItem('signup_zipCode');
    localStorage.removeItem('signup_nationality');
    localStorage.removeItem('signup_dateOfBirth');
    localStorage.removeItem('signup_idType');
    localStorage.removeItem('signup_idNumber');
  };

  const nextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const prevStep = () => setStep(1);

  const inputClass = (field: keyof Errors) => 
    `w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none transition-all duration-300 font-inter ${errors[field] ? 'border-red-500/50' : focusedField === field ? 'border-indigo-400/50 shadow-lg shadow-indigo-400/20' : field in errors ? 'border-white/20' : 'border-zinc-700/50'}`;

  const labelClass = 'text-sm font-medium text-zinc-300 flex items-center gap-2 font-inter';
  const errorClass = 'text-red-400 text-xs flex items-center gap-1 mt-1 animate-slide-down';

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <CheckCircle2 className="h-16 w-16 text-indigo-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-center mb-4 font-inter">Welcome aboard, {firstName}!</h1>
          <p className="text-zinc-400 text-center font-inter">Your account has been successfully created.</p>
          <Link href="/dashboard" className="mt-6 block text-center text-indigo-400 hover:text-indigo-300 transition-colors font-inter">
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden font-inter">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg z-10"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <TrendingUp className="h-8 w-8 text-indigo-400 animate-pulse" />
            <span className="text-2xl font-bold">
              EquityEdge<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ai</span>
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className={`text-sm font-medium ${step === 1 ? 'text-indigo-400' : 'text-zinc-400'}`}>Step 1: Account Basics</span>
              <span className={`text-sm font-medium ${step === 2 ? 'text-indigo-400' : 'text-zinc-400'}`}>Step 2: Verification</span>
            </div>
            <div className="h-1 bg-zinc-700 rounded-full">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                initial={{ width: '50%' }}
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label htmlFor="firstName" className={labelClass}>
                    <User className="h-4 w-4" /> First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField('')}
                    ref={firstNameRef}
                    className={inputClass('firstName')}
                  />
                  {errors.firstName && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className={labelClass}>
                    <User className="h-4 w-4" /> Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('lastName')}
                  />
                  {errors.lastName && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.lastName}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="emailOrPhone" className={labelClass}>
                    <Mail className="h-4 w-4" /> Email or Phone
                  </label>
                  <input
                    id="emailOrPhone"
                    type="text"
                    placeholder="your@email.com or +1234567890"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    onFocus={() => setFocusedField('emailOrPhone')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('emailOrPhone')}
                  />
                  {errors.emailOrPhone && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.emailOrPhone}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className={labelClass}>
                    <Lock className="h-4 w-4" /> Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className={`${inputClass('password')} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.password}</p>}
                  {password && !errors.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${password.length >= i * 2 ? 'bg-indigo-400' : 'bg-zinc-700'}`} />
                        ))}
                      </div>
                      <p className="text-zinc-400 text-xs font-inter">Strong password</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className={labelClass}>
                    <Lock className="h-4 w-4" /> Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      className={`${inputClass('confirmPassword')} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.confirmPassword}</p>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 font-inter"
                >
                  Next Step <ArrowRight className="h-4 w-4 inline ml-2" />
                </motion.button>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label htmlFor="address" className={labelClass}>
                    <MapPin className="h-4 w-4" /> Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('address')}
                  />
                  {errors.address && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.address}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="zipCode" className={labelClass}>
                    <MapPin className="h-4 w-4" /> Zip/Postal Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    placeholder="12345"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onFocus={() => setFocusedField('zipCode')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('zipCode')}
                  />
                  {errors.zipCode && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.zipCode}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="nationality" className={labelClass}>
                    <Flag className="h-4 w-4" /> Nationality
                  </label>
                  <select
                    id="nationality"
                    value={nationality}
                    onChange={(e) => { setNationality(e.target.value); setIdType(''); }}
                    onFocus={() => setFocusedField('nationality')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('nationality')}
                  >
                    <option value="">Select Nationality</option>
                    {nationalities.map((nat) => (
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
                  {errors.nationality && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.nationality}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="dateOfBirth" className={labelClass}>
                    <Calendar className="h-4 w-4" /> Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    onFocus={() => setFocusedField('dateOfBirth')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('dateOfBirth')}
                  />
                  {errors.dateOfBirth && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.dateOfBirth}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="idType" className={labelClass}>
                    <IdCard className="h-4 w-4" /> ID Type
                  </label>
                  <select
                    id="idType"
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    onFocus={() => setFocusedField('idType')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('idType')}
                  >
                    <option value="">Select ID Type</option>
                    {(nationality === 'Indian' ? idTypes.Indian : idTypes.default).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.idType && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.idType}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="idNumber" className={labelClass}>
                    <IdCard className="h-4 w-4" /> ID Number
                  </label>
                  <input
                    id="idNumber"
                    type="text"
                    placeholder="ID Number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    onFocus={() => setFocusedField('idNumber')}
                    onBlur={() => setFocusedField('')}
                    className={inputClass('idNumber')}
                  />
                  {errors.idNumber && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.idNumber}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="idFront" className={labelClass}>
                    <Upload className="h-4 w-4" /> ID Front Image
                  </label>
                  <input
                    id="idFront"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIdFront(e.target.files?.[0] || null)}
                    className={inputClass('idFront')}
                  />
                  {errors.idFront && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.idFront}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="idBack" className={labelClass}>
                    <Upload className="h-4 w-4" /> ID Back Image
                  </label>
                  <input
                    id="idBack"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIdBack(e.target.files?.[0] || null)}
                    className={inputClass('idBack')}
                  />
                  {errors.idBack && <p className={errorClass}><XCircle className="h-3 w-3" />{errors.idBack}</p>}
                </div>
                <div className="flex justify-between mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={prevStep}
                    className="px-6 py-3 bg-zinc-700 text-white font-semibold rounded-xl transition-all duration-300 font-inter"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account <Check className="h-4 w-4 inline ml-2" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm text-center text-zinc-400 mt-6 flex items-center justify-center gap-2 font-inter">
            <Lock className="h-4 w-4" /> Your information is securely encrypted and never shared.
          </p>
          <p className="text-sm text-center text-zinc-400 mt-4 font-inter">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes slide-down { 0% { transform: translateY(-5px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animate-slide-down { animation: slide-down 0.3s ease forwards; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}