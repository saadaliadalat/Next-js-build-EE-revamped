"use client"
import { useState } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  User,
  MapPin,
  Camera,
  ArrowLeft,
} from 'lucide-react';

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState('not-submitted');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: 'Ahmed Hassan',
    email: 'ahmed@example.com',
    dateOfBirth: '',
    nationality: 'Pakistani',
    address: '',
    city: 'Rawalpindi',
    state: 'Punjab',
    zipCode: '',
    idFile: null as File | null,
    addressFile: null as File | null,
    selfieFile: null as File | null,
  });

  const [uploadProgress, setUploadProgress] = useState({
    id: false,
    address: false,
    selfie: false,
  });

  const handleFileSelect = (type: string, file: File | null) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.idFile || !formData.addressFile || !formData.selfieFile) {
      alert('Please upload all required documents');
      setSubmitting(false);
      return;
    }

    setTimeout(() => {
      setKycStatus('pending');
      setSubmitting(false);
      setFormData({
        fullName: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        dateOfBirth: '',
        nationality: 'Pakistani',
        address: '',
        city: 'Rawalpindi',
        state: 'Punjab',
        zipCode: '',
        idFile: null,
        addressFile: null,
        selfieFile: null,
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button className="p-2 hover:bg-zinc-900 rounded-lg transition">
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

        {kycStatus === 'approved' && (
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">KYC Verification Complete! 🎉</h3>
            <p className="text-zinc-400 mb-6">Your account is fully verified.</p>
            <button className="px-6 py-3 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-600">
              Back to Dashboard
            </button>
          </div>
        )}

        {(kycStatus === 'not-submitted' || kycStatus === 'pending') && (
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
                        onChange={(e) => handleFileSelect('id', e.target.files?.[0] || null)}
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
                        onChange={(e) => handleFileSelect('address', e.target.files?.[0] || null)}
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
                        onChange={(e) => handleFileSelect('selfie', e.target.files?.[0] || null)}
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