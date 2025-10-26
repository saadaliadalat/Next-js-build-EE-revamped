'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  is_approved: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isSubscribed = true;

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isSubscribed) return;

      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isSubscribed) return;

      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Debug: Let's see what's actually in this error
      if (error) {
        console.log('🔍 DEBUG - Error object:', JSON.stringify(error, null, 2));
        console.log('🔍 DEBUG - Error keys:', Object.keys(error));
        console.log('🔍 DEBUG - Error code:', error.code);
        console.log('🔍 DEBUG - Error message:', error.message);
        console.log('🔍 DEBUG - Error details:', error.details);
      }

      if (data) {
        console.log('✅ Profile fetched successfully:', data);
        setProfile(data);
      } else if (retries > 0) {
        console.log(`⏳ Profile not found, retrying... (${retries} attempts left)`);
        setTimeout(() => fetchProfile(userId, retries - 1), 500);
        return;
      } else {
        console.log('❌ Profile not found after all retries');
        setProfile(null);
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching profile:', error);
      setProfile(null);
    } finally {
      if (retries === 0 || retries === 3) {
        setLoading(false);
      }
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) throw error;
    
    // Note: User profile and wallet are automatically created by database trigger
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}