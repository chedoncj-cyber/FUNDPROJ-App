import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

export async function getOrCreateStripeCustomer(
  individualId: string,
  email: string,
  name: string
): Promise<string> {
  const supabaseModule = await import('@/lib/supabase/server');
  const sb = supabaseModule.createServiceClient();

  const { data: individual } = await sb
    .from('individuals')
    .select('stripe_customer_id')
    .eq('id', individualId)
    .single();

  if (individual?.stripe_customer_id) return individual.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { fundproj_individual_id: individualId },
  });

  await sb
    .from('individuals')
    .update({ stripe_customer_id: customer.id })
    .eq('id', individualId);

  return customer.id;
}
