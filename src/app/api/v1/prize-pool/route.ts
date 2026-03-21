import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { calculatePrizePool } from '@/lib/prize-engine';

export async function GET() {
  const supabase = await createClient();

  // Fetch active users globally
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active');

  const { data: lastDraw } = await supabase
    .from('draws')
    .select('rollover_amount')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const poolData = calculatePrizePool(count || 0, lastDraw?.rollover_amount || 0);

  return NextResponse.json({
    platform: "Digital Heroes Golf",
    version: "1.0.0",
    active_heroes: count,
    live_prize_pool: poolData.totalPool,
    currency: "USD"
  });
}