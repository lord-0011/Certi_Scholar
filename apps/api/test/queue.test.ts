import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocumentModel, ExtractedFieldModel } from '../src/models/document.js';
import { UserModel } from '../src/models/user.js';
import { startHarness, type Harness } from './helpers.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
});
afterAll(() => h.stop());

describe('malformed request bodies', () => {
  it('answers broken JSON with 400 invalid_json, not 500', async () => {
    const res = await request(h.app)
      .post('/api/v1/auth/login')
      .set('content-type', 'application/json')
      .send('{"email": "student@example.test", "password": "12345"')
      .expect(400);
    expect(res.body.error).toEqual({ code: 'invalid_json', message: 'The request body is not valid JSON. Check the data and try again.' });
  });

  it('answers an oversized JSON body with 413', async () => {
    const res = await request(h.app)
      .post('/api/v1/auth/login')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.test', password: 'x'.repeat(300 * 1024) }))
      .expect(413);
    expect(res.body.error.code).toBe('body_too_large');
  });
});

describe('review queue reaches every case', () => {
  const COUNT = 230; // more than LIST_PAGE_SIZE (200)
  let newest: string;
  let mineId: string;

  beforeAll(async () => {
    const student = await UserModel.findOne({ role: 'student' }).lean();
    const verifier = await UserModel.findOne({ role: 'verifier' }).lean();
    const start = Date.parse('2026-01-01T00:00:00Z');
    const docs = await DocumentModel.insertMany(
      Array.from({ length: COUNT }, (_, i) => ({
        owner: student!._id,
        originalName: `q-${i}.pdf`,
        mime: 'application/pdf',
        documentType: 'identity',
        status: i % 2 ? 'needs_review' : 'failed',
        createdAt: new Date(start + i * 60_000),
        assignedTo: i === 5 ? verifier!._id : null,
      })),
    );
    newest = String(docs.at(-1)!._id);
    mineId = String(docs[5]._id);
    await ExtractedFieldModel.insertMany(
      docs.filter((d) => d.status === 'needs_review').map((d) => ({ document: d._id, key: 'name', value: 'x', status: 'needs_review' })),
    );
  });

  it('pages through the whole queue with the full total', async () => {
    const verifier = await h.login('verifier');
    const first = await verifier.get('/api/v1/documents/review-queue?page=1&pageSize=100').expect(200);
    const total = Number(first.headers['x-total-count']);
    expect(total).toBeGreaterThanOrEqual(COUNT);
    const seen = new Set<string>();
    for (let page = 1; page <= Math.ceil(total / 100); page++) {
      const body = (await verifier.get(`/api/v1/documents/review-queue?page=${page}&pageSize=100`).expect(200)).body as { id: string }[];
      body.forEach((d) => seen.add(d.id));
    }
    expect(seen.size).toBe(total);
    expect(seen.has(newest)).toBe(true); // the newest upload is reachable, not hidden behind the oldest 200
  });

  it('says how many exist even when an unpaged caller only gets the first LIST_PAGE_SIZE', async () => {
    const verifier = await h.login('verifier');
    const res = await verifier.get('/api/v1/documents/review-queue').expect(200);
    expect(res.body).toHaveLength(200);
    expect(Number(res.headers['x-total-count'])).toBeGreaterThan(200);
  });

  it('can show the newest first and filter by assignment and work', async () => {
    const verifier = await h.login('verifier');
    const newestFirst = (await verifier.get('/api/v1/documents/review-queue?sort=newest&page=1&pageSize=5').expect(200)).body;
    expect(newestFirst[0].id).toBe(newest);
    const mine = (await verifier.get('/api/v1/documents/review-queue?assigned=me').expect(200)).body as { id: string }[];
    expect(mine.map((d) => d.id)).toContain(mineId);
    const failed = await verifier.get('/api/v1/documents/review-queue?reason=processing_failed&page=1&pageSize=10').expect(200);
    expect((failed.body as { reason: string }[]).every((d) => d.reason === 'processing_failed')).toBe(true);
    await verifier.get('/api/v1/documents/review-queue?sort=sideways').expect(400);
  });

  it('summarises the whole queue, not just one page', async () => {
    const verifier = await h.login('verifier');
    const s = (await verifier.get('/api/v1/documents/review-queue/summary').expect(200)).body;
    const total = Number((await verifier.get('/api/v1/documents/review-queue?page=1&pageSize=1').expect(200)).headers['x-total-count']);
    expect(s.total).toBe(total);
    expect(s.mine).toBeGreaterThanOrEqual(1);
    expect(s.mine + s.unassigned).toBe(s.total);
    expect(s.pendingFields).toBeGreaterThanOrEqual(COUNT / 2);
    await (await h.login('student')).get('/api/v1/documents/review-queue/summary').expect(403);
  });
});
