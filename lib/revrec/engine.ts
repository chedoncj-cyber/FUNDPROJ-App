/**
 * Revenue Recognition Engine — ASC 606 / IFRS 15
 * Generates recognition schedule entries when a payment is recorded.
 */
import type { RecognitionMethod, POBType } from '@/types';
import { createServiceClient } from '@/lib/supabase/server';

interface ScheduleOptions {
  paymentId: string;
  individualId: string;
  projectId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  recognitionMethod: RecognitionMethod;
  pobType: POBType;
  scheduleMonths: number;        // How many months to spread recognition
  milestoneDate?: string;        // For milestone POB — when to release
}

export async function generateRecognitionSchedule(opts: ScheduleOptions) {
  const sb = createServiceClient();

  // 1. Create deferred_revenue record
  const { data: deferred, error: deferredErr } = await sb
    .from('deferred_revenue')
    .insert({
      project_id:          opts.projectId,
      individual_id:       opts.individualId,
      payment_id:          opts.paymentId,
      deferred_amount:     opts.amount,
      recognised_amount:   0,
      currency:            opts.currency,
      recognition_method:  opts.recognitionMethod,
      schedule_start:      opts.paymentDate,
      schedule_end:        opts.milestoneDate ?? addMonths(opts.paymentDate, opts.scheduleMonths),
      pob_type:            opts.pobType,
    })
    .select()
    .single();

  if (deferredErr) throw deferredErr;

  // 2. Generate schedule entries
  const entries = buildScheduleEntries(deferred.id, opts);

  const { error: schedErr } = await sb
    .from('revrec_schedule')
    .insert(entries);

  if (schedErr) throw schedErr;

  return { deferred, entries };
}

function buildScheduleEntries(deferredId: string, opts: ScheduleOptions) {
  if (opts.recognitionMethod === 'immediate') {
    return [{
      deferred_id:         deferredId,
      project_id:          opts.projectId,
      individual_id:       opts.individualId,
      period_start:        opts.paymentDate,
      period_end:          opts.paymentDate,
      amount_to_recognise: opts.amount,
      status:              'scheduled',
    }];
  }

  if (opts.recognitionMethod === 'milestone') {
    return [{
      deferred_id:         deferredId,
      project_id:          opts.projectId,
      individual_id:       opts.individualId,
      period_start:        opts.paymentDate,
      period_end:          opts.milestoneDate ?? opts.paymentDate,
      amount_to_recognise: opts.amount,
      status:              'scheduled',
    }];
  }

  // straight-line: spread equally over scheduleMonths
  const monthlyAmount = parseFloat((opts.amount / opts.scheduleMonths).toFixed(2));
  const entries = [];
  let runningTotal = 0;

  for (let i = 0; i < opts.scheduleMonths; i++) {
    const periodStart = addMonths(opts.paymentDate, i);
    const periodEnd   = addMonths(opts.paymentDate, i + 1);
    const isLast = i === opts.scheduleMonths - 1;
    // Last period gets remainder to avoid rounding drift
    const amount = isLast
      ? parseFloat((opts.amount - runningTotal).toFixed(2))
      : monthlyAmount;

    runningTotal += amount;

    entries.push({
      deferred_id:         deferredId,
      project_id:          opts.projectId,
      individual_id:       opts.individualId,
      period_start:        periodStart,
      period_end:          periodEnd,
      amount_to_recognise: amount,
      status:              'scheduled',
    });
  }

  return entries;
}

export async function releasePeriod(scheduleEntryId: string, releasedBy: string) {
  const sb = createServiceClient();

  const { data: entry } = await sb
    .from('revrec_schedule')
    .select('*, deferred_revenue(*)')
    .eq('id', scheduleEntryId)
    .single();

  if (!entry || entry.status !== 'scheduled') return null;

  // Update schedule entry
  await sb.from('revrec_schedule').update({
    status:      'released',
    released_at: new Date().toISOString(),
    released_by: releasedBy,
    amount_recognised: entry.amount_to_recognise,
  }).eq('id', scheduleEntryId);

  // Update deferred_revenue running total
  await sb.from('deferred_revenue').update({
    recognised_amount: entry.deferred_revenue.recognised_amount + entry.amount_to_recognise,
  }).eq('id', entry.deferred_id);

  // Audit log
  await sb.from('audit_log').insert({
    table_name: 'revrec_schedule',
    record_id:  scheduleEntryId,
    action:     'UPDATE',
    changed_by: releasedBy,
    old_values: { status: 'scheduled' },
    new_values: { status: 'released', amount_recognised: entry.amount_to_recognise },
  });

  return entry;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}
