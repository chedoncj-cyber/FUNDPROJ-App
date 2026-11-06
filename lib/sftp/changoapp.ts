import SftpClient from 'ssh2-sftp-client';
import { parse } from 'csv-parse/sync';
import type { ChangoappCSVRow } from '@/types';

export async function downloadChangoappCSV(dateStr?: string): Promise<ChangoappCSVRow[]> {
  const sftp = new SftpClient();

  const today = dateStr ?? new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `fundproj_payments_${today}.csv`;
  const remotePath = `${process.env.CHANGOAPP_SFTP_PATH ?? '/exports/fundproj/'}${fileName}`;

  try {
    await sftp.connect({
      host: process.env.CHANGOAPP_SFTP_HOST!,
      port: parseInt(process.env.CHANGOAPP_SFTP_PORT ?? '22'),
      username: process.env.CHANGOAPP_SFTP_USER!,
      password: process.env.CHANGOAPP_SFTP_PASSWORD!,
    });

    const buffer = await sftp.get(remotePath) as Buffer;
    const rows = parse(buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ChangoappCSVRow[];

    return rows;
  } finally {
    await sftp.end();
  }
}

// REST API fallback if SFTP file absent
export async function fetchChangoappViaAPI(dateStr: string): Promise<ChangoappCSVRow[]> {
  const from = `${dateStr}T00:00:00Z`;
  const to = `${dateStr}T23:59:59Z`;

  const res = await fetch(
    `https://api.changoapp.com/v1/transactions?from=${from}&to=${to}&project_ref=ALL`,
    {
      headers: { Authorization: `Bearer ${process.env.CHANGOAPP_API_KEY}` },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) throw new Error(`Changoapp API error: ${res.status}`);

  const json = await res.json();
  // Map API response shape to CSV row shape
  return (json.transactions ?? []).map((t: Record<string, unknown>) => ({
    member_ref:   t.member_ref as string,
    project_code: t.project_code as string,
    amount:       String(t.amount),
    currency:     t.currency as string,
    payment_date: t.payment_date as string,
    platform_ref: t.transaction_id as string,
    status:       t.status as string,
    notes:        '',
  }));
}
