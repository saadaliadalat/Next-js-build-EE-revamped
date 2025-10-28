'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Upload, CheckCircle2, AlertCircle, Loader2, FileText,
  User, MapPin, Camera, ArrowLeft
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  kyc_status?: string;
}

interface KycData {
  status: string;
  rejection_reason?: string;
  id?: string;
}

interface FormData {
  fullName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  idFile: File | null;
  addressFile: File | null;
  selfieFile: File | null;
}

export default function KYCPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [kycStatus, setKycStatus] = useState('not-submitted');
  const [existingKyc, setExistingKyc] = useState<KycData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    idFile: null,
    addressFile: null,
    selfieFile: null,
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/auth/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    setUser({ 
      id: authUser.id,
      email: authUser.email || '',
      ...userData 
    });
    
    setFormData(prev => ({
      ...prev,
      fullName: userData?.full_name || '',
      email: authUser.email || ''
    }));

    // Check existing KYC
    const { data: kycData } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (kycData) {
      setKycStatus(kycData.status);
      setExistingKyc(kycData);
    }

    setLoading(false);
  }

  function handleFileSelect(type: 'id' | 'address' | 'selfie', file: File | null | undefined) {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB)');
      return;
    }

    if (type === 'id') {
      setFormData(prev => ({ ...prev, idFile: file }));
    } else if (type === 'address') {
      setFormData(prev => ({ ...prev, addressFile: file }));
    } else if (type === 'selfie') {
      setFormData(prev => ({ ...prev, selfieFile: file }));
    }
  }

  async function handleSubmit() {
    if (!user) {
      alert('User not found');
      return;
    }

    if (!formData.fullName || !formData.dateOfBirth || !formData.nationality || !formData.address || !formData.city || !formData.zipCode) {
      alert('Please fill all required fields');
      return;
    }

    if (!formData.idFile || !formData.addressFile || !formData.selfieFile) {
      alert('Please upload all required documents');
      return;
    }

    setSubmitting(true);

    try {
      // Upload ID document
      const idExt = formData.idFile.name.split('.').pop();
      const idFileName = `${user.id}/id-${Date.now()}.${idExt}`;
      const { error: idError } = await supabase.storage
        .from('kyc-documents')
        .upload(idFileName, formData.idFile);
      if (idError) throw idError;

      // Upload address proof
      const addressExt = formData.addressFile.name.split('.').pop();
      const addressFileName = `${user.id}/address-${Date.now()}.${addressExt}`;
      const { error: addressError } = await supabase.storage
        .from('kyc-documents')
        .upload(addressFileName, formData.addressFile);
      if (addressError) throw addressError;

      // Upload selfie
      const selfieExt = formData.selfieFile.name.split('.').pop();
      const selfieFileName = `${user.id}/selfie-${Date.now()}.${selfieExt}`;
      const { error: selfieError } = await supabase.storage
        .from('kyc-documents')
        .upload(selfieFileName, formData.selfieFile);
      if (selfieError) throw selfieError;

      // Create KYC submission
      const { error: kycError } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          email: formData.email,
          date_of_birth: formData.dateOfBirth,
          nationality: formData.nationality,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          id_document_url: idFileName,
          address_proof_url: addressFileName,
          selfie_url: selfieFileName,
          status: 'pending'
        });

      if (kycError) throw kycError;

      // Update user KYC status
      await supabase
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('id', user.id);

      alert('KYC submitted successfully! Awaiting admin review.');
      setKycStatus('pending');
      
      // Clear form
      setFormData({
        fullName: formData.fullName,
        email: formData.email,
        dateOfBirth: '',
        nationality: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        idFile: null,
        addressFile: null,
        selfieFile: null,
      });

    } catch (error) {
      const err = error as { message?: string };
      alert('Error: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (kycStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">KYC Verification Complete! 🎉</h3>
            <p className="text-zinc-400 mb-6">Your account is fully verified.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-zinc-900 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-4xl font-bold">KYC Verification</h1>
            <p className="text-zinc-400 mt-1">Complete your identity verification to unlock full trading access</p>
          </div>
        </div>

        {/* Status Banner */}
        {kycStatus === 'pending' && (
          <div className="rounded-xl p-6 mb-8 border bg-yellow-900/20 border-yellow-800/50 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-lg text-yellow-400">⏳ KYC Pending Review</p>
              <p className="text-sm text-zinc-300 mt-1">Your KYC submission is under review. This usually takes 24-48 hours.</p>
            </div>
          </div>
        )}

        {kycStatus === 'rejected' && (
          <div className="rounded-xl p-6 mb-8 border bg-red-900/20 border-red-800/50">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-lg text-red-400">❌ KYC Rejected</p>
                <p className="text-sm text-zinc-300 mt-1">
                  Your previous submission was rejected. Please resubmit with correct documents.
                </p>
                {existingKyc?.rejection_reason && (
                  <p className="text-sm text-red-300 mt-2 p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                    <strong>Reason:</strong> {existingKyc.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(kycStatus === 'not-submitted' || kycStatus === 'rejected') && (
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Nationality *</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" />
                Address Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Street Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">State/Province *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Postal Code *</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-400" />
                Document Upload
              </h2>

              <div className="space-y-6">
                {/* ID Document */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Government ID (Passport/National ID) *
                  </label>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-emerald-500 transition bg-zinc-800/30 hover:bg-zinc-800/50">
                      {formData.idFile ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">{formData.idFile.name}</span>
                        </div>
                      ) : (
                        <div>
                          <FileText className="h-10 w-10 mx-auto mb-2 text-zinc-400" />
                          <p className="text-sm text-zinc-300 font-semibold">Click to upload</p>
                          <p className="text-xs text-zinc-500 mt-1">JPG, PNG, PDF - Max 5MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileSelect('id', e.target.files?.[0])}
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>

                {/* Address Proof */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Proof (Utility Bill/Bank Statement) *
                  </label>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-emerald-500 transition bg-zinc-800/30 hover:bg-zinc-800/50">
                      {formData.addressFile ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">{formData.addressFile.name}</span>
                        </div>
                      ) : (
                        <div>
                          <FileText className="h-10 w-10 mx-auto mb-2 text-zinc-400" />
                          <p className="text-sm text-zinc-300 font-semibold">Click to upload</p>
                          <p className="text-xs text-zinc-500 mt-1">JPG, PNG, PDF - Max 5MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileSelect('address', e.target.files?.[0])}
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>

                {/* Selfie */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Selfie Holding Your ID *
                  </label>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-emerald-500 transition bg-zinc-800/30 hover:bg-zinc-800/50">
                      {formData.selfieFile ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">{formData.selfieFile.name}</span>
                        </div>
                      ) : (
                        <div>
                          <Camera className="h-10 w-10 mx-auto mb-2 text-zinc-400" />
                          <p className="text-sm text-zinc-300 font-semibold">Click to upload</p>
                          <p className="text-xs text-zinc-500 mt-1">JPG, PNG - Max 5MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect('selfie', e.target.files?.[0])}
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-zinc-300">
                <p className="font-semibold text-blue-400 mb-1">Privacy & Security</p>
                Your documents are encrypted and stored securely. We never share your information with third parties.
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full px-6 py-4 bg-emerald-500 text-black rounded-lg font-bold text-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting KYC...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Submit KYC Verification
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}