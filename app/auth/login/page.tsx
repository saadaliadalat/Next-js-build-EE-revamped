'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Fetch user profile immediately after login
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        // If profile doesn't exist yet, redirect to dashboard by default
        toast.success('Welcome back!');
        router.push('/dashboard');
        return;
      }

      // Redirect based on role
      toast.success('Welcome back!');
      if (userData?.is_admin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_70%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <TrendingUp className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold">
              EquityEdge<span className="text-white/60">ai</span>
            </span>
          </div>

          <h2 className="text-xl font-bold text-center mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" /> Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                ref={emailRef}
                disabled={loading}
                className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-all disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4" /> Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-all disabled:opacity-50"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-6 py-3.5 bg-white text-black font-semibold rounded-xl transition-all duration-300 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-center text-zinc-400">
              Don't have an account?{' '}
              <a href="/auth/signup" className="text-white hover:underline font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}