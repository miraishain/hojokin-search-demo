# hojokin-search-demo

ミライシャイン「補助金検索サービス」の**営業デモ用 静的サイト**。

- 完全な静的サイト（HTML/CSS/JS のみ）。バックエンド・サーバー管理は不要。
- 補助金データは `assets/subsidies.json`（**取得時点のスナップショット**）を読み込み、
  検索・絞り込み・並び替えを**ブラウザのJavaScriptだけ**で行う。
- GitHub Pages にそのまま載せて、見込み客に検索動作を試してもらうための環境。

> ⚠️ これは「デモ」です。本番の製品は WordPress プラグイン（サーバーサイドHTML/SEO・
> 詳細ページ・問い合わせ・ライセンス制御・毎日の自動同期）であり、本リポジトリとは別物です。

## 構成

```
index.html          LP＋検索UI
assets/style.css     スタイル（ミライシャイン デザイン）
assets/app.js        クライアントサイド検索（subsidies.json を読む）
assets/subsidies.json データ スナップショット
```

## データの更新（スナップショット再生成）

同期API（GCP / ローカル）を起動した状態で、API応答を整形して `subsidies.json` を作り直す：

```bash
curl -s -H "X-License-Key: <key>" "http://localhost:8081/api/sync" \
  | node scripts/build-data.mjs > assets/subsidies.json
```

※ 100億円超の異常な上限額はデモ表示では除外（null）している。

## 公開（GitHub Pages）

Settings → Pages → Source: `main` / root。`https://<org>.github.io/hojokin-search-demo/` で公開。

## 出典

- 出典：Jグランツ（デジタル庁）／ ミラサポplus（中小企業庁）
- 政府標準利用規約・CC BY 準拠。クレジット表記のうえ利用。
