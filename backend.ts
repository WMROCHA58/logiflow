
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const db = admin.firestore();

/**
 * Cria uma sessão de Checkout do Stripe para assinatura
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar logado.');
  }

  const uid = context.auth.uid;
  const email = context.auth.token.email;

  // Busca ou cria cliente no Stripe
  const userDoc = await db.collection('users').doc(uid).get();
  let customerId = userDoc.data()?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email,
      metadata: { firebaseUID: uid },
    });
    customerId = customer.id;
    await db.collection('users').doc(uid).update({ stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID, // ID do preço de R$ 29,00 criado no dashboard
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${data.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: data.returnUrl,
    subscription_data: {
      metadata: { firebaseUID: uid },
    },
  });

  return { url: session.url };
});

/**
 * Cria link para o Portal do Cliente Stripe (Gerenciar Assinatura/Cancelamento)
 */
export const createPortalLink = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar logado.');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const customerId = userDoc.data()?.stripeCustomerId;

  if (!customerId) {
    throw new functions.https.HttpsError('not-found', 'Cliente Stripe não encontrado.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: data.returnUrl,
  });

  return { url: session.url };
});

/**
 * Webhook para processar eventos do Stripe e manter o Firestore sincronizado
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const subscription = event.data.object as Stripe.Subscription;
  const firebaseUID = subscription.metadata.firebaseUID;

  if (!firebaseUID) {
    res.json({ received: true, info: 'No firebaseUID in metadata' });
    return;
  }

  const userRef = db.collection('users').doc(firebaseUID);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await userRef.update({
        status: subscription.status,
        subscriptionId: subscription.id,
        isSubscribed: subscription.status === 'active' || subscription.status === 'trialing',
      });
      break;
    case 'customer.subscription.deleted':
      await userRef.update({
        status: 'expired',
        isSubscribed: false,
        subscriptionId: admin.firestore.FieldValue.delete(),
      });
      break;
    case 'invoice.payment_failed':
      await userRef.update({
        status: 'past_due',
        isSubscribed: false,
      });
      break;
  }

  res.json({ received: true });
});
