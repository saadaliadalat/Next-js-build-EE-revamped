import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin, logAdminAction } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from('deposits')
    .select('*, users:user_id (email, full_name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deposits: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { depositId, status, reason } = await request.json();

  const { data, error } = await supabaseAdmin
    .from('deposits')
    .update({
      status,
      rejection_reason: reason,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      approved_by: auth.user!.id
    })
    .eq('id', depositId)
    .select('user_id, amount')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update balance if approved (trigger should handle this, but double-check)
  if (status === 'approved') {
    await supabaseAdmin.rpc('increment_balance', {
      p_user_id: data.user_id,
      p_amount: parseFloat(data.amount)
    });
  }

  await logAdminAction(auth.user!.id, 'approve_deposit', data.user_id, { depositId, status, amount: data.amount });

  return NextResponse.json({ success: true });
}