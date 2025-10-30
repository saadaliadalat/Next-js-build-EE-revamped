import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin, logAdminAction } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId, amount, type, reason } = await request.json();

  // Validate
  if (!userId || !amount || !type || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get current balance
  const { data: balanceData, error: balanceError } = await supabaseAdmin
    .from('balances')
    .select('available_balance')
    .eq('user_id', userId)
    .single();

  if (balanceError) return NextResponse.json({ error: balanceError.message }, { status: 500 });

  const newBalance = parseFloat(balanceData.available_balance) + parseFloat(amount);

  // Allow negative balances
  const { error: updateError } = await supabaseAdmin
    .from('balances')
    .update({ available_balance: newBalance })
    .eq('user_id', userId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Log adjustment
  await supabaseAdmin.from('balance_adjustments').insert({
    user_id: userId,
    amount: parseFloat(amount),
    type,
    reason,
    admin_id: auth.user!.id
  });

  await logAdminAction(auth.user!.id, 'adjust_balance', userId, { amount, type, reason, newBalance });

  return NextResponse.json({ success: true, newBalance });
}