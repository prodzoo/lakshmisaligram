// server.js
// Run this with: node server.js
// You need to install dependencies: npm install express stripe cors dotenv

const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Replace this with your actual Stripe Secret Key (sk_test_...)
// Or better, put it in a .env file
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_replace_me_with_your_secret_key');

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const DOMAIN = 'http://localhost:5173'; // Replace with your frontend URL

app.post('/create-checkout-session', async (req, res) => {
  const { presetId, presetName } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `ProHeadshot: ${presetName}`,
              description: 'High-Resolution Professional Headshot Download',
              images: ['https://placehold.co/600x400/png'], // Optional: Add a real logo URL here
            },
            unit_amount: 499, // $4.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // The crucial part: Redirect back to your app with specific query params
      success_url: `${DOMAIN}/?success=true&preset_id=${presetId}`,
      cancel_url: `${DOMAIN}/?canceled=true`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(4242, () => console.log('Running on port 4242'));