const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key');
const { User, Payment } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Create payment intent
router.post('/create-intent', auth, async (req, res) => {
  try {
    const { amount } = req.body; // amount in USD

    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects cents
      currency: 'usd',
      metadata: {
        userId: req.user.userId
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm payment and add credits
router.post('/confirm', auth, async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Add credits to user account
      const user = await User.findByPk(req.user.userId);
      await user.update({ 
        balance: parseFloat(user.balance) + parseFloat(amount) 
      });

      // Record the payment
      const payment = await Payment.create({
        userId: req.user.userId,
        amount: amount,
        paymentMethod: 'stripe',
        paymentIntentId: paymentIntentId,
        status: 'completed'
      });

      res.json({
        success: true,
        newBalance: user.balance,
        message: `Successfully added $${amount} to your account`
      });
    } else {
      res.status(400).json({ message: 'Payment not successful' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create checkout session (Stripe Checkout)
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { amount, totalCredits, autoTopup, taxInvoice } = req.body;

    if (!amount || amount < 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum purchase amount is $5' 
      });
    }

    // Validate auto-topup settings if enabled
    if (autoTopup && autoTopup.enabled) {
      if (!autoTopup.threshold || autoTopup.threshold < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Auto-topup threshold must be at least $1' 
        });
      }
      if (!autoTopup.amount || autoTopup.amount < 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Auto-topup amount must be at least $5' 
        });
      }
    }

    // Validate tax invoice settings if enabled
    if (taxInvoice && taxInvoice.enabled) {
      if (!taxInvoice.taxId || taxInvoice.taxId.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Tax ID is required for tax-deductible invoice' 
        });
      }
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Create checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Ubophone Credits',
              description: `$${totalCredits} in calling credits (includes bonus)`,
            },
            unit_amount: amount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'https://ubophone.com'}/dashboard?payment=success`,
      cancel_url: `${process.env.CLIENT_URL || 'https://ubophone.com'}/buy-credits?payment=cancelled`,
      metadata: {
        userId: req.user.userId,
        amount: amount.toString(),
        totalCredits: totalCredits.toString(),
        autoTopupEnabled: autoTopup && autoTopup.enabled ? 'true' : 'false',
        autoTopupThreshold: autoTopup && autoTopup.enabled ? autoTopup.threshold.toString() : '',
        autoTopupAmount: autoTopup && autoTopup.enabled ? autoTopup.amount.toString() : '',
        taxInvoiceEnabled: taxInvoice && taxInvoice.enabled ? 'true' : 'false',
        taxId: taxInvoice && taxInvoice.enabled ? taxInvoice.taxId : ''
      },
      customer_email: user.email,
    });

    res.json({
      success: true,
      sessionUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create checkout session' 
    });
  }
});

// Webhook to handle successful payments from Stripe Checkout  
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // 如果没有配置webhook secret，我们仍然尝试处理事件，但要记录警告
    if (!webhookSecret) {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured - webhook signature verification skipped');
      console.warn('⚠️ This is a security risk in production. Please configure STRIPE_WEBHOOK_SECRET');
      // 在没有webhook secret的情况下，我们直接使用请求体
      event = JSON.parse(req.body.toString());
    } else {
      // 正常的webhook签名验证
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    console.error('Raw body length:', req.body.length);
    console.error('Signature present:', !!sig);
    console.error('Webhook secret configured:', !!webhookSecret);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Received webhook event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, amount, totalCredits, autoTopupEnabled, autoTopupThreshold, autoTopupAmount, taxInvoiceEnabled, taxId } = session.metadata;

    console.log(`💰 Processing payment for user ${userId}: $${amount} -> $${totalCredits} credits`);

    try {
      // Add credits to user account
      const user = await User.findByPk(userId);
      if (user) {
        const oldBalance = parseFloat(user.balance);
        const newBalance = oldBalance + parseFloat(totalCredits);
        await user.update({ balance: newBalance });

        console.log(`✅ Updated user ${userId} balance: $${oldBalance} -> $${newBalance}`);

        // Save auto-topup settings if enabled
        if (autoTopupEnabled === 'true') {
          const userPreferences = user.preferences || {};
          userPreferences.autoTopup = {
            enabled: true,
            threshold: parseFloat(autoTopupThreshold),
            amount: parseFloat(autoTopupAmount)
          };
          await user.update({ preferences: userPreferences });
          console.log(`🔄 Auto-topup configured for user ${userId}`);
        }

        // Record the payment
        const payment = await Payment.create({
          userId: userId,
          type: 'credit_purchase',
          amount: parseFloat(amount),
          status: 'completed',
          description: `Added $${totalCredits} credits`,
          provider: 'Stripe',
          paymentMethod: 'stripe_checkout',
          paymentIntentId: session.payment_intent,
          transactionId: session.payment_intent || session.id,
          metadata: {
            sessionId: session.id,
            totalCredits: parseFloat(totalCredits),
            autoTopup: autoTopupEnabled === 'true' ? {
              enabled: true,
              threshold: parseFloat(autoTopupThreshold),
              amount: parseFloat(autoTopupAmount)
            } : { enabled: false },
            taxInvoice: taxInvoiceEnabled === 'true' ? {
              enabled: true,
              taxId: taxId
            } : { enabled: false }
          }
        });

        console.log(`💾 Payment record created: ID ${payment.id}, Amount $${amount}`);
        console.log(`🎉 Payment completed for user ${userId}: $${amount} -> $${totalCredits} credits`);
      } else {
        console.error(`❌ User ${userId} not found for payment processing`);
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      console.error('Stack trace:', error.stack);
    }
  } else {
    console.log(`ℹ️ Unhandled webhook event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;