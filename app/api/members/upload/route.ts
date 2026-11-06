import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { parse } from 'csv-parse/sync';

// POST /api/members/upload — bulk CSV import
export async function POST(req: NextRequest) {
  const sb = createServiceClient();
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const text = await file.text();
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });

  const toInsert = rows.map((r: Record<string, string>) => ({
    first_name: r.first_name?.trim(),
    last_name:  r.last_name?.trim(),
    email:      r.email?.trim() || null,
    phone:      r.phone?.trim() || null,
    role:       r.role?.trim() || 'contributor',
  }));

  const { data, error } = await sb
    .from('individuals')
    .insert(toInsert)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    inserted: data.length,
    members: data.sort((a, b) =>
      a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
    ),
  }, { status: 201 });
}
