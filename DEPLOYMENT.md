# 本番運用手順

このアプリは、Googleマップの航空写真上で太陽光パネルがある家をピン管理する共有アプリです。

## 本番で必須のもの

- Google Maps JavaScript API と Geocoding API が使えるブラウザ用APIキー
- 共有パスワード
- 本格運用では永続保存できるサーバー

## Renderで公開する

1. このフォルダをGitHubリポジトリへpushします。
2. RenderでNew Blueprintを選び、このリポジトリを接続します。
3. `render.yaml` が読み込まれたら、環境変数を入力します。

必須の環境変数:

```bash
SHARE_PASSWORD=現場メンバーに共有するパスワード
GOOGLE_MAPS_BROWSER_KEY=Google Mapsのブラウザ用APIキー
```

`SESSION_SECRET` はRender側で自動生成されます。

4. デプロイ完了後、Renderの `https://...onrender.com` URLを開きます。
5. 共有パスワードでログインします。
6. スマートフォンでは同じURLをSafari/Chromeで開き、ホーム画面に追加して使います。

## 保存データ

現在の `render.yaml` は、カード登録を避けてまず公開URLを作るための無料試用構成です。ピン情報はサーバー内の `data/pin-status-places.json` に保存されますが、無料環境では再デプロイや再起動で消える可能性があります。

本格運用でピン情報を守る場合は、次のどちらかに切り替えます。

- Renderの永続ディスクを追加し、`DATA_DIR=/var/data` を設定する
- Google Sheetsなど外部ストレージへ保存する

## Google Maps APIキーの制限

Google Cloud ConsoleでAPIキーにHTTPリファラー制限を設定してください。

例:

```text
https://solar-visit-map.onrender.com/*
```

独自ドメインを使う場合は、そのドメインも追加します。

## 公開後の注意

- URLと共有パスワードを知っている人は編集できます。
- 全消去ボタンは誤操作防止のため画面から外しています。ピンを選択してから `ピン削除` で1件ずつ削除します。
- 本格運用前にCSVを書き出してバックアップできることを確認してください。
- 無料試用構成では、重要なピン情報はこまめにCSVでバックアップしてください。
- 担当者ごとの編集履歴が必要になったら、次の拡張としてログ記録を追加してください。
