import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { nanoid } from 'crypto';

export async function GET(req: NextRequest) {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('projects')
    .select('*, project_funding_summary(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sb = createServiceClient();
  const body = await req.json();

  // Auto-generate project_code if not provided
  const projectCode = body.project_code
    ?? `PROJ-${body.project_type?.toUpperCase() ?? 'CUSTOM'}-${nanoid(6).toUpperCase()}`;

  const { data, error } = await sb
    .from('projects')
    .insert({
      project_code:  projectCode,
      name:          body.name,
      description:   body.description,
      project_type:  body.project_type ?? 'custom',
      target_amount: body.target_amount,
      currency:      body.currency ?? 'GBP',
      start_date:    body.start_date,
      end_date:      body.end_date,
      visibility:    body.visibility ?? 'private',
      owner_id:      body.owner_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Seed an empty funding summary row
  await sb.from('project_funding_summary').insert({
    project_id: data.id,
    total_raised: 0,
    total_members: 0,
    deferred_balance: 0,
    recognised_revenue: 0,
  });

  return NextResponse.json(data, { status: 201 });
}
