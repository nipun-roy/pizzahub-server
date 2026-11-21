import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ObjectId } from 'mongodb';
import { config } from '../config/env';
import { collections } from '../config/db';
import { Transaction } from '../models/types';

const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

// Vendor: Create Stripe Checkout Session for Premium Subscription
export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.id;
    const vendorEmail = req.user!.email;

    // Sandbox / Test Simulator Mode: If real Stripe key is not configured
    if (!stripe) {
      const mockSessionId = `cs_test_sandbox_${Date.now()}`;
      res.json({
        success: true,
        isSandbox: true,
        sessionId: mockSessionId,
        url: `${config.clientUrl}/payment/sandbox-checkout?session_id=${mockSessionId}`,
      });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: vendorEmail,
      client_reference_id: vendorId,
      metadata: {
        vendorId,
        plan: 'premium',
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PizzaHub Vendor Premium Plan',
              description: 'Publish unlimited pizza menu items, featured placement on homepage, and verified Premium badge.',
            },
            unit_amount: 1999, // $19.99 USD
          },
          quantity: 1,
        },
      ],
      success_url: `${config.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/payment/cancel`,
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment checkout session' });
  }
}

// Stripe Webhook: Signature-verified Webhook handler (Requires raw body)
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!stripe || !config.stripeWebhookSecret) {
    console.error('Stripe webhook secret is missing in configuration.');
    res.status(400).send('Webhook Secret Not Configured');
    return;
  }

  if (!sig) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
  } catch (err: any) {
    console.error(`[Webhook Error] Signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the verified payment completion event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const vendorIdStr = session.metadata?.vendorId || session.client_reference_id;

    if (vendorIdStr && ObjectId.isValid(vendorIdStr)) {
      const vendorObjectId = new ObjectId(vendorIdStr);

      try {
        // 1. Upgrade Vendor subscription plan to premium
        await collections.users.updateOne(
          { _id: vendorObjectId },
          {
            $set: {
              subscriptionPlan: 'premium',
              updatedAt: new Date(),
            },
          }
        );

        // 2. Also mark existing menu items of this vendor as featured
        await collections.menuItems.updateMany(
          { vendorId: vendorObjectId },
          { $set: { isFeatured: true } }
        );

        // 3. Record transaction in database
        const transaction: Transaction = {
          _id: new ObjectId(),
          vendorId: vendorObjectId,
          plan: 'premium',
          amount: (session.amount_total || 1999) / 100,
          currency: session.currency || 'usd',
          stripeSessionId: session.id,
          stripeSubscriptionId: (session.subscription as string) || undefined,
          status: 'completed',
          createdAt: new Date(),
        };

        await collections.transactions.insertOne(transaction);
        console.log(`[Stripe Webhook] Successfully upgraded vendor ${vendorIdStr} to Premium!`);
      } catch (dbErr) {
        console.error('[Stripe Webhook DB Error]:', dbErr);
      }
    }
  }

  res.status(200).json({ received: true });
}

// Vendor: Get Subscription Status
export async function getSubscriptionStatus(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = new ObjectId(req.user!.id);
    const user = await collections.users.findOne({ _id: vendorId });

    if (!user) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }

    const activeCount = await collections.menuItems.countDocuments({
      vendorId,
      status: { $in: ['approved', 'pending'] },
    });

    const recentTransactions = await collections.transactions
      .find({ vendorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    res.json({
      success: true,
      data: {
        plan: user.subscriptionPlan,
        activeItemsCount: activeCount,
        maxItems: user.subscriptionPlan === 'premium' ? 'unlimited' : 3,
        transactions: recentTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve subscription status' });
  }
}

// Vendor: Confirm and process sandbox payment simulation
export async function confirmSandboxPayment(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.id;
    const vendorObjectId = new ObjectId(vendorId);
    const { sessionId } = req.body;
    const finalSessionId = sessionId || `cs_test_sandbox_${Date.now()}`;

    // 1. Upgrade Vendor subscription plan to premium
    await collections.users.updateOne(
      { _id: vendorObjectId },
      {
        $set: {
          subscriptionPlan: 'premium',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      }
    );

    // 2. Mark existing menu items of this vendor as featured
    await collections.menuItems.updateMany(
      { vendorId: vendorObjectId },
      { $set: { isFeatured: true } }
    );

    // 3. Record immutable verified transaction in database
    const transaction: Transaction = {
      _id: new ObjectId(),
      vendorId: vendorObjectId,
      plan: 'premium',
      amount: 19.99,
      currency: 'usd',
      stripeSessionId: finalSessionId,
      status: 'completed',
      createdAt: new Date(),
    };

    await collections.transactions.insertOne(transaction);

    res.json({
      success: true,
      message: 'Sandbox payment verified and vendor successfully upgraded to Premium!',
      sessionId: finalSessionId,
    });
  } catch (error) {
    console.error('Error confirming sandbox payment:', error);
    res.status(500).json({ success: false, message: 'Failed to process sandbox payment' });
  }
}
