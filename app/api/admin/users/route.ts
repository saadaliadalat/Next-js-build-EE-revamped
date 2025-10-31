// app/api/admin/users/route.ts
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabaseAdmin = createRouteHandlerClient({ cookies });

  const { data: { user } } = await supabaseAdmin.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // This works because of RLS policy above
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data } = await supabaseAdmin
    .from('users')
    .select('*, balances(available_balance)')
    .order('created_at', { ascending: false });

  return Response.json({ users: data });
}