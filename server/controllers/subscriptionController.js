const Organization = require('../models/Organization');
const config = require('../config');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 
// Mocking Stripe for now to avoid crashes if key is missing. 
// In production, uncomment above and remove mock.
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

exports.createCheckoutSession = async (req, res) => {
    try {
        if (!stripe) {
            // Demo Mode: Simulate successful checkout
            console.log('Stripe key missing. Using Demo/Mock mode.');
            return res.json({ url: `${config.clientUrl}/billing?success=true` });
        }

        const org = await Organization.findById(req.user.organizationId);

        // Define Price ID (env var or hardcoded for now)
        const priceId = process.env.STRIPE_PRICE_ID_PRO || 'price_mock_pro_id';

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: req.user.email, // Pre-fill email
            client_reference_id: org._id.toString(),
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${config.clientUrl}/billing?success=true`,
            cancel_url: `${config.clientUrl}/billing?canceled=true`,
            metadata: {
                organizationId: org._id.toString()
            }
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Stripe Checkout Error', error);
        res.status(500).json({ message: 'Server error creating checkout session' });
    }
};

exports.createPortalSession = async (req, res) => {
    try {
        if (!stripe) {
            // Mock Mode
            return res.json({ url: `${config.clientUrl}/billing` });
        }

        const org = await Organization.findById(req.user.organizationId);

        if (!org.stripeCustomerId) {
            return res.status(400).json({ message: 'No billing account found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId,
            return_url: `${config.clientUrl}/billing`,
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Stripe Portal Error', error);
        res.status(500).json({ message: 'Server error creating portal session' });
    }
};

// Webhook Handler (Requires raw body parser in server.js)
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        if (!stripe) throw new Error('Stripe not configured');
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await handleSubscriptionUpdated(subscription);
                break;
            default:
            // console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err) {
        console.error('Error handling webhook event', err);
        // Don't fail the webhook response or Stripe will retry indefinitely
    }

    res.json({ received: true });
};

async function handleCheckoutCompleted(session) {
    const orgId = session.metadata.organizationId || session.client_reference_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    await Organization.findByIdAndUpdate(orgId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan: 'pro',
        subscriptionStatus: 'active'
    });
}

async function handleSubscriptionUpdated(subscription) {
    const status = subscription.status;
    const plan = status === 'active' || status === 'trialing' ? 'pro' : 'free';

    // Find org by stripeCustomerId (we need to make sure we saved it earlier)
    await Organization.findOneAndUpdate(
        { stripeCustomerId: subscription.customer },
        {
            subscriptionStatus: status,
            plan: plan
        }
    );
}

// Get Invoice History
exports.getInvoices = async (req, res) => {
    try {
        const org = await Organization.findById(req.user.organizationId);

        if (!org || !org.stripeCustomerId) {
            return res.json({ invoices: [] });
        }

        if (!stripe) {
            // Mock invoices for demo
            const mockInvoices = [
                {
                    id: 'in_mock_1',
                    number: 'INV-2024-001',
                    amount_paid: 4900,
                    currency: 'usd',
                    status: 'paid',
                    created: Math.floor(Date.now() / 1000) - 86400 * 30,
                    invoice_pdf: '#',
                    hosted_invoice_url: '#'
                },
                {
                    id: 'in_mock_2',
                    number: 'INV-2024-002',
                    amount_paid: 4900,
                    currency: 'usd',
                    status: 'paid',
                    created: Math.floor(Date.now() / 1000) - 86400 * 60,
                    invoice_pdf: '#',
                    hosted_invoice_url: '#'
                }
            ];
            return res.json({ invoices: mockInvoices });
        }

        const invoices = await stripe.invoices.list({
            customer: org.stripeCustomerId,
            limit: 12
        });

        res.json({ invoices: invoices.data });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Failed to fetch invoices' });
    }
};

// Change Plan (Upgrade/Downgrade)
exports.changePlan = async (req, res) => {
    try {
        const { newPlan } = req.body; // 'free', 'pro', 'enterprise'
        const org = await Organization.findById(req.user.organizationId);

        if (!stripe) {
            // Mock mode - just update the plan
            org.plan = newPlan;
            await org.save();
            return res.json({ success: true, message: `Plan changed to ${newPlan}` });
        }

        if (!org.stripeSubscriptionId) {
            return res.status(400).json({ message: 'No active subscription found' });
        }

        // Get the subscription
        const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);

        // Define price IDs for each plan
        const priceIds = {
            free: null, // Cancel subscription
            pro: process.env.STRIPE_PRICE_ID_PRO || 'price_mock_pro',
            enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_mock_enterprise'
        };

        if (newPlan === 'free') {
            // Cancel subscription
            await stripe.subscriptions.cancel(org.stripeSubscriptionId);
            org.plan = 'free';
            org.subscriptionStatus = 'canceled';
        } else {
            // Update subscription with new price
            await stripe.subscriptions.update(org.stripeSubscriptionId, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: priceIds[newPlan]
                }],
                proration_behavior: 'create_prorations'
            });
            org.plan = newPlan;
        }

        await org.save();
        res.json({ success: true, message: `Plan changed to ${newPlan}` });

    } catch (error) {
        console.error('Change plan error:', error);
        res.status(500).json({ message: 'Failed to change plan' });
    }
};
