import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { paymentValidation } from '../middleware/validate.js';

const router = express.Router();
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get user credits
router.get('/credits', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { credits: true }
    });

    res.json({ credits: user.credits });
  } catch (error) {
    next(error);
  }
});

// Get transaction history
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create payment intent for credit purchase
router.post('/create-intent', authenticate, paymentValidation, async (req, res, next) => {
  try {
    const { amount } = req.body;

    // Amount is in dollars, convert to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        creditAmount: amount.toString(),
        type: 'credit_purchase'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount
    });
  } catch (error) {
    console.error('Stripe error:', error);
    next(error);
  }
});

// Confirm payment and add credits
router.post('/confirm', authenticate, async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Check if already processed
    const existingTransaction = await prisma.transaction.findFirst({
      where: { stripePaymentId: paymentIntentId }
    });

    if (existingTransaction) {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // Verify metadata matches user
    if (paymentIntent.metadata.userId !== req.user.id) {
      return res.status(403).json({ error: 'Payment does not belong to this user' });
    }

    const creditAmount = parseFloat(paymentIntent.metadata.creditAmount);

    // Add credits in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const user = await tx.user.update({
        where: { id: req.user.id },
        data: { credits: { increment: creditAmount } }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: req.user.id,
          type: 'credit_purchase',
          amount: creditAmount,
          stripePaymentId: paymentIntentId,
          description: `Purchased $${creditAmount.toFixed(2)} in credits`
        }
      });

      return user;
    });

    res.json({
      message: 'Credits added successfully',
      creditsAdded: creditAmount,
      newBalance: result.credits
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    next(error);
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);

      // Double-check processing (in case confirm endpoint wasn't called)
      if (paymentIntent.metadata.type === 'credit_purchase') {
        const existingTransaction = await prisma.transaction.findFirst({
          where: { stripePaymentId: paymentIntent.id }
        });

        if (!existingTransaction && paymentIntent.metadata.userId) {
          const creditAmount = parseFloat(paymentIntent.metadata.creditAmount);

          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: paymentIntent.metadata.userId },
              data: { credits: { increment: creditAmount } }
            });

            await tx.transaction.create({
              data: {
                userId: paymentIntent.metadata.userId,
                type: 'credit_purchase',
                amount: creditAmount,
                stripePaymentId: paymentIntent.id,
                description: `Purchased $${creditAmount.toFixed(2)} in credits (webhook)`
              }
            });
          });
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      console.log('Payment failed:', failedIntent.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
