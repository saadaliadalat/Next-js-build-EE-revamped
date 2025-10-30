import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin, logAdminAction } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  let query = supabaseAdmin
    .from('trades')
    .select('*, users:user_id (email, full_name)')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trades: data });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId, tradeType, symbol, quantity, entryPrice, exitPrice, profitLoss, status } = await request.json();

  const { data, error } = await supabaseAdmin
    .from('trades')
    .insert({
      user_id: userId,
      trade_type: tradeType,
      symbol,
      quantity: parseFloat(quantity),
      entry_price: parseFloat(entryPrice),
      exit_price: exitPrice ? parseFloat(exitPrice) : null,
      profit_loss: profitLoss ? parseFloat(profitLoss) : 0,
      status: status || 'open',
      closed_at: status === 'closed' ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If trade is closed with profit/loss, adjust balance
  if (status === 'closed' && profitLoss) {
    await supabaseAdmin.rpc('increment_balance', {
      p_user_id: userId,
      p_amount: parseFloat(profitLoss)
    });
  }

  await logAdminAction(auth.user!.id, 'create_trade', userId, { tradeType, symbol, quantity, profitLoss });

  return NextResponse.json({ trade: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { tradeId, exitPrice, profitLoss, status } = await request.json();

  const { data, error } = await supabaseAdmin
    .from('trades')
    .update({
      exit_price: exitPrice ? parseFloat(exitPrice) : null,
      profit_loss: profitLoss ? parseFloat(profitLoss) : null,
      status,
      closed_at: status === 'closed' ? new Date().toISOString() : null
    })
    .eq('id', tradeId)
    .select('user_id, profit_loss')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Adjust balance on close
  if (status === 'closed' && profitLoss) {
    await supabaseAdmin.rpc('increment_balance', {
      p_user_id: data.user_id,
      p_amount: parseFloat(profitLoss)
    });
  }

  await logAdminAction(auth.user!.id, 'close_trade', data.user_id, { tradeId, profitLoss });

  return NextResponse.json({ trade: data });
}