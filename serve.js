const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ GET products from Printful
app.get('/products', async (req, res) => {
  try {
    const response = await axios.get('https://api.printful.com/products', {
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', detail: err.message });
  }
});

// ✅ POST checkout via Stripe
app.post('/checkout', async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const { lineItems } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: 'https://twentyone52.com/success',
      cancel_url: 'https://twentyone52.com/cancel',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Stripe session error', detail: err.message });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});