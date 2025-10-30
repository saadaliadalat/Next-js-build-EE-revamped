import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin, logAdminAction } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from('kyc_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { kycId, status, reason } = await request.json();

  const { data, error } = await supabaseAdmin
    .from('kyc_submissions')
    .update({
      status,
      rejection_reason: reason,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      approved_by: auth.user!.id
    })
    .eq('id', kycId)
    .select('user_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update user is_approved if KYC approved
  if (status === 'approved') {
    await supabaseAdmin
      .from('users')
      .update({ is_approved: true })
      .eq('id', data.user_id);
  }

  await logAdminAction(auth.user!.id, 'approve_kyc', data.user_id, { status, reason });

  return NextResponse.json({ success: true });
}