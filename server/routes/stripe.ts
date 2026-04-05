/**
 * server/routes/stripe.ts
 *
 * Stripe Checkout integration — "Unlock Your Golden Hours"
 *
 * POST /api/stripe/create-checkout   — Create a Stripe Checkout Session ($0.99 one-time)
 * POST /api/stripe/webhook           — Stripe webhook (confirms payment → sets paid_until)
 *
 * Product: $0.99 one-time payment → 90 days of full access (all pre-calculated windows).
 * Free users see 3 rolling days. Paid users see all 90 days.
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../index.js';
import { Users }       from '../db.js';
import { generateUserScores }    from '../jobs/score.js';
import { ensureTransitsCurrent } from '../jobs/transits.js';

const router = Router();

// ── Stripe client ─────────────────────────────────────────────────────────────
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('[stripe] STRIPE_SECRET_KEY not set — Stripe routes disabled');
}

function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey);
}

// ── POST /create-checkout ─────────────────────────────────────────────────────
// Requires Firebase auth. Creates a Stripe Checkout Session for $0.99 one-time.
router.post(
  '/create-checkout',
  requireAuth as any,
  async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Payments not configured' });
    }

    const uid = (req as any).user.uid as string;
    const user = await Users.get(uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Call /users/sync first.' });
    }

    // Already paid?
    const now = Date.now();
    if (user.paidUntil && new Date(user.paidUntil).getTime() > now) {
      return res.json({
        alreadyPaid: true,
        paidUntil: user.paidUntil,
        message: 'You already have full access!',
      });
    }

    try {
      // Determine the success/cancel URLs
      const origin = req.headers.origin
        || `${req.protocol}://${req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: 99, // $0.99 in cents
              product_data: {
                name: 'Unlock Your Golden Hours',
                description: '90 days of full planetary timing access — all windows, all services.',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          uid, // So the webhook knows which user paid
        },
        customer_email: user.email || undefined,
        success_url: `${origin}/dashboard?payment=success`,
        cancel_url:  `${origin}/dashboard?payment=cancelled`,
      });

      return res.json({ url: session.url });
    } catch (err) {
      console.error('[stripe/create-checkout]', err);
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }
  },
);

// ── POST /webhook ─────────────────────────────────────────────────────────────
// Stripe sends events here. Requires raw body (not JSON-parsed).
// Raw body middleware is applied in server/index.ts BEFORE express.json().
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // In dev without webhook secret, trust the payload (NOT for production)
        console.warn('[stripe/webhook] No STRIPE_WEBHOOK_SECRET — accepting unverified event');
        event = JSON.parse(req.body.toString()) as Stripe.Event;
      }
    } catch (err) {
      console.error('[stripe/webhook] signature verification failed:', err);
      return res.status(400).send('Webhook signature verification failed');
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;

      if (!uid) {
        console.error('[stripe/webhook] No uid in metadata');
        return res.status(400).send('No uid in metadata');
      }

      if (session.payment_status === 'paid') {
        console.log(`[stripe/webhook] ✦ Payment confirmed for uid=${uid}`);

        try {
          // Grant 90 days of access
          const paidUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          await Users.setPaidUntil(uid, paidUntil.toISOString());
          console.log(`[stripe/webhook] uid=${uid} paid_until=${paidUntil.toISOString()}`);

          // Trigger full 90-day score generation in background
          ensureTransitsCurrent(90)
            .then(() => generateUserScores(uid, 90))
            .then((n) => console.log(`[stripe/webhook] uid=${uid} generated ${n} scores`))
            .catch((err) => console.error(`[stripe/webhook] score generation failed uid=${uid}:`, err));
        } catch (err) {
          console.error('[stripe/webhook] DB update failed:', err);
          // Still return 200 to Stripe so it doesn't retry
        }
      }
    }

    return res.status(200).json({ received: true });
  },
);

export default router;
