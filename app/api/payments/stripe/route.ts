import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/server';
import { normaliseStripe } from '@/lib/payments/normaliser';
import { generateRecognitionSchedule } from '@/lib/revrec/engine';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const sb = createServiceClient();

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    const meta = invoice.metadata ?? {};
    const individualId = meta.fundproj_individual_id;
    const projectId    = meta.fundproj_project_id;

    if (!individualId || !projectId) {
      return NextResponse.json({ skipped: 'no fundproj metadata' });
    }

    const normalised = normaliseStripe(
      invoice as unknown as Record<string, unknown>,
      individualId,
      projectId
    );

    const { data: inserted } = await sb
      .from('payment_ledger')
      .upsert(normalised, { onConflict: 'platform_ref', ignoreDuplicates: true })
      .select()
      .single();

    if (inserted) {
      await generateRecognitionSchedule({
        paymentId:         inserted.id,
        individualId,
        projectId,
        amount:            normalised.amount,
        currency:          normalised.currency,
        paymentDate:       normalised.payment_date,
        recognitionMethod: 'straight-line',
        pobType:           'custody',
        scheduleMonths:    12,
      });
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    // Flag member's subscription as past_due
    await sb
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('platform_sub_id', invoice.subscription as string);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    await sb
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('platform_sub_id', sub.id);
  }

  return NextResponse.json({ received: true });
}
