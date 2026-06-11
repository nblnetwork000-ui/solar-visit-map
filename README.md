# Yahoo!ローカルサーチ API to Google Sheets

キーワードとエリアを入力すると、店舗検索では Yahoo!ローカルサーチ API から店舗名、住所、電話番号、最寄り駅などを取得し、イベント検索では connpass、こくちーずプロ、Doorkeeper の公開検索ページからイベント名、開催日時、会場などを取得して Google スプレッドシートへ追記するローカル専用アプリです。

## セットアップ

1. `.env.example` を `.env` にコピーして設定します。

```bash
cp .env.example .env
```

2. Yahoo!デベロッパーネットワークで Client ID を取得し、`YAHOO_CLIENT_ID` に設定します。

3. Google Cloud で Google Sheets API を有効化し、サービスアカウントを作成します。対象スプレッドシートをサービスアカウントのメールアドレスに共有してください。

4. サービスアカウント JSON は次のどちらかで設定します。

```bash
base64 -i service-account.json
```

出力値を `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` に入れるか、JSON ファイルパスを `GOOGLE_APPLICATION_CREDENTIALS` に指定します。

5. 起動します。Python が入っている場合はこちらです。

```bash
python3 app.py
```

Node.js が入っている場合は、こちらでも起動できます。

```bash
npm start
```

ブラウザで `http://127.0.0.1:3000` を開きます。

## 太陽光訪問マップ

`/pin-status-map.html` では、Googleマップの地名付き航空写真を見ながら太陽光パネルがある家へピンを追加し、住所・地名検索で移動できます。訪問後は `アポ`、`インキ`、`ドアキ`、`アプ`、`再訪`、`対象外`、`留守`、`禁止` へ変更でき、担当者とメモも残せます。

サーバー経由で開くと、ピン情報は `data/pin-status-places.json` または `DATA_DIR/pin-status-places.json` に保存され、同じURLを開いたPC・スマートフォンで共有編集できます。キャリア通信のスマートフォンから使う場合は、インターネット上のサーバーへデプロイし、HTTPSの公開URLで開いてください。

公開運用する場合の `.env` 例です。

```bash
HOST=0.0.0.0
ALLOW_REMOTE_ACCESS=true
PORT=3000
DATA_DIR=/var/data
SHARE_PASSWORD=共有パスワード
SESSION_SECRET=長いランダム文字列
GOOGLE_MAPS_BROWSER_KEY=Google Mapsのブラウザ用APIキー
```

本番デプロイは [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## 追記される列

店舗検索は `店舗リスト` タブへ追記します。

取得日時、店舗名、読み、住所、電話番号、最寄り駅、路線、出口、ジャンル、ジャンルコード、アクセス、URL、緯度、経度、Yahoo UID、Yahoo GID、取得元。

イベント検索は `イベントリスト` タブへ追記します。

取得日時、イベント名、開催開始、開催終了、会場、住所、URL、定員、参加人数、補欠人数、主催者、ハッシュタグ、イベントID、取得元。

イベント検索は既定で今日以降のイベントだけを取得します。画面の `今日以降のイベントのみ` を外すと過去イベントも含めて検索します。
イベント検索の検索元は `connpass`、`こくちーず`、`Doorkeeper`、`全部` から選べます。
イベント検索では、ビジネス系の交流会と判定した追記行だけ薄い黄色で色付けします。

## セキュリティ方針

- サーバーは `127.0.0.1` / `localhost` / `::1` のみで起動できます。
- Yahoo Client ID と Google 認証情報はサーバー側の環境変数だけで扱い、ブラウザへ返しません。
- CSP、クリックジャッキング抑止、MIME sniffing 抑止、権限ポリシーを有効化しています。
- JSON body は 20KB に制限しています。
- 15分あたりのリクエスト数を `REQUESTS_PER_15_MIN` で制限します。
- 入力は長さ、型、件数、並び順をサーバー側で検証します。
- 店舗検索の重複追記は `Yahoo UID + Yahoo GID` と `店舗名 + 住所 + 電話番号` で既定スキップします。
- イベント検索の重複追記は `イベントID` または `イベントURL` で既定スキップします。
- `.env` と認証 JSON は `.gitignore` に含めています。

## 参照した公式ドキュメント

- Yahoo!ローカルサーチ API: https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/localsearch.html
- Google Sheets API Node.js Quickstart: https://developers.google.com/workspace/sheets/api/quickstart/nodejs
- Google Sheets values.append: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append
