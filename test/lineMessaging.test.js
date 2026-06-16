import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { messagesForEvent, verifyLineSignature } from '../src/lineMessaging.js';

const config = {
  LINE_DIAGNOSIS_URL: 'https://example.test/diagnosis',
  LINE_SERVICE_URL: 'https://example.test/service',
  LINE_EVIDENCE_URL: 'https://example.test/evidence',
  LINE_CONSULTATION_URL: 'https://example.test/contact'
};

test('verifies LINE webhook signatures against the raw body', () => {
  const secret = 'channel-secret';
  const body = Buffer.from('{"events":[]}');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64');
  assert.equal(verifyLineSignature(body, signature, secret), true);
  assert.equal(verifyLineSignature(body, 'invalid', secret), false);
});

test('returns a diagnosis link for diagnosis keywords', () => {
  const messages = messagesForEvent({
    type: 'message',
    message: { type: 'text', text: '無料診断を受けたい' }
  }, config);
  assert.equal(messages.length, 1);
  assert.match(messages[0].text, /https:\/\/example\.test\/diagnosis/);
});

test('returns greeting content for a follow event', () => {
  const messages = messagesForEvent({ type: 'follow' }, config);
  assert.match(messages[0].text, /友だち追加ありがとうございます/);
});
