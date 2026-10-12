const express = require('express');

function createApp(products = new Map()) {
  const app = express();
  let nextId = 1;
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/products', (req, res) => {
    let result = [...products.values()];
    if (req.query.name !== undefined) {
      if (typeof req.query.name !== 'string') return res.status(400).json({ error: 'name must be text' });
      result = result.filter(product => product.name === req.query.name);
    }
    return res.json(result);
  });

  function validate(req, res, next) {
    const data = req.body;
    if (!data || typeof data.name !== 'string' || data.name.trim().length === 0 ||
        data.name.length > 100 || !Number.isInteger(data.priceCents) || data.priceCents < 0) {
      return res.status(400).json({ error: 'name (1–100 characters) and nonnegative integer priceCents are required' });
    }
    return next();
  }

  app.post('/products', validate, (req, res) => {
    const product = { id: nextId++, name: req.body.name.trim(), priceCents: req.body.priceCents };
    products.set(product.id, product);
    return res.location(`/products/${product.id}`).status(201).json(product);
  });

  app.get('/products/:id', (req, res) => {
    const product = products.get(Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json(product);
  });

  app.put('/products/:id', validate, (req, res) => {
    const id = Number(req.params.id);
    if (!products.has(id)) return res.status(404).json({ error: 'Product not found' });
    const product = { id, name: req.body.name.trim(), priceCents: req.body.priceCents };
    products.set(id, product);
    return res.json(product);
  });

  app.delete('/products/:id', (req, res) => {
    products.delete(Number(req.params.id));
    return res.status(204).end();
  });
  app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: 'Invalid request' }));
  return app;
}

module.exports = { createApp };
