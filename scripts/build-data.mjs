// 同期APIの応答(stdin)を、デモ用 subsidies.json スキーマに整形して stdout に出力する。
//   curl -s -H "X-License-Key: <key>" http://localhost:8081/api/sync | node scripts/build-data.mjs > assets/subsidies.json
// 100億円(=1e10)を超える上限額は異常値とみなし、デモ表示では金額を非表示(null)にする。

const CAP = 10_000_000_000;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  const src = JSON.parse(raw);
  const items = (src.items || []).map((x) => ({
    id: x.id,
    title: x.title || '',
    summary: (x.summary || '').replace(/\s+/g, ' ').trim(),
    targetAreas: Array.isArray(x.targetAreas) ? x.targetAreas : [],
    usePurposes: Array.isArray(x.usePurposes) ? x.usePurposes : [],
    maxAmount:
      typeof x.maxAmount === 'number' && x.maxAmount > 0 && x.maxAmount <= CAP
        ? x.maxAmount
        : null,
    subsidyRate: x.subsidyRate || null,
    acceptanceEnd: x.acceptanceEnd || null,
    organization: x.organization || null,
    sourceUrl: x.sourceUrl || null,
  }));

  process.stdout.write(
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      count: items.length,
      items,
    })
  );
});
