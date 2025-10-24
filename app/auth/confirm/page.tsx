'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!searchParams) return;

    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!token_hash || !type) {
      // No token? Just go to login (maybe already confirmed)
      setStatus('success');
      setMessage('Email confirmed! Please sign in.');
      setTimeout(() => router.push('/auth/login'), 2000);
      return;
    }

    // ✅ THIS CONFIRMS THE EMAIL IN SUPABASE
    const confirmEmail = async () => {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (error) {
        console.error('Confirmation failed:', error);
        setStatus('error');
        setMessage('Invalid or expired confirmation link.');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      setStatus('success');
      setMessage('Email verified! Redirecting to sign in...');
      setTimeout(() => router.push('/auth/login'), 2000);
    };

    confirmEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center"
      >
        <motion.div className="flex justify-center mb-6">
          {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-white" />}
          {status === 'success' && (
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-white" />
            </div>
          )}
        </motion.div>
        <h1 className="text-2xl font-bold mb-3">
          {status === 'loading' && 'Verifying...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>
        <p className="text-zinc-400">{message}</p>
      </motion.div>
    </div>
  );
}