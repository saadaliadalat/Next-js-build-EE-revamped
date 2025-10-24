'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in. Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.015),transparent_70%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{ zIndex: 0 }}
      />
      <div
        className="fixed inset-0 opacity-5"
        style={{
          zIndex: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md z-20"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-white/10 via-zinc-900/20 to-white/10 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-gradient" />
          <div className="relative p-4 md:p-6 rounded-xl bg-gradient-to-br from-white/[0.05] via-zinc-900/[0.03] to-white/[0.01] backdrop-blur-md border border-zinc-900/40 shadow-xl">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TrendingUp className="h-8 w-8 text-gray-100" />
              </motion.div>
              <span className="text-2xl font-bold text-white">
                EquityEdge<span className="text-gray-200 animate-gradient-text">ai</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white text-center mb-2">Sign In</h1>
            <p className="text-zinc-500 text-center mb-6">Access your trading account</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-500">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  ref={emailRef}
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className="bg-zinc-950/60 border-zinc-900/70 text-white placeholder:text-zinc-600 focus:border-gray-100/50"
                />
                <AnimatePresence>
                  {emailError && (
                    <motion.p
                      id="email-error"
                      className="text-red-400 text-xs"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {emailError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-500">
                    Password
                  </Label>
                  <Link
                    href="/auth/reset"
                    className="text-xs text-zinc-500 hover:text-gray-200 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  aria-invalid={passwordError ? 'true' : 'false'}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className="bg-zinc-950/60 border-zinc-900/70 text-white placeholder:text-zinc-600 focus:border-gray-100/50"
                />
                <AnimatePresence>
                  {passwordError && (
                    <motion.p
                      id="password-error"
                      className="text-red-400 text-xs"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {passwordError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-950 text-gray-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              <p className="text-sm text-center text-zinc-500 mt-4">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-gray-200 hover:text-gray-100 hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .pulse:not(:disabled) {
          animation: pulse 2s infinite;
        }
        .animate-gradient-text {
          background: linear-gradient(90deg, #ffffff, #e5e7eb, #ffffff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  );
}