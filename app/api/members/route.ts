import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/members — alphabetical list (paginated)
export async function GET(req: NextRequest) {
  const sb = createServiceClient();
  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get('page')  ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '25');
  const q     = searchParams.get('q') ?? '';
  const from  = (page - 1) * limit;

  let query = sb
    .from('individuals')
    .select('*', { count: 'exact' })
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .range(from, from + limit - 1);

  if (q) {
    query = query.or(
      `last_name.ilike.%${q}%,first_name.ilike.%${q}%,email.ilike.%${q}%,fundproj_id.ilike.%${q}%`
    );
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count, page, limit });
}

// POST /api/members — create individual
export async function POST(req: NextRequest) {
  const sb = createServiceClient();
  const body = await req.json();

  const { data, error } = await sb
    .from('individuals')
    .insert({
      first_name: body.first_name,
      last_name:  body.last_name,
      email:      body.email,
      phone:      body.phone,
      role:       body.role ?? 'contributor',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
