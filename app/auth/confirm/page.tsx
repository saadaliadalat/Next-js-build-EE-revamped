'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, TrendingUp } from 'lucide-react';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get token_hash and type from URL
        const token_hash = searchParams?.get('token_hash');
        const type = searchParams?.get('type');

        console.log('Confirmation attempt:', { token_hash: !!token_hash, type });

        // If no token_hash, this might be a direct visit or already confirmed
        if (!token_hash || !type) {
          setStatus('error');
          setMessage('Invalid confirmation link. Please try signing in or request a new confirmation email.');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // Verify the OTP token to confirm email
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as 'signup' | 'email',
        });

        if (error) {
          console.error('Confirmation error:', error);
          
          // Check for specific error types
          if (error.message.includes('expired')) {
            setStatus('error');
            setMessage('This confirmation link has expired. Please request a new one.');
          } else if (error.message.includes('already been used')) {
            setStatus('success');
            setMessage('Email already confirmed! Redirecting to sign in...');
          } else {
            setStatus('error');
            setMessage('Invalid or expired confirmation link. Please try again or contact support.');
          }
          
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // Success!
        console.log('Email confirmation successful:', data);
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to sign in...');
        
        // Redirect to login after 2 seconds
        setTimeout(() => router.push('/auth/login'), 2000);
        
      } catch (err) {
        console.error('Unexpected error during confirmation:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    confirmEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <motion.div
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.015),transparent_70%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-white/10 via-zinc-900/20 to-white/10 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
          <div className="relative bg-gradient-to-br from-white/[0.05] via-zinc-900/[0.03] to-white/[0.01] backdrop-blur-xl rounded-2xl border border-zinc-900/40 shadow-2xl p-8">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              <TrendingUp className="h-8 w-8 text-gray-100" />
              <span className="text-2xl font-bold text-white">
                EquityEdge<span className="text-gray-200">ai</span>
              </span>
            </div>

            {/* Status Icon */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              {status === 'loading' && (
                <Loader2 className="h-16 w-16 animate-spin text-white" />
              )}
              {status === 'success' && (
                <motion.div 
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/50"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div 
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/50"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <XCircle className="h-12 w-12 text-white" />
                </motion.div>
              )}
            </motion.div>

            {/* Status Text */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center mb-3 text-white"
            >
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-zinc-400 text-center"
            >
              {message}
            </motion.p>

            {/* Manual redirect button for errors */}
            {status === 'error' && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => router.push('/auth/login')}
                className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-950 text-gray-100 font-semibold rounded-xl transition-all duration-300"
              >
                Go to Sign In
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}