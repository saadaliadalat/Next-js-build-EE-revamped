import { supabaseAdmin } from './supabase-admin';
import { NextRequest } from 'next/server';

export async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { error: 'No authorization header', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user) {
    return { error: 'Invalid token', status: 401 };
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.is_admin) {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { user, status: 200 };
}

export async function logAdminAction(adminId: string, action: string, targetUserId?: string, details?: any, ipAddress?: string) {
  await supabaseAdmin.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    details,
    ip_address: ipAddress
  });
}