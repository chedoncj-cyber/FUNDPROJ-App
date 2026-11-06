import type { NormalisedPayment, PaymentPlatform, PaymentStatus } from '@/types';

// Changoapp CSV row → NormalisedPayment
export function normaliseChangoapp(
  row: Record<string, string>,
  individualId: string,
  projectId: string
): NormalisedPayment {
  return {
    individual_id: individualId,
    project_id: projectId,
    amount: parseFloat(row.amount),
    currency: row.currency?.toUpperCase() || 'USD',
    payment_date: row.payment_date,
    platform: 'changoapp',
    platform_ref: row.platform_ref,
    status: (row.status as PaymentStatus) || 'completed',
    raw_payload: row as Record<string, unknown>,
  };
}

// Stripe invoice.payment_succeeded → NormalisedPayment
export function normaliseStripe(
  invoice: Record<string, unknown>,
  individualId: string,
  projectId: string
): NormalisedPayment {
  return {
    individual_id: individualId,
    project_id: projectId,
    amount: (invoice.amount_paid as number) / 100, // cents → major
    currency: ((invoice.currency as string) || 'gbp').toUpperCase(),
    payment_date: new Date((invoice.created as number) * 1000)
      .toISOString()
      .split('T')[0],
    platform: 'stripe',
    platform_ref: invoice.id as string,
    status: 'completed',
    raw_payload: invoice,
  };
}

// GoCardless payment → NormalisedPayment
export function normaliseGoCardless(
  payment: Record<string, unknown>,
  individualId: string,
  projectId: string
): NormalisedPayment {
  return {
    individual_id: individualId,
    project_id: projectId,
    amount: (payment.amount as number) / 100,
    currency: ((payment.currency as string) || 'GBP').toUpperCase(),
    payment_date: payment.charge_date as string,
    platform: 'gocardless',
    platform_ref: payment.id as string,
    status: payment.status === 'paid_out' ? 'completed' : 'pending',
    raw_payload: payment,
  };
}

// Flutterwave webhook → NormalisedPayment
export function normaliseFlutterwave(
  tx: Record<string, unknown>,
  individualId: string,
  projectId: string
): NormalisedPayment {
  return {
    individual_id: individualId,
    project_id: projectId,
    amount: tx.amount as number,
    currency: (tx.currency as string) || 'GHS',
    payment_date: new Date(tx.created_at as string).toISOString().split('T')[0],
    platform: 'flutterwave',
    platform_ref: String(tx.id),
    status: tx.status === 'successful' ? 'completed' : 'failed',
    raw_payload: tx,
  };
}
