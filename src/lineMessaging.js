import crypto from 'node:crypto';

const REPLY_ENDPOINT = 'https://api.line.me/v2/bot/message/reply';

export function verifyLineSignature(rawBody, signature, channelSecret) {
  if (!rawBody || !signature || !channelSecret) {
    return false;
  }
  const expected = crypto.createHmac('sha256', channelSecret).update(rawBody).digest('base64');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function handleLineWebhook(body, config, fetchImpl = fetch) {
  const events = Array.isArray(body.events) ? body.events : [];
  await Promise.all(events.map(async (event) => {
    if (!event.replyToken || event.replyToken === '00000000000000000000000000000000') {
      return;
    }
    const messages = messagesForEvent(event, config);
    if (messages.length === 0) {
      return;
    }
    await replyLineMessage(event.replyToken, messages, config.LINE_CHANNEL_ACCESS_TOKEN, fetchImpl);
  }));
}

export function messagesForEvent(event, config) {
  if (event.type === 'follow') {
    return [textMessage(followMessage())];
  }
  if (event.type === 'postback') {
    return [textMessage(genericSupportMessage())];
  }
  if (event.type !== 'message' || event.message?.type !== 'text') {
    return [];
  }

  const text = String(event.message.text || '').trim();
  return [textMessage(supportReplies[text] || genericSupportMessage())];
}

const supportReplies = {
  '【不具合報告】': [
    'ご不便をおかけして申し訳ございません。不具合のご報告を受け付けました。状況を確認し、担当者より対応方針をご連絡します。',
    '', '次の内容を分かる範囲でお送りください。',
    '【対象サービス】', '【発生日時】', '【対象ページ・URL】', '【行った操作】',
    '【本来の動作】', '【実際に起きたこと】', '【影響範囲・緊急度】', '【画面画像・動画】添付できる場合',
    '', '受付時間：9:00〜18:00', '時間外のご連絡は、次の受付時間以降に確認します。',
    '※パスワードや認証コードは送信しないでください。'
  ].join('\n'),
  '【変更依頼】': [
    '変更のご依頼ありがとうございます。内容と影響範囲を確認し、対応可否と予定を担当者よりご連絡します。',
    '', '【対象サービス】', '【対象ページ・URL】', '【変更箇所】', '【現在の内容】', '【変更後の内容】',
    '【希望時期】', '【参考画像・資料】添付できる場合', '', '受付時間：9:00〜18:00',
    '時間外のご連絡は、次の受付時間以降に確認します。'
  ].join('\n'),
  '【運用情報の提出】': [
    '運用情報のご提出ありがとうございます。受領内容を確認し、不足事項がある場合は担当者よりご連絡します。',
    '', '【対象サービス】', '【LP・対象ページURL】', '【GA4測定ID】例：G-XXXXXXXXXX', '【計測する成果地点】',
    '【掲載・運用開始希望日】', '【その他の指定事項】', '', '受付時間：9:00〜18:00',
    '※パスワード、認証コード、秘密鍵は送信しないでください。ログイン作業が必要な場合は安全な共有方法をご案内します。'
  ].join('\n'),
  '【対応状況の確認】': [
    '対応状況の確認を承りました。該当するご依頼を確認し、現在の進捗を担当者よりご案内します。',
    '', '【対象サービス】', '【ご依頼日】', '【ご依頼内容】', '【会社名・お名前】', '',
    '受付時間：9:00〜18:00', '時間外のご連絡は、次の受付時間以降に確認します。'
  ].join('\n'),
  '【よくある質問】': [
    'よくある質問をご利用いただきありがとうございます。確認したい番号と対象サービスをお送りください。',
    '', '1. 操作方法', '2. 計測・GA4', '3. 掲載・運用開始', '4. 修正・変更', '5. 契約・正式手続き',
    '6. その他', '', '例：『2、TOREMOについて』', '受付時間：9:00〜18:00', '内容に応じて担当者よりご案内します。'
  ].join('\n'),
  '【正式手続きの案内】': [
    '正式手続きについてのご連絡ありがとうございます。', '', '【対象サービス】',
    '【希望する手続き】掲載停止・契約変更・解約など', '【希望日】', '【会社名・お名前】', '',
    '内容を確認し、必要な申出先と手順を担当者よりご案内します。',
    '掲載停止などの正式な意思表示は、契約書に定める書面または電子メールでのお申し出が必要です。このLINEへの送信だけでは手続きが完了しない場合があります。',
    '受付時間：9:00〜18:00'
  ].join('\n'),
  '【商材選択】TOREMO': [
    'TOREMO（トレモ）についてのお問い合わせありがとうございます。', '', '該当する内容と詳細をお送りください。',
    '・掲載内容や掲載開始について', '・集客状況について', '・GA4の計測について', '・内容変更や不具合について', '・その他', '',
    '対象ページのURLや画面画像がある場合は、あわせてお送りください。', '受付時間：9:00〜18:00', '確認後、担当者よりご連絡します。'
  ].join('\n'),
  '【商材選択】FORMLINK': [
    'FORMLINK（フォームリンク）についてのお問い合わせありがとうございます。', '', '次の内容を分かる範囲でお送りください。',
    '【対象フォーム・ページURL】', '【ご相談内容】設定・送信・通知・表示・変更など', '【現在の状態】', '【希望する状態】',
    '【画面画像】添付できる場合', '', '受付時間：9:00〜18:00', '確認後、担当者よりご連絡します。'
  ].join('\n'),
  '【商材選択】DR VALUE': [
    'DR VALUE（ディーアール バリュー）についてのお問い合わせありがとうございます。', '', '次の内容を分かる範囲でお送りください。',
    '【対象サイト・ページURL】', '【ご相談内容】SEO・Web改善・計測・変更など', '【確認したい数値やキーワード】',
    '【希望する対応・時期】', '', '受付時間：9:00〜18:00', '内容を確認し、担当者よりご案内します。'
  ].join('\n'),
  '【商材選択】WHITE LABEL': [
    'WHITE LABEL（ホワイトラベル）についてのお問い合わせありがとうございます。', '', '次の内容を分かる範囲でお送りください。',
    '【対象案件・サイト】', '【コンテンツのテーマ】', '【ご相談内容】制作・修正・納期・活用方法など',
    '【希望する内容・時期】', '【参考URL・資料】ある場合', '', '受付時間：9:00〜18:00', '確認後、担当者よりご連絡します。'
  ].join('\n'),
  '【商材選択】業務改善サポート': [
    'AI × 業務改善サポートについてのお問い合わせありがとうございます。', '', '現在の業務と改善したい内容をお送りください。',
    '【対象業務】', '【現在の進め方】', '【困っていること・工数】', '【利用しているツール】', '【改善後の希望】',
    '【希望時期】', '', '受付時間：9:00〜18:00', '内容を整理し、担当者よりご連絡します。'
  ].join('\n'),
  '【商材選択】戦略設計サポート': [
    'AI × 戦略設計サポートについてのお問い合わせありがとうございます。', '', '検討中のテーマを分かる範囲でお送りください。',
    '【事業・サービス概要】', '【達成したい目標】', '【現在の課題】', '【検討している施策】', '【優先順位・希望時期】',
    '【共有できる資料】ある場合', '', '受付時間：9:00〜18:00', '内容を確認し、担当者よりご連絡します。'
  ].join('\n')
};

function followMessage() {
  return [
    '友だち追加ありがとうございます。',
    '株式会社L.EVERの公式LINEです。',
    '',
    'このLINEは、各サービスの保守・運用に関する総合窓口です。',
    '下のメニューから対象のご用件またはサービスをお選びください。',
    '',
    '受付時間：9:00〜18:00',
    '受付時間外のご連絡は、次の受付時間以降に担当者が確認します。',
    '',
    '※パスワード、認証コード、秘密鍵は送信しないでください。'
  ].join('\n');
}

function genericSupportMessage() {
  return [
    'お問い合わせありがとうございます。',
    '内容を確認し、担当者よりご連絡します。',
    '',
    '次の内容を分かる範囲でお送りください。',
    '【対象サービス】',
    '【お問い合わせ内容】',
    '【対象ページ・URL】ある場合',
    '【画面画像・資料】添付できる場合',
    '',
    '受付時間：9:00〜18:00',
    '受付時間外のご連絡は、次の受付時間以降に確認します。'
  ].join('\n');
}

function textMessage(text) {
  return { type: 'text', text: String(text).slice(0, 5000) };
}

async function replyLineMessage(replyToken, messages, accessToken, fetchImpl) {
  if (!accessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN を設定してください。');
  }
  const response = await fetchImpl(REPLY_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ replyToken, messages })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LINE reply API error (${response.status}): ${detail}`);
  }
}
