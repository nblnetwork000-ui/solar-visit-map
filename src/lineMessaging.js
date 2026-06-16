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
    return [
      textMessage(greeting(config)),
      textMessage([
        'ご希望の項目をメニューからお選びください。',
        '',
        '1. ひとまず診断してみる',
        '2. HPを見る',
        '3. 日程調整',
        '4. 補足情報',
        '',
        'メニューが表示されない場合は、番号または項目名を送信してください。'
      ].join('\n'))
    ];
  }
  if (event.type === 'postback') {
    return [textMessage(responseForAction(event.postback?.data || '', config))];
  }
  if (event.type !== 'message' || event.message?.type !== 'text') {
    return [];
  }

  const text = String(event.message.text || '').trim();
  const numberedAction = ({ '1': 'diagnosis', '2': 'homepage', '3': 'consultation', '4': 'supplement' })[text];
  if (numberedAction) {
    return [textMessage(responseForAction(numberedAction, config))];
  }
  const action = keywordAction(text);
  if (action) {
    return [textMessage(responseForAction(action, config))];
  }
  return [textMessage([
    'お問い合わせありがとうございます。',
    '',
    '内容を確認後、担当者よりご案内します。',
    '',
    'より具体的なご案内のため、差し支えなければ以下をお送りください。',
    '・会社名',
    '・ご担当者名',
    '・商品またはサービスURL',
    '・現在のお悩み',
    '',
    'お急ぎの場合は「日程調整」と送信してください。'
  ].join('\n'))];
}

function keywordAction(text) {
  if (/診断|フォーム|ひとまず|申し込/.test(text)) return 'diagnosis';
  if (/仕組み|サービス|概要/.test(text)) return 'service';
  if (/条件|対象/.test(text)) return 'conditions';
  if (/事例|実績/.test(text)) return 'evidence';
  if (/料金|費用|価格/.test(text)) return 'pricing';
  if (/相談|問い合わせ|面談|日程|予定|予約/.test(text)) return 'consultation';
  if (/ホームページ|HP|サイト/.test(text)) return 'homepage';
  if (/補足|詳しく|よくある質問|FAQ|流れ|資料/.test(text)) return 'supplement';
  return '';
}

function responseForAction(data, config) {
  const action = String(data).replace(/^action=/, '');
  const urls = {
    homepage: config.LINE_HOMEPAGE_URL || config.LINE_SERVICE_URL,
    diagnosis: config.LINE_DIAGNOSIS_URL,
    service: config.LINE_SERVICE_URL,
    evidence: config.LINE_EVIDENCE_URL,
    consultation: config.LINE_CONSULTATION_URL,
    supplement: config.LINE_SUPPLEMENT_URL
  };
  switch (action) {
    case 'homepage':
      return withUrl([
        '株式会社L.EVERのHPをご案内します。',
        '',
        'サービス内容、導入対象、実績、会社情報をまとめています。',
        '',
        '自社に合うか迷われる場合は、メニューの「ひとまず診断してみる」からお進みください。'
      ], urls.homepage, 'HPリンクは現在準備中です。確認したい内容をこのままお送りいただければ、担当者がご案内します。');
    case 'diagnosis':
      return withUrl([
        '「ひとまず診断してみる」を選んでいただきありがとうございます。',
        '',
        '現在の集客構造、LP、訴求、問い合わせ導線を確認し、改善の優先順位を整理します。',
        '',
        '入力時間の目安は5〜10分です。ご入力内容を確認後、担当者よりご連絡します。'
      ], urls.diagnosis, [
        '現在はLINE上で簡易診断を受け付けています。',
        '',
        'まずは以下を分かる範囲でお送りください。',
        '・会社名',
        '・商品またはサービス内容',
        '・現在のお悩み',
        '・ホームページやLPのURL（お持ちの場合）'
      ].join('\n'));
    case 'service':
      return withUrl([
        'L.EVERは、AIとデータを活用してBtoB企業の集客構造を設計します。',
        '',
        '広告を始める前に事業構造・LP・訴求・CV導線を診断し、利益が残る改善案を設計します。'
      ], urls.service, '詳しい資料をご希望の場合は「資料希望」とご返信ください。');
    case 'conditions':
      return [
        '導入対象の目安',
        '',
        '・法人向け商材を扱っている',
        '・LPまたは営業導線がある',
        '・数値改善の余地がある',
        '・中長期で集客構造を構築したい',
        '',
        '短期的な結果のみを求める場合や、改善・検証が難しい場合はおすすめしていません。'
      ].join('\n');
    case 'evidence':
      return withUrl([
        'AI動画によるLP流入・CV改善の実測データをご案内します。',
        '',
        '動画再生、LP表示、新規ユーザー、問い合わせなどの推移を確認できます。'
      ], urls.evidence, '事例資料をご希望の場合は「事例希望」とご返信ください。');
    case 'pricing':
      return [
        '料金は、現状の課題と支援範囲を確認したうえで個別に設計します。',
        '',
        '簡易診断後に、必要な施策・期間・費用をご案内します。無理な売り込みは行いません。'
      ].join('\n');
    case 'consultation':
      return withUrl([
        '日程調整をご希望いただきありがとうございます。',
        '',
        '担当者とのオンライン相談をご予約いただけます。',
        '事前に診断フォームをご入力いただくと、当日のご案内がより具体的になります。'
      ], urls.consultation, [
        '現在はLINE上で日程を調整しています。',
        '',
        '会社名と、ご希望日時を2〜3候補お送りください。',
        '',
        '例）6/18 13:00〜、6/19 午前、6/20 15:00以降'
      ].join('\n'));
    case 'supplement':
      return withUrl([
        'ご検討にあたっての補足情報です。',
        '',
        '・対応可能な企業や商材',
        '・診断から提案までの流れ',
        '・料金と支援範囲',
        '・よくあるご質問',
        '',
        'どこから確認すべきか迷われる場合は、「ひとまず診断してみる」からお進みください。'
      ], urls.supplement, [
        '補足情報リンクは現在準備中です。',
        '',
        '確認したい項目をこのままメッセージでお送りください。',
        '例）対応できる業種、料金感、診断の流れ、事例'
      ].join('\n'));
    default:
      return 'ご希望のメニューを下部からお選びください。';
  }
}

function greeting(config) {
  return withUrl([
    '友だち追加ありがとうございます。',
    '株式会社L.EVERの公式LINEです。',
    '',
    'L.EVERは、AIとデータを活用して、BtoB企業の集客構造づくりを支援しています。',
    '',
    '広告費を増やす前に、今のLP・訴求・問い合わせ導線に改善余地があるかを整理できます。',
    '',
    'まずは下のメニューから「ひとまず診断してみる」を選んでください。'
  ], config.LINE_DIAGNOSIS_URL, '診断フォームのリンクは準備中です。このまま「診断希望」と送っていただければ、担当者がご案内します。');
}

function withUrl(lines, url, fallback) {
  return [...lines, '', url ? `▼詳しくはこちら\n${url}` : fallback].join('\n');
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
