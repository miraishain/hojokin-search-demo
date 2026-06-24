(function () {
  'use strict';

  var root = document.getElementById('detailRoot');
  var footNote = document.getElementById('footNote');
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatYen(yen) {
    if (yen == null) return '登録なし';
    return Number(yen).toLocaleString('ja-JP') + '円';
  }

  function formatDateJa(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function textList(values) {
    return values && values.length ? values.map(esc).join('、') : '登録なし';
  }

  function purposeHtml(values) {
    if (!values || !values.length) return '登録なし';
    return values.map(function (v) { return '<span>' + esc(v) + '</span>'; }).join(' ');
  }

  function summaryHtml(summary) {
    if (!summary) return '<p>概要情報は登録されていません。</p>';
    var normalized = summary.replace(/\s*■/g, '\n■').trim();
    var blocks = normalized.split(/\n+/).filter(Boolean);
    return blocks.map(function (block) {
      var m = block.match(/^■([^ 　]+(?:・[^ 　]+)?)[ 　]*(.*)$/);
      if (m) {
        return '<h3>' + esc(m[1]) + '</h3>' + (m[2] ? '<p>' + esc(m[2]) + '</p>' : '');
      }
      return '<p>' + esc(block) + '</p>';
    }).join('');
  }

  function renderNotFound(message) {
    document.title = '補助金詳細｜ミライシャイン';
    root.innerHTML = '' +
      '<nav class="breadcrumb" aria-label="パンくず">' +
        '<a href="./">補助金検索トップ</a>' +
      '</nav>' +
      '<section class="detail-empty">' +
        '<h1>詳細を表示できません</h1>' +
        '<p>' + esc(message) + '</p>' +
        '<a class="detail-back" href="./">検索トップへ戻る</a>' +
      '</section>';
  }

  function renderDetail(item) {
    var end = formatDateJa(item.acceptanceEnd);
    var rows = [
      ['補助上限額', formatYen(item.maxAmount)],
      ['補助率', item.subsidyRate ? esc(item.subsidyRate) : '登録なし'],
      ['募集期間', end ? end + 'まで' : '登録なし'],
      ['実施機関', item.organization ? esc(item.organization) : '登録なし'],
      ['対象地域', textList(item.targetAreas)],
      ['用途', purposeHtml(item.usePurposes)]
    ];
    var rowsHtml = rows.map(function (row) {
      return '<div class="detail-row"><dt>' + row[0] + '</dt><dd>' + row[1] + '</dd></div>';
    }).join('');

    document.title = item.title + '｜ミライシャイン';
    root.innerHTML = '' +
      '<nav class="breadcrumb" aria-label="パンくず">' +
        '<a href="./">補助金検索トップ</a>' +
        '<span>›</span>' +
        '<span>' + esc(item.title) + '</span>' +
      '</nav>' +
      '<header class="detail-header">' +
        '<h1>' + esc(item.title) + '</h1>' +
      '</header>' +
      '<dl class="detail-table">' + rowsHtml + '</dl>' +
      '<section class="detail-summary">' +
        '<h2>概要</h2>' +
        '<div class="summary-body">' + summaryHtml(item.summary) + '</div>' +
      '</section>' +
      '<div class="detail-actions">' +
        '<a class="detail-back" href="./">検索トップへ戻る</a>' +
        (item.sourceUrl ? '<a class="detail-official" href="' + esc(item.sourceUrl) + '" target="_blank" rel="noopener">公式サイトで確認</a>' : '') +
      '</div>';
  }

  var id = new URLSearchParams(location.search).get('id');
  if (!id) {
    renderNotFound('補助金IDが指定されていません。');
    return;
  }

  fetch('assets/subsidies.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.generatedAt && footNote) {
        var d = new Date(data.generatedAt);
        if (!isNaN(d)) {
          footNote.textContent =
            '本ページはデモです。掲載情報は ' + d.getFullYear() + '年' + (d.getMonth() + 1) + '月 時点のスナップショット（' +
            (data.count || (data.items || []).length) + '件）であり、最新・正確な内容は各補助金の公式ページでご確認ください。';
        }
      }

      var item = (data.items || []).find(function (it) { return it.id === id; });
      if (!item) {
        renderNotFound('指定された補助金は見つかりませんでした。');
        return;
      }
      item.targetAreas = item.targetAreas || [];
      item.usePurposes = item.usePurposes || [];
      renderDetail(item);
    })
    .catch(function () {
      renderNotFound('データの読み込みに失敗しました。');
    });
})();
