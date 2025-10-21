"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Flag, Calendar, IdCard, Search, Sliders } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email_or_phone: string;
  address: string;
  zip_code: string;
  nationality: string;
  date_of_birth: string;
  id_type: string;
  id_number: string;
  id_front_url: string | null;
  id_back_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCMS() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (!profile?.is_admin) {
        router.push('/unauthorized');
        return;
      }
      setIsAuthenticated(true);
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchProfiles() {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }
      setProfiles(data || []);
      setLoading(false);
    }
    fetchProfiles();

    // Real-time subscription for new profiles
    const subscription = supabase
      .channel('profiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
        setProfiles(prev => [...prev, payload.new as Profile]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated]);

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.email_or_phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent_70%)]" style={{ zIndex: 0 }} />

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-zinc-900/50 to-black border-r border-white/10 transition-all duration-300`}>
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                {sidebarOpen && <span className="font-bold text-lg">Equity Edge Ai Admin</span>}
              </div>
            </div>
          </div>
          <nav className="p-4 space-y-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
              title="User Profiles"
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">User Profiles</span>}
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="border-b border-white/10 bg-gradient-to-r from-zinc-900/50 to-black backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <Sliders className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500/50 w-64"
                  />
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                  A
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">User Profiles</h1>
              <div className="grid gap-6">
                {filteredProfiles.length === 0 && (
                  <p className="text-center text-zinc-400">No profiles found.</p>
                )}
                {filteredProfiles.map(profile => (
                  <div key={profile.id} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur border border-white/10 rounded-lg p-6 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4" />
                          <span className="font-semibold">Name:</span> {profile.full_name}
                        </p>
                        <p className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4" />
                          <span className="font-semibold">Email/Phone:</span> {profile.email_or_phone}
                        </p>
                        <p className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-semibold">Address:</span> {profile.address}, {profile.zip_code}
                        </p>
                        <p className="flex items-center gap-2 mb-2">
                          <Flag className="h-4 w-4" />
                          <span className="font-semibold">Nationality:</span> {profile.nationality}
                        </p>
                        <p className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-semibold">Date of Birth:</span> {profile.date_of_birth}
                        </p>
                        <p className="flex items-center gap-2 mb-2">
                          <IdCard className="h-4 w-4" />
                          <span className="font-semibold">ID Type:</span> {profile.id_type}
                        </p>
                        <p className="flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          <span className="font-semibold">ID Number:</span> {profile.id_number}
                        </p>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="font-semibold mb-2">ID Front:</p>
                          {profile.id_front_url ? (
                            <img src={profile.id_front_url} alt="ID Front" className="w-full max-w-xs h-40 object-cover rounded-lg" />
                          ) : (
                            <p className="text-zinc-400">No image uploaded</p>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold mb-2">ID Back:</p>
                          {profile.id_back_url ? (
                            <img src={profile.id_back_url} alt="ID Back" className="w-full max-w-xs h-40 object-cover rounded-lg" />
                          ) : (
                            <p className="text-zinc-400">No image uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}