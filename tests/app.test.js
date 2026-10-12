const request = require('supertest');
const { createApp } = require('../src/app');

describe('product catalog', () => {
  let app;
  beforeEach(() => { app = createApp(); });
  test('health and empty catalog', async () => {
    expect((await request(app).get('/health')).body).toEqual({ status: 'ok' });
    expect((await request(app).get('/products')).body).toEqual([]);
  });
  test('create, read, filter, update and idempotently delete', async () => {
    const created = await request(app).post('/products').send({ name: ' Hat ', priceCents: 5995 });
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ id: 1, name: 'Hat', priceCents: 5995 });
    expect(created.headers.location).toBe('/products/1');
    expect((await request(app).get(created.headers.location)).body).toEqual(created.body);
    await request(app).post('/products').send({ name: 'Shoes', priceCents: 100 });
    expect((await request(app).get('/products')).body).toHaveLength(2);
    expect((await request(app).get('/products?name=Hat')).body).toEqual([created.body]);
    expect((await request(app).get('/products?name=Missing')).body).toEqual([]);
    const updated = await request(app).put('/products/1').send({ name: 'Fedora', priceCents: 0 });
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ id: 1, name: 'Fedora', priceCents: 0 });
    expect((await request(app).get('/products/1')).body).toEqual(updated.body);
    for (let i = 0; i < 2; i++) expect((await request(app).delete('/products/1')).status).toBe(204);
    expect((await request(app).get('/products/1')).status).toBe(404);
    expect((await request(app).get('/products')).body).toHaveLength(1);
  });
  test.each([{}, {name: 4, priceCents: 1}, {name: '', priceCents: 1},
    {name: ' ', priceCents: 1}, {name: 'x'.repeat(101), priceCents: 1},
    {name: 'Hat', priceCents: -1}, {name: 'Hat', priceCents: 1.5},
    {name: 'Hat', priceCents: '1'}, null])('reject invalid data %j', async data => {
    const res = await request(app).post('/products').send(data);
    expect(res.status).toBe(400);
    expect((await request(app).get('/products')).body).toEqual([]);
  });
  test('missing products, endpoints, and invalid queries', async () => {
    expect((await request(app).get('/products/999')).status).toBe(404);
    expect((await request(app).put('/products/999').send({name: 'Hat', priceCents: 1})).status).toBe(404);
    expect((await request(app).put('/products/1').send({})).status).toBe(400);
    expect((await request(app).get('/unknown')).status).toBe(404);
    expect((await request(app).get('/products?name[a]=x')).status).toBe(200);
    expect((await request(app).get('/products?name=x&name=y')).status).toBe(400);
  });
  test('malformed JSON returns a safe error', async () => {
    const response = await request(app).post('/products').set('Content-Type', 'application/json').send('{');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid request' });
  });
  test('unexpected storage failures return 500 without leaking internals', async () => {
    const store = new Map();
    store.set = () => { throw new Error('private storage diagnostic'); };
    const response = await request(createApp(store)).post('/products')
      .send({ name: 'Hat', priceCents: 5995 });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Invalid request' });
    expect(response.text).not.toContain('private storage diagnostic');
  });
});
