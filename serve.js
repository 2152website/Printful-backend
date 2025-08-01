const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/products', async (req, res) => {
  try {
    const response = await axios.get('https://api.printful.com/store/products', {
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });

    const rawProducts = response.data.result;

    const detailedProducts = await Promise.all(
      rawProducts.map(async (item) => {
        const productDetail = await axios.get(`https://api.printful.com/store/products/${item.id}`, {
          headers: {
            Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`
          }
        });

        const product = productDetail.data.result;

        return {
          id: product.id,
          name: product.name,
          price: product.variants[0].retail_price,
          image: product.variants[0].files[0]?.preview_url || product.thumbnail_url,
          variant_id: product.variants[0].id
        };
      })
    );

    res.json(detailedProducts);
  } catch (err) {
    console.error('❌ Printful API failed. Loading fallback data.', err.message);

    // Fallback to local products.json
    try {
      const localProducts = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
      res.json(localProducts);
    } catch (fileErr) {
      console.error('❌ Local fallback failed:', fileErr.message);
      res.status(500).json({ error: 'Failed to load product data.' });
    }
  }
});

app.post('/checkout', async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const { lineItems } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: 'https://twentyone52.com/success',
      cancel_url: 'https://twentyone52.com/cancel'
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe error:', err.message);
    res.status(500).json({ error: 'Stripe checkout error', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});