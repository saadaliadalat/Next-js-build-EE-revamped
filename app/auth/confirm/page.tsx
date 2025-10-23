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
    const handleEmailConfirmation = async () => {
      try {
        // Check for error in URL params
        const error = searchParams?.get('error') || null;
        const errorDescription = searchParams?.get('error_description') || null;
        
        if (error) {
          console.error('Email confirmation error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Email verification failed. Please try again.');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        // Get the current session - Supabase automatically handles token exchange
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('Verification failed. Please try signing in.');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        if (session && session.user) {
          // User is confirmed and signed in!
          console.log('User confirmed and signed in:', session.user.email);
          setStatus('success');
          setMessage('Email verified! Redirecting to dashboard...');
          
          // Sign out first, then redirect to login (so they can sign in fresh)
          await supabase.auth.signOut();
          setTimeout(() => router.push('/auth/login'), 2000);
        } else {
          // No session - might already be confirmed
          setStatus('success');
          setMessage('Email confirmed! Please sign in to continue.');
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try signing in.');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    // Small delay to ensure URL params are loaded
    const timer = setTimeout(() => {
      handleEmailConfirmation();
    }, 500);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl"
        role="alertdialog"
        aria-labelledby="confirm-title"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          className="flex justify-center mb-6"
        >
          {status === 'loading' && <Loader2 className="h-12 w-12 text-white animate-spin" />}
          {status === 'success' && (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-white" />
            </div>
          )}
        </motion.div>
        <motion.h1
          id="confirm-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center mb-3"
        >
          {status === 'loading' && 'Verifying Your Email'}
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
        {status === 'error' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 px-6 py-3.5 bg-white text-black font-semibold rounded-xl transition-all duration-300 hover:bg-white/90"
            onClick={() => router.push('/auth/login')}
          >
            Go to Sign In
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}