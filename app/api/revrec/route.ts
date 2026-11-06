import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { releasePeriod } from '@/lib/revrec/engine';

// GET /api/revrec?project_id=xxx  — deferred + recognised summary
export async function GET(req: NextRequest) {
  const sb = createServiceClient();
  const projectId = new URL(req.url).searchParams.get('project_id');

  let query = sb
    .from('revrec_schedule')
    .select(`
      *,
      deferred_revenue(deferred_amount, remaining_amount, pob_type, recognition_method),
      individuals(fundproj_id, first_name, last_name)
    `)
    .order('period_start', { ascending: true });

  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/revrec — release a schedule entry
export async function POST(req: NextRequest) {
  const { schedule_entry_id, released_by } = await req.json();

  if (!schedule_entry_id || !released_by) {
    return NextResponse.json({ error: 'schedule_entry_id and released_by required' }, { status: 400 });
  }

  const result = await releasePeriod(schedule_entry_id, released_by);
  if (!result) {
    return NextResponse.json({ error: 'Entry not found or already released' }, { status: 404 });
  }

  return NextResponse.json(result);
}
