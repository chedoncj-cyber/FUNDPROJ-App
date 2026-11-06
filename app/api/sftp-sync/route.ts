import { NextRequest, NextResponse } from 'next/server';
import { runSFTPSync } from '@/jobs/sftp-sync';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Verify cron secret for manual / API triggers
  const auth = req.headers.get('authorization');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (!isVercelCron && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const triggeredBy = isVercelCron ? 'cron' : 'manual';

  try {
    const result = await runSFTPSync(triggeredBy);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: 'failed', error: msg }, { status: 500 });
  }
}
