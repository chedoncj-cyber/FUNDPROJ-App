/**
 * SFTP Sync Job — runs daily at 02:00 UTC via Vercel Cron
 * Downloads Changoapp.com payment CSV → upserts into payment_ledger
 */
import { createServiceClient } from '@/lib/supabase/server';
import { downloadChangoappCSV, fetchChangoappViaAPI } from '@/lib/sftp/changoapp';
import { normaliseChangoapp } from '@/lib/payments/normaliser';
import { generateRecognitionSchedule } from '@/lib/revrec/engine';
import type { SyncStatus } from '@/types';

export interface SyncResult {
  status: SyncStatus;
  downloaded: number;
  inserted: number;
  skipped: number;
  unmatched: number;
  errorMessage?: string;
}

export async function runSFTPSync(triggeredBy: 'cron' | 'manual' | 'api' = 'cron'): Promise<SyncResult> {
  const sb = createServiceClient();
  const today = new Date().toISOString().split('T')[0];
  const dateKey = today.replace(/-/g, '');

  // Create sync log
  const { data: logEntry } = await sb
    .from('sftp_sync_log')
    .insert({ platform: 'changoapp', triggered_by: triggeredBy })
    .select()
    .single();

  const stats = { downloaded: 0, inserted: 0, skipped: 0, unmatched: 0 };
  let fileName = `fundproj_payments_${dateKey}.csv`;

  try {
    // --- Attempt SFTP first, fall back to REST API ---
    let rows;
    try {
      rows = await downloadChangoappCSV(dateKey);
    } catch (sftpErr) {
      console.warn('SFTP failed, trying REST API fallback:', sftpErr);
      rows = await fetchChangoappViaAPI(today);
      fileName = `API_fallback_${today}`;
    }

    stats.downloaded = rows.length;

    for (const row of rows) {
      // Resolve individual by FUNDPROJ ID
      const { data: individual } = await sb
        .from('individuals')
        .select('id')
        .eq('fundproj_id', row.member_ref)
        .single();

      // Resolve project by project_code
      const { data: project } = await sb
        .from('projects')
        .select('id')
        .eq('project_code', row.project_code)
        .single();

      if (!individual || !project) {
        await sb.from('unmatched_payments').insert({
          platform:       'changoapp',
          platform_ref:   row.platform_ref,
          member_ref_raw: row.member_ref,
          amount:         parseFloat(row.amount),
          currency:       row.currency,
          payment_date:   row.payment_date,
          raw_payload:    row,
        }).then(() => stats.unmatched++);
        continue;
      }

      const normalised = normaliseChangoapp(
        row as Record<string, string>,
        individual.id,
        project.id
      );

      const { error } = await sb.from('payment_ledger').upsert(
        {
          ...normalised,
          sync_batch_id: logEntry?.id,
          raw_payload:   normalised.raw_payload,
        },
        { onConflict: 'platform_ref', ignoreDuplicates: true }
      );

      if (error) {
        // Duplicate key = skipped (idempotent)
        stats.skipped++;
      } else {
        stats.inserted++;

        // Trigger revenue recognition schedule for new completed payments
        if (normalised.status === 'completed') {
          const { data: inserted } = await sb
            .from('payment_ledger')
            .select('id')
            .eq('platform_ref', row.platform_ref)
            .single();

          if (inserted) {
            await generateRecognitionSchedule({
              paymentId:         inserted.id,
              individualId:      individual.id,
              projectId:         project.id,
              amount:            normalised.amount,
              currency:          normalised.currency,
              paymentDate:       normalised.payment_date,
              recognitionMethod: 'straight-line',
              pobType:           'custody',
              scheduleMonths:    12,
            }).catch(console.error);
          }
        }
      }
    }

    // Update project_funding_summary for affected projects
    await updateFundingSummaries(sb, rows.map(r => r.project_code));

    const finalStatus: SyncStatus =
      stats.unmatched > 0 ? 'partial' : 'success';

    await sb.from('sftp_sync_log').update({
      status:             finalStatus,
      records_downloaded: stats.downloaded,
      records_inserted:   stats.inserted,
      records_skipped:    stats.skipped,
      records_unmatched:  stats.unmatched,
      file_name:          fileName,
      sync_ended_at:      new Date().toISOString(),
    }).eq('id', logEntry!.id);

    return { status: finalStatus, ...stats };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    await sb.from('sftp_sync_log').update({
      status:        'failed',
      error_message: msg,
      sync_ended_at: new Date().toISOString(),
    }).eq('id', logEntry!.id);

    return { status: 'failed', ...stats, errorMessage: msg };
  }
}

async function updateFundingSummaries(
  sb: ReturnType<typeof createServiceClient>,
  projectCodes: string[]
) {
  const unique = [...new Set(projectCodes)];
  for (const code of unique) {
    const { data: proj } = await sb
      .from('projects')
      .select('id')
      .eq('project_code', code)
      .single();
    if (!proj) continue;

    const { data: agg } = await sb
      .from('payment_ledger')
      .select('amount, payment_date')
      .eq('project_id', proj.id)
      .eq('status', 'completed');

    if (!agg) continue;

    const totalRaised = agg.reduce((s, r) => s + r.amount, 0);
    const lastPaymentDate = agg
      .map(r => r.payment_date)
      .sort()
      .at(-1) ?? null;

    const { data: memberCount } = await sb
      .from('project_members')
      .select('id', { count: 'exact' })
      .eq('project_id', proj.id);

    await sb.from('project_funding_summary').upsert({
      project_id:        proj.id,
      total_raised:      totalRaised,
      total_members:     (memberCount as unknown as { count: number })?.count ?? 0,
      last_payment_date: lastPaymentDate,
      last_sync_at:      new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'project_id' });
  }
}
