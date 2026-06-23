// 補助金検索デモ — 静的JSON + クライアントサイド検索（バックエンド不要）
(function () {
  'use strict';

  var PAGE_SIZE = 20;
  var all = [];        // 全件
  var filtered = [];   // 絞り込み後
  var shown = 0;       // 表示済み件数

  var el = {
    form: document.getElementById('searchForm'),
    kw: document.getElementById('kw'),
    area: document.getElementById('area'),
    purpose: document.getElementById('purpose'),
    sort: document.getElementById('sort'),
    count: document.getElementById('resultCount'),
    list: document.getElementById('cardList'),
    empty: document.getElementById('empty'),
    moreBtn: document.getElementById('moreBtn'),
    year: document.getElementById('year'),
    footNote: document.getElementById('footNote'),
  };

  el.year.textContent = new Date().getFullYear();

  // ---- ユーティリティ ----
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatAmount(yen) {
    if (yen == null) return null;
    var oku = Math.floor(yen / 1e8);
    var man = Math.floor((yen % 1e8) / 1e4);
    if (oku > 0) return man > 0 ? oku + '億' + man.toLocaleString() + '万円' : oku + '億円';
    if (man > 0) return man.toLocaleString() + '万円';
    return yen.toLocaleString() + '円';
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getFullYear() + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2);
  }

  // ---- 絞り込み・並び替え ----
  function applyFilters() {
    var kw = el.kw.value.trim().toLowerCase();
    var area = el.area.value;
    var purpose = el.purpose.value;
    var sort = el.sort.value;

    filtered = all.filter(function (it) {
      if (kw) {
        var hay = (it.title + ' ' + it.summary).toLowerCase();
        if (hay.indexOf(kw) === -1) return false;
      }
      if (area) {
        // 指定地域 もしくは 全国 を含むものにヒット
        if (it.targetAreas.indexOf(area) === -1 && it.targetAreas.indexOf('全国') === -1) return false;
      }
      if (purpose) {
        if (it.usePurposes.indexOf(purpose) === -1) return false;
      }
      return true;
    });

    filtered.sort(function (a, b) {
      if (sort === 'amount') {
        return (b.maxAmount || -1) - (a.maxAmount || -1);
      }
      // 締切が近い順（締切なしは後ろ）
      var ta = a.acceptanceEnd ? new Date(a.acceptanceEnd).getTime() : Infinity;
      var tb = b.acceptanceEnd ? new Date(b.acceptanceEnd).getTime() : Infinity;
      return ta - tb;
    });

    shown = 0;
    el.list.innerHTML = '';
    el.count.innerHTML = '該当する補助金・助成金 <strong>' + filtered.length + '</strong> 件';
    el.empty.hidden = filtered.length !== 0;
    renderMore();
  }

  function renderMore() {
    var next = filtered.slice(shown, shown + PAGE_SIZE);
    var html = next.map(cardHtml).join('');
    el.list.insertAdjacentHTML('beforeend', html);
    shown += next.length;
    el.moreBtn.hidden = shown >= filtered.length;
  }

  function cardHtml(it) {
    var amount = formatAmount(it.maxAmount);
    var end = formatDate(it.acceptanceEnd);
    var areas = it.targetAreas.slice(0, 3).map(function (a) { return esc(a); }).join('・');
    var tags = it.usePurposes.slice(0, 4).map(function (p) {
      return '<li>#' + esc(p) + '</li>';
    }).join('');

    return '' +
      '<li class="card">' +
        '<span class="card-badge">公募中</span>' +
        '<h3 class="card-title">' + esc(it.title) + '</h3>' +
        '<div class="card-sub">' +
          (areas ? '<span>📍 ' + areas + '</span>' : '') +
          (end ? '<span>🗓 締切 ' + esc(end) + '</span>' : '') +
        '</div>' +
        (amount ?
          '<div class="card-amount"><span class="lbl">上限金額</span><span class="val">' + esc(amount) + '</span></div>' : '') +
        (it.summary ? '<p class="card-summary">' + esc(it.summary) + '</p>' : '') +
        (tags ? '<ul class="card-tags">' + tags + '</ul>' : '') +
        (it.sourceUrl ?
          '<a class="card-link" href="' + esc(it.sourceUrl) + '" target="_blank" rel="noopener">公式の詳細を見る ↗</a>' :
          '<span class="card-link" style="color:#94a3b8">公式リンクなし</span>') +
      '</li>';
  }

  // ---- セレクトの選択肢を生成 ----
  function buildOptions() {
    var areas = {}, purposes = {};
    all.forEach(function (it) {
      it.targetAreas.forEach(function (a) { if (a && a !== '全国') areas[a] = true; });
      it.usePurposes.forEach(function (p) { if (p) purposes[p] = true; });
    });
    fill(el.area, Object.keys(areas).sort());
    fill(el.purpose, Object.keys(purposes).sort());
  }
  function fill(select, values) {
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v; o.textContent = v;
      select.appendChild(o);
    });
  }

  // ---- 初期化 ----
  fetch('assets/subsidies.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      all = (data.items || []).map(function (it) {
        it.targetAreas = it.targetAreas || [];
        it.usePurposes = it.usePurposes || [];
        return it;
      });
      buildOptions();
      if (data.generatedAt) {
        var d = new Date(data.generatedAt);
        if (!isNaN(d)) {
          el.footNote.textContent =
            '※本ページはデモです。掲載情報は ' + d.getFullYear() + '年' + (d.getMonth() + 1) + '月 時点のスナップショット（' +
            (data.count || all.length) + '件）であり、最新・正確な内容は各補助金の公式ページでご確認ください。';
        }
      }
      applyFilters();
    })
    .catch(function (e) {
      el.count.textContent = 'データの読み込みに失敗しました。';
      console.error(e);
    });

  // ---- イベント ----
  el.form.addEventListener('submit', function (e) { e.preventDefault(); applyFilters(); });
  el.area.addEventListener('change', applyFilters);
  el.purpose.addEventListener('change', applyFilters);
  el.sort.addEventListener('change', applyFilters);
  el.moreBtn.addEventListener('click', renderMore);
})();
