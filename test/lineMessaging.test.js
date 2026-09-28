import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { messagesForEvent, verifyLineSignature } from '../src/lineMessaging.js';

const config = {};

test('verifies LINE webhook signatures against the raw body', () => {
  const secret = 'channel-secret';
  const body = Buffer.from('{"events":[]}');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64');
  assert.equal(verifyLineSignature(body, signature, secret), true);
  assert.equal(verifyLineSignature(body, 'invalid', secret), false);
});

test('returns a dedicated reply for each rich-menu keyword', () => {
  const keywords = [
    ['【不具合報告】', /ご不便をおかけして申し訳ございません/],
    ['【変更依頼】', /変更のご依頼ありがとうございます/],
    ['【運用情報の提出】', /GA4測定ID/],
    ['【対応状況の確認】', /現在の進捗/],
    ['【よくある質問】', /1\. 操作方法/],
    ['【正式手続きの案内】', /書面または電子メール/],
    ['【商材選択】TOREMO', /掲載内容や掲載開始/],
    ['【商材選択】FORMLINK', /対象フォーム・ページURL/],
    ['【商材選択】DR VALUE', /SEO・Web改善/],
    ['【商材選択】WHITE LABEL', /コンテンツのテーマ/],
    ['【商材選択】業務改善サポート', /困っていること・工数/],
    ['【商材選択】戦略設計サポート', /達成したい目標/]
  ];

  const replies = keywords.map(([text, expected]) => {
    const messages = messagesForEvent({ type: 'message', message: { type: 'text', text } }, config);
    assert.equal(messages.length, 1);
    assert.match(messages[0].text, expected);
    return messages[0].text;
  });

  assert.equal(new Set(replies).size, 12);
});

test('returns greeting content for a follow event', () => {
  const messages = messagesForEvent({ type: 'follow' }, config);
  assert.match(messages[0].text, /友だち追加ありがとうございます/);
  assert.match(messages[0].text, /保守・運用に関する総合窓口/);
  assert.doesNotMatch(messages[0].text, /診断/);
});

test('uses the support intake reply for other messages', () => {
  const messages = messagesForEvent({
    type: 'message',
    message: { type: 'text', text: 'その他の相談' }
  }, config);
  assert.match(messages[0].text, /対象サービス/);
  assert.doesNotMatch(messages[0].text, /診断|日程調整/);
});
