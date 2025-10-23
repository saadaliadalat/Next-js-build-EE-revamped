'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if the reset link is valid
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        toast.error('Invalid or expired reset link.', { duration: 4000 });
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };
    checkSession();
  }, [router]);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully! Redirecting to login...', { duration: 4000 });
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl"
        role="form"
        aria-labelledby="reset-title"
      >
        <motion.h1
          id="reset-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center mb-6"
        >
          Reset Your Password
        </motion.h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" /> New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" /> Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30"
              placeholder="Confirm new password"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full px-6 py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}