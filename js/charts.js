const D = matchMedia('(prefers-color-scheme:dark)').matches;
const gc = D ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
const tc = D ? '#aaa' : '#777';
const charts = {};

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, maxRotation: 30 } },
    y: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 } } }
  }
};

const C = {
  blue: '#378ADD', amber: '#EF9F27', teal: '#1D9E75',
  pink: '#D4537E', gray: '#888780',  red: '#D85A30',
  navy: '#185FA5', purple: '#7F77DD',
};

function mkChart(id, cfg) {
  if (charts[id]) charts[id].destroy();
  const el = document.getElementById(id);
  if (!el) return;
  charts[id] = new Chart(el, cfg);
}

function setLegend(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(i =>
    `<span><span class="legend-dot" style="background:${i.color};${i.dash ? 'border:1px dashed #999' : ''}"></span>${i.label}</span>`
  ).join('');
}

function buildKPI(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}${k.sub ? '<span class="kpi-sub"> · ' + k.sub + '</span>' : ''}</div>
      <div class="kpi-note ${k.trend}">${k.note}</div>
    </div>
  `).join('');
}

function buildToggle(id, items, onClickFn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map((item, i) => `
    <button class="toggle-btn ${i === 0 ? 'active' : ''}"
      onclick="toggleActive(this,'${id}'); ${onClickFn}('${item.value}')">
      ${item.label}
    </button>
  `).join('');
}

function toggleActive(btn, groupId) {
  document.querySelectorAll(`#${groupId} .toggle-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function buildMonthCombo(canvasId, lgId, noteId, dataObj, curYear, prevYear, c1, c2) {
  const cy = dataObj[parseInt(curYear)];
  const py = dataObj[parseInt(prevYear)];
  const labs = [], cur = [], prev = [];
  cy.forEach((v, i) => { labs.push(MONTHS[i]); cur.push(v); prev.push(py[i]); });
  setLegend(lgId, [{ color: c2, label: prevYear + '년(전년)' }, { color: c1, label: curYear + '년' }]);
  document.getElementById(noteId).innerHTML = '';
  mkChart(canvasId, {
    type: 'bar',
    data: {
      labels: labs,
      datasets: [
        { type: 'bar', data: prev, backgroundColor: c2 + '88', yAxisID: 'y', order: 2 },
        { type: 'bar', data: cur,  backgroundColor: c1 + 'cc', yAxisID: 'y', order: 3 }
      ]
    },
    options: {
      ...baseOpts,
      scales: {
        x: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, autoSkip: false, maxRotation: 35 } },
        y: { grid: { color: gc }, ticks: { color: tc, font: { size: 10 }, callback: v => v.toLocaleString() } }
      }
    }
  });
}

// ══════════════════════════════════════════════
// S1: 인구 규모·구조
// ══════════════════════════════════════════════
function initS1() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s1', d.kpi.s1);
  setLegend('lg-pop', [
    { color: C.navy + '99', label: '총인구(인구총조사)' },
    { color: C.blue + '99', label: '등록인구' },
    { color: C.red, label: '생활인구', dash: true },
  ]);
  mkChart('c_pop', {
    type: 'bar',
    data: {
      labels: d.population.years,
      datasets: [
        { type: 'bar',  label: '총인구',   data: d.population.total,      backgroundColor: C.navy + '55', yAxisID: 'y', order: 3 },
        { type: 'bar',  label: '등록인구', data: d.population.registered,  backgroundColor: C.blue + '88', yAxisID: 'y', order: 2 },
        { type: 'line', label: '생활인구', data: d.population.living,      borderColor: C.red, backgroundColor: 'transparent', pointRadius: 4, tension: 0.3, borderDash: [4, 3], yAxisID: 'y', order: 1 },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '만' } } },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } } }
    }
  });
  setLegend('lg-age', [{ color: C.navy, label: '유소년' }, { color: C.teal, label: '생산연령' }, { color: C.red, label: '고령' }]);
  mkChart('c_age', {
    type: 'bar',
    data: {
      labels: d.ageStructure.years,
      datasets: [
        { label: '유소년',   data: d.ageStructure.youth,   backgroundColor: C.navy },
        { label: '생산연령', data: d.ageStructure.working, backgroundColor: C.teal },
        { label: '고령',     data: d.ageStructure.elderly, backgroundColor: C.red },
      ]
    },
    options: { ...baseOpts, scales: { x: { ...baseOpts.scales.x, stacked: true }, y: { ...baseOpts.scales.y, stacked: true, max: 100, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } } } }
  });
  setLegend('lg-sex', [{ color: C.purple, label: '서울 20대' }, { color: '#B4B2A9', label: '서울 전체', dash: true }]);
  mkChart('c_sex', {
    type: 'line',
    data: {
      labels: d.sexRatio20s.years,
      datasets: [
        { data: d.sexRatio20s.seoul20s, borderColor: C.purple,  tension: 0.3, pointRadius: 3 },
        { data: d.sexRatio20s.seoulAll, borderColor: '#B4B2A9', tension: 0.3, pointRadius: 3, borderDash: [4, 3] }
      ]
    },
    options: { ...baseOpts, scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, min: 85 } } }
  });
  renderDistrictChart();
  renderForeignRatioChart();
  document.getElementById('districtSort').addEventListener('change', renderDistrictChart);
}

// ══════════════════════════════════════════════
// S2: 출생·혼인 동향
// ══════════════════════════════════════════════
let birthRegion = 'seoul';
function drawBirthChart(region) {
  birthRegion = region;
  const d = DASHBOARD_DATA;
  const births = region === 'seoul' ? d.birthAnnual.seoul : d.birthAnnual.national;
  const tfr    = region === 'seoul' ? d.fertilityRate.seoul : d.fertilityRate.national;
  const col    = region === 'seoul' ? C.navy : C.teal;
  const labels = d.birthAnnual.years.map(String);
  setLegend('lg-birth', [
    { color: col, label: region === 'seoul' ? '서울 출생아수' : '전국 출생아수' },
    { color: C.red, label: '합계출산율', dash: true }
  ]);
  mkChart('c_birth', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { type: 'bar',  data: births, backgroundColor: col + '99', yAxisID: 'y',  order: 2 },
        { type: 'line', data: tfr,    borderColor: C.red, pointRadius: 4, tension: 0.3, yAxisID: 'y1', order: 1 }
      ]
    },
    options: {
      ...baseOpts,
      plugins: { legend: { display: false } },
      scales: {
        x:  { ...baseOpts.scales.x, ticks: { color: tc, font: { size: 10 }, maxRotation: 45 } },
        y:  { position: 'left',  grid: { color: gc }, min: 0, ticks: { color: tc, font: { size: 10 }, callback: v => region === 'seoul' ? Math.round(v / 1000) + '천' : Math.round(v / 10000) + '만' } },
        y1: { position: 'right', min: 0.4, max: region === 'seoul' ? 1.5 : 1.7, grid: { display: false }, ticks: { color: tc, font: { size: 10 }, callback: v => v.toFixed(2) } }
      }
    }
  });
}

function initS2() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s2', d.kpi.s2);
  buildToggle('tg-birth-region', [{ label: '서울', value: 'seoul' }, { label: '전국', value: 'national' }], 'setBirthRegion');
  drawBirthChart('seoul');
  buildToggle('tg-birth', [{ label: '2024년', value: '2024' }, { label: '2025년', value: '2025' }, { label: '2026년', value: '2026' }], 'setBirthYear');
  buildMonthCombo('c_bmonth', 'lg-bmonth', 'note-bmonth', d.birthMonthly, '2024', '2023', C.navy, '#85B7EB');
  buildToggle('tg-marry', [{ label: '2024년', value: '2024' }, { label: '2025년', value: '2025' }, { label: '2026년', value: '2026' }], 'setMarryYear');
  buildMonthCombo('c_mmonth', 'lg-mmonth', 'note-mmonth', d.marryMonthly, '2024', '2023', C.purple, '#AFA9EC');
  setLegend('lg-marry', [{ color: C.navy, label: '혼인' }, { color: C.gray, label: '이혼', dash: true }]);
  mkChart('c_marry', {
    type: 'line',
    data: {
      labels: d.marryAnnual.years,
      datasets: [
        { data: d.marryAnnual.values,   borderColor: C.navy, tension: 0.3, pointRadius: 3 },
        { data: d.divorceAnnual.values, borderColor: C.gray, tension: 0.3, pointRadius: 3, borderDash: [4, 3] }
      ]
    },
    options: { ...baseOpts, scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => (v / 10000).toFixed(1) + '만' } } } }
  });
}

// ══════════════════════════════════════════════
// S3: 가구 구조  ★ 핵심 변경 구간
// ══════════════════════════════════════════════

// 가구원수별 원시 가구수 룩업 (householdSize.years 순서와 동일)
// [1990, 1995, 2000, 2005, 2010, 2015, 2022, 2023, 2024]
const _hhRaw = {
  '1인':    [ 257382,  382024,  502245,  675739,  854606, 1115744, 1564187, 1627480, 1660813],
  '2인':    [ 330684,  426210,  524663,  670455,  781527,  930467, 1076409, 1080790, 1090555],
  '3인':    [ 537364,  615127,  670538,  732043,  788115,  817440,  776479,  774023,  772973],
  '4인':    [ 914443,  996854,  989621,  917243,  807836,  701945,  544807,  528911,  511523],
  '5인이상':[ 775148,  545579,  398869,  314410,  272213,  218894,  136936,  130455,  123638],
};
// 총가구수 (만 단위, householdSize.years 순서와 동일)
const _hhTotal = [281, 297, 309, 331, 350, 378, 410, 414, 416];

// 세대구성별 원시 가구수 룩업 (singleHH1p.years 순서와 동일)
// [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
const _genRaw = {
  '2세대': [1804454, 1775431, 1740777, 1710502, 1691450, 1644223, 1611980, 1593557, 1573061],
  '1인':   [1138860, 1180540, 1229421, 1299787, 1390701, 1489893, 1564187, 1627480, 1660813],
  '1세대': [ 598233,  614037,  626988,  645266,  665193,  680825,  689093,  685396,  687649],
  '3세대': [ 181625,  173908,  164734,  155420,  142292,  131646,  125014,  121065,  116025],
};
// 세대구성별 총가구수 (만 단위)
const _genTotal = [378, 381, 384, 390, 398, 405, 410, 414, 416];

// 가구 탭 상태
let hhTab = 'hh'; // 'hh' | 'gen'

function drawHouseholdChart() {
  if (hhTab === 'hh') {
    const d = DASHBOARD_DATA.householdSize;
    mkChart('c_household', {
      data: {
        labels: d.years.map(String),
        datasets: [
          // 총가구수 막대 (왼쪽 y축, 연한 회색)
          {
            type: 'bar',
            label: '총가구',
            data: _hhTotal,
            backgroundColor: 'rgba(180,178,169,0.35)',
            hoverBackgroundColor: 'rgba(180,178,169,0.55)',
            yAxisID: 'yBar',
            order: 2,
            barPercentage: 0.7,
            categoryPercentage: 0.75,
          },
          // 비중 선 (오른쪽 y축)
          { type: 'line', label: '1인',    data: d.h1,     borderColor: '#185FA5', backgroundColor: '#185FA5', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1 },
          { type: 'line', label: '2인',    data: d.h2,     borderColor: '#1D9E75', backgroundColor: '#1D9E75', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1, borderDash: [5, 3] },
          { type: 'line', label: '3인',    data: d.h3,     borderColor: '#888780', backgroundColor: '#888780', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1, borderDash: [2, 4] },
          { type: 'line', label: '4인',    data: d.h4,     borderColor: '#BA7517', backgroundColor: '#BA7517', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1, borderDash: [6, 2] },
          { type: 'line', label: '5인이상', data: d.h5plus, borderColor: '#D85A30', backgroundColor: '#D85A30', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1, borderDash: [4, 4] },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => items[0].label + '년',
              label(ctx) {
                const lbl = ctx.dataset.label;
                if (lbl === '총가구') return ` 총가구: ${ctx.raw}만 가구`;
                const n = _hhRaw[lbl]?.[ctx.dataIndex];
                return n !== undefined
                  ? ` ${lbl}: ${n.toLocaleString()}가구 (${ctx.raw}%)`
                  : ` ${lbl}: ${ctx.raw}%`;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, maxRotation: 0 } },
          yBar:  { position: 'left',  grid: { color: gc }, ticks: { color: tc, font: { size: 10 }, callback: v => v + '만' }, title: { display: false } },
          yLine: { position: 'right', grid: { display: false }, min: 0, max: 55, ticks: { color: tc, font: { size: 10 }, callback: v => v + '%' } }
        }
      }
    });
  } else {
    const d = DASHBOARD_DATA.singleHH1p;
    mkChart('c_household', {
      data: {
        labels: d.years.map(String),
        datasets: [
          {
            type: 'bar',
            label: '총가구',
            data: _genTotal,
            backgroundColor: 'rgba(180,178,169,0.35)',
            hoverBackgroundColor: 'rgba(180,178,169,0.55)',
            yAxisID: 'yBar',
            order: 2,
            barPercentage: 0.7,
            categoryPercentage: 0.75,
          },
          { type: 'line', label: '2세대', data: d.gen2,    borderColor: '#D85A30', backgroundColor: '#D85A30', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1 },
          { type: 'line', label: '1인',   data: d.single1p, borderColor: '#185FA5', backgroundColor: '#185FA5', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1, borderDash: [5, 3] },
          { type: 'line', label: '1세대', data: d.gen1,    borderColor: '#1D9E75', backgroundColor: '#1D9E75', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1, borderDash: [2, 4] },
          { type: 'line', label: '3세대', data: d.gen3,    borderColor: '#888780', backgroundColor: '#888780', pointRadius: 4, tension: 0.3, yAxisID: 'yLine', order: 1, borderDash: [6, 2] },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => items[0].label + '년',
              label(ctx) {
                const lbl = ctx.dataset.label;
                if (lbl === '총가구') return ` 총가구: ${ctx.raw}만 가구`;
                const n = _genRaw[lbl]?.[ctx.dataIndex];
                return n !== undefined
                  ? ` ${lbl}: ${n.toLocaleString()}가구 (${ctx.raw}%)`
                  : ` ${lbl}: ${ctx.raw}%`;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, maxRotation: 0 } },
          yBar:  { position: 'left',  grid: { color: gc }, ticks: { color: tc, font: { size: 10 }, callback: v => v + '만' } },
          yLine: { position: 'right', grid: { display: false }, min: 0, max: 55, ticks: { color: tc, font: { size: 10 }, callback: v => v + '%' } }
        }
      }
    });
  }

  // 범례 업데이트 (오른쪽 세로 배치)
  const lgEl = document.getElementById('lg-household');
  if (!lgEl) return;
  const hhItems = hhTab === 'hh'
    ? [
        { color: 'rgba(180,178,169,0.8)', label: '총가구(막대)' },
        { color: '#185FA5', label: '1인' },
        { color: '#1D9E75', label: '2인' },
        { color: '#888780', label: '3인' },
        { color: '#BA7517', label: '4인' },
        { color: '#D85A30', label: '5인이상' },
      ]
    : [
        { color: 'rgba(180,178,169,0.8)', label: '총가구(막대)' },
        { color: '#D85A30', label: '2세대' },
        { color: '#185FA5', label: '1인' },
        { color: '#1D9E75', label: '1세대' },
        { color: '#888780', label: '3세대' },
      ];
  lgEl.innerHTML = hhItems.map(i =>
    '<span style="display:flex;align-items:center;gap:5px;white-space:nowrap;">' +
    '<span style="width:10px;height:10px;border-radius:2px;background:' + i.color + ';flex-shrink:0;"></span>' +
    i.label + '</span>'
  ).join('');
}

function switchHHTab(tab) {
  hhTab = tab;
  document.querySelectorAll('#tg-household .toggle-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && tab === 'hh') || (i === 1 && tab === 'gen'));
  });
  drawHouseholdChart();
}

function initS3() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s3', d.kpi.s3);

  // 탭 토글 빌드
  const tgEl = document.getElementById('tg-household');
  if (tgEl) {
    tgEl.innerHTML = `
      <button class="toggle-btn active" onclick="switchHHTab('hh')">가구원수별</button>
      <button class="toggle-btn" onclick="switchHHTab('gen')">세대구성별</button>
    `;
  }

  // 첫 렌더
  hhTab = 'hh';
  drawHouseholdChart();

  // 1인가구 연령별 시계열
  const sd = d.singleHHAgeTrend;
  // 범례 오른쪽 세로 배치
  (function() {
    const el = document.getElementById('lg-1page');
    if (!el) return;
    const items = [
      { color: '#B5D4F4', label: '24세이하' }, { color: '#185FA5', label: '25~34세' },
      { color: '#1D9E75', label: '35~44세'  }, { color: '#EF9F27', label: '45~54세' },
      { color: '#D4537E', label: '55~64세'  }, { color: '#D85A30', label: '65세이상' },
    ];
    el.innerHTML = items.map(i =>
      '<span style="display:flex;align-items:center;gap:5px;white-space:nowrap;">' +
      '<span style="width:10px;height:10px;border-radius:2px;background:' + i.color + ';flex-shrink:0;"></span>' +
      i.label + '</span>'
    ).join('');
  })();
  mkChart('c_1page', {
    type: 'bar',
    data: {
      labels: sd.years,
      datasets: [
        { label: '24세이하', data: sd.age24,  backgroundColor: '#B5D4F4', stack: 'a' },
        { label: '25~34세', data: sd.age34,  backgroundColor: C.navy,    stack: 'a' },
        { label: '35~44세', data: sd.age44,  backgroundColor: C.teal,    stack: 'a' },
        { label: '45~54세', data: sd.age54,  backgroundColor: C.amber,   stack: 'a' },
        { label: '55~64세', data: sd.age64,  backgroundColor: C.pink,    stack: 'a' },
        { label: '65세이상', data: sd.age65p, backgroundColor: C.red,     stack: 'a' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}명` } }
      },
      scales: {
        x: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 11 } } },
        y: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, callback: v => (v / 10000).toFixed(0) + '만' } }
      }
    }
  });

  renderDistrict1pChart();
}

function renderDistrict1pChart() {
  const d = DASHBOARD_DATA.districtSingleHH;
  const bgPlugin = {
    id: 'zoneBg',
    beforeDraw(chart) {
      const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
      if (!x) return;
      const zones = [
        { from: 0,  to: 2,  color: 'rgba(79,129,189,0.06)'  },
        { from: 3,  to: 9,  color: 'rgba(155,187,89,0.06)'  },
        { from: 10, to: 13, color: 'rgba(128,100,162,0.06)' },
        { from: 14, to: 20, color: 'rgba(247,150,70,0.06)'  },
        { from: 21, to: 24, color: 'rgba(192,80,77,0.06)'   },
      ];
      zones.forEach(z => {
        const x0 = x.getPixelForValue(z.from) - x.width / x.ticks.length / 2;
        const x1 = x.getPixelForValue(z.to)   + x.width / x.ticks.length / 2;
        ctx.save(); ctx.fillStyle = z.color;
        ctx.fillRect(x0, top, x1 - x0, bottom - top);
        ctx.restore();
      });
    }
  };
  mkChart('c_district_1p', {
    type: 'bar',
    data: {
      labels: d.districts,
      datasets: [
        { label: '24세이하', data: d.age24,  backgroundColor: '#B5D4F4', stack: 'a' },
        { label: '25~34세', data: d.age34,  backgroundColor: C.navy,    stack: 'a' },
        { label: '35~44세', data: d.age44,  backgroundColor: C.teal,    stack: 'a' },
        { label: '45~54세', data: d.age54,  backgroundColor: C.amber,   stack: 'a' },
        { label: '55~64세', data: d.age64,  backgroundColor: C.pink,    stack: 'a' },
        { label: '65세이상', data: d.age65p, backgroundColor: C.red,     stack: 'a' },
      ]
    },
    plugins: [bgPlugin],
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label:  ctx => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}명`,
            footer: items => `합계: ${items.reduce((s, i) => s + (i.raw || 0), 0).toLocaleString()}명`
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 10 }, maxRotation: 35 } },
        y: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, callback: v => (v / 10000).toFixed(0) + '만' } }
      }
    }
  });
  // 자치구 차트 범례 오른쪽 세로 배치
  (function() {
    const el = document.getElementById('lg-district-1p');
    if (!el) return;
    const items = [
      { color: '#B5D4F4', label: '24세이하' }, { color: '#185FA5', label: '25~34세' },
      { color: '#1D9E75', label: '35~44세'  }, { color: '#EF9F27', label: '45~54세' },
      { color: '#D4537E', label: '55~64세'  }, { color: '#D85A30', label: '65세이상' },
    ];
    el.innerHTML = items.map(i =>
      '<span style="display:flex;align-items:center;gap:5px;white-space:nowrap;">' +
      '<span style="width:10px;height:10px;border-radius:2px;background:' + i.color + ';flex-shrink:0;"></span>' +
      i.label + '</span>'
    ).join('');
  })();
}

// ══════════════════════════════════════════════
// S4: 인구이동
// ══════════════════════════════════════════════
function initS4() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s4', d.kpi.s4);
  mkChart('c_move', {
    type: 'bar',
    data: {
      labels: d.netMigration.years,
      datasets: [{ data: d.netMigration.values, backgroundColor: d.netMigration.values.map(v => v < 0 ? 'rgba(216,90,48,0.7)' : 'rgba(29,158,117,0.7)') }]
    },
    options: { ...baseOpts, scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => Math.round(v / 10000) + '만' } } } }
  });
  mkChart('c_mage', {
    type: 'bar',
    data: {
      labels: d.netMigrationByAge2025.labels,
      datasets: [{ data: d.netMigrationByAge2025.values, backgroundColor: d.netMigrationByAge2025.values.map(v => v >= 0 ? 'rgba(24,95,165,0.75)' : 'rgba(216,90,48,0.75)') }]
    },
    options: { ...baseOpts, indexAxis: 'y', scales: { x: { ...baseOpts.scales.x, ticks: { color: tc, font: { size: 10 }, callback: v => v.toLocaleString() } }, y: baseOpts.scales.y } }
  });
  mkChart('c_reason', {
    type: 'bar',
    data: {
      labels: d.netMigrationByReason2025.labels,
      datasets: [{ data: d.netMigrationByReason2025.values, backgroundColor: d.netMigrationByReason2025.values.map(v => v >= 0 ? 'rgba(24,95,165,0.75)' : 'rgba(216,90,48,0.75)') }]
    },
    options: { ...baseOpts, scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v.toLocaleString() } } } }
  });
}

// ══════════════════════════════════════════════
// S5: 외국인
// ══════════════════════════════════════════════
function initS5() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s5', d.kpi.s5);
  mkChart('c_for_type', {
    type: 'bar',
    data: {
      labels: d.foreignResidentType.years.map(String),
      datasets: [
        { label: '외국인근로자', data: d.foreignResidentType.worker,      backgroundColor: '#4F81BD', stack: 'a' },
        { label: '외국국적동포', data: d.foreignResidentType.ethnic,      backgroundColor: '#8064A2', stack: 'a' },
        { label: '기타외국인',   data: d.foreignResidentType.other,       backgroundColor: '#F79646', stack: 'a' },
        { label: '유학생',       data: d.foreignResidentType.student,     backgroundColor: '#9BBB59', stack: 'a' },
        { label: '결혼이민자',   data: d.foreignResidentType.marriage,    backgroundColor: '#C0504D', stack: 'a' },
        { label: '한국국적취득', data: d.foreignResidentType.naturalized, backgroundColor: '#4BACC6', stack: 'a' },
        { label: '자녀(출생)',   data: d.foreignResidentType.child,       backgroundColor: '#D9D9D9', stack: 'a' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index' },
      plugins: {
        legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}명`, footer: items => `합계: ${items.reduce((s, i) => s + (i.raw || 0), 0).toLocaleString()}명` } }
      },
      scales: {
        x: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 11 } } },
        y: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, callback: v => (v / 10000).toFixed(0) + '만' } }
      }
    }
  });
  mkChart('c_for_visa', {
    type: 'line',
    data: {
      labels: d.foreignVisaType.years.map(String),
      datasets: [
        { label: '유학(D-2)',     data: d.foreignVisaType.D2, borderColor: '#9BBB59', borderWidth: 3, pointRadius: 4, tension: 0.3 },
        { label: '방문취업(H-2)', data: d.foreignVisaType.H2, borderColor: '#C0504D', borderWidth: 3, pointRadius: 4, tension: 0.3 },
        { label: '영주(F-5)',     data: d.foreignVisaType.F5, borderColor: '#4F81BD', borderWidth: 2, pointRadius: 3, tension: 0.3 },
        { label: '결혼이민(F-6)', data: d.foreignVisaType.F6, borderColor: '#8064A2', borderWidth: 2, pointRadius: 3, tension: 0.3 },
        { label: '방문동거(F-1)', data: d.foreignVisaType.F1, borderColor: '#F79646', borderWidth: 2, pointRadius: 3, tension: 0.3 },
        { label: '일반연수(D-4)', data: d.foreignVisaType.D4, borderColor: '#4BACC6', borderWidth: 2, pointRadius: 3, tension: 0.3 },
        { label: '거주(F-2)',     data: d.foreignVisaType.F2, borderColor: '#948A54', borderWidth: 2, pointRadius: 3, tension: 0.3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index' },
      plugins: {
        legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}명` } }
      },
      scales: {
        x: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 } } },
        y: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, callback: v => (v / 10000).toFixed(0) + '만' } }
      }
    }
  });
  setLegend('lg-for', [
    { color: C.navy, label: '중국' }, { color: C.red, label: '베트남', dash: true },
    { color: C.teal, label: '미국', dash: true }, { color: C.gray, label: '그 외', dash: true }
  ]);
  mkChart('c_for', {
    type: 'line',
    data: {
      labels: d.foreignNationality.years,
      datasets: [
        { label: '중국',   data: d.foreignNationality.china,   borderColor: C.navy, tension: 0.3, pointRadius: 3 },
        { label: '베트남', data: d.foreignNationality.vietnam, borderColor: C.red,  tension: 0.3, pointRadius: 3, borderDash: [4, 3] },
        { label: '미국',   data: d.foreignNationality.usa,     borderColor: C.teal, tension: 0.3, pointRadius: 3, borderDash: [2, 4] },
        { label: '그 외',  data: d.foreignNationality.others,  borderColor: C.gray, tension: 0.3, pointRadius: 3, borderDash: [6, 2] },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } } },
      plugins: { legend: { display: false } }
    }
  });
}

// ══════════════════════════════════════════════
// S6: 장래 추계
// ══════════════════════════════════════════════
function initS6() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s6', d.kpi.s6);
  setLegend('lg-proj', [{ color: C.navy, label: '총인구(만명)' }, { color: C.red, label: '고령비중(%)', dash: true }, { color: C.teal, label: '1인가구비중(%)', dash: true }]);
  mkChart('c_proj', {
    type: 'line',
    data: {
      labels: d.projection.years,
      datasets: [
        { type: 'bar', data: d.projection.total,   backgroundColor: 'rgba(24,95,165,0.2)', yAxisID: 'y',  order: 2 },
        { data: d.projection.elderly, borderColor: C.red,  tension: 0.3, pointRadius: 4, yAxisID: 'y1', borderDash: [4, 3], order: 1 },
        { data: d.projection.single,  borderColor: C.teal, tension: 0.3, pointRadius: 4, yAxisID: 'y1', borderDash: [2, 4], order: 1 }
      ]
    },
    options: {
      ...baseOpts,
      scales: {
        x: baseOpts.scales.x,
        y:  { position: 'left',  grid: { color: gc }, min: 700, ticks: { color: tc, font: { size: 11 }, callback: v => v + '만' } },
        y1: { position: 'right', min: 0, max: 60, grid: { display: false }, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } }
      }
    }
  });
  setLegend('lg-elder', [{ color: C.navy, label: '65~74세' }, { color: C.red, label: '75~84세', dash: true }, { color: C.purple, label: '85세이상', dash: true }]);
  mkChart('c_elder', {
    type: 'line',
    data: {
      labels: d.elderlyAlone.years,
      datasets: [
        { data: d.elderlyAlone.age6574, borderColor: C.navy,   tension: 0.3, pointRadius: 3 },
        { data: d.elderlyAlone.age7584, borderColor: C.red,    tension: 0.3, pointRadius: 3, borderDash: [4, 3] },
        { data: d.elderlyAlone.age85p,  borderColor: C.purple, tension: 0.3, pointRadius: 3, borderDash: [2, 4] },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: { ...baseOpts.scales.x, ticks: { color: tc, font: { size: 10 }, maxRotation: 35 } }, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '만' } } },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 6 } } }
    }
  });
  setLegend('lg-hhp', [{ color: C.navy, label: '1인' }, { color: C.teal, label: '2인', dash: true }, { color: C.gray, label: '3인이상', dash: true }]);
  mkChart('c_hhp', {
    type: 'line',
    data: {
      labels: d.projection.years,
      datasets: [
        { data: d.projection.single, borderColor: C.navy, tension: 0.3, pointRadius: 4 },
        { data: [26.2, 27.4, 28.4, 29.7, 30.9, 32.2, 33.3, 33.7], borderColor: C.teal, tension: 0.3, pointRadius: 4, borderDash: [4, 3] },
        { data: [33.9, 31.4, 29.5, 27.5, 26.0, 24.7, 24.1, 23.8], borderColor: C.gray, tension: 0.3, pointRadius: 4, borderDash: [2, 4] },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } } },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 6 } } }
    }
  });
}

// ══════════════════════════════════════════════
// S7: 생활인구
// ══════════════════════════════════════════════
function initS7() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s7', d.kpi.s7);
  setLegend('lg-living', [
    { color: C.navy + '99', label: '내국인' }, { color: C.teal + '99', label: '외국인' },
    { color: C.red, label: '총 생활인구', dash: true },
  ]);
  const lp = d.livingPopulation;
  mkChart('c_living', {
    type: 'bar',
    data: {
      labels: lp.years,
      datasets: [
        { type: 'bar',  label: '내국인',     data: lp.domestic, backgroundColor: C.navy + '88', yAxisID: 'y', order: 2 },
        { type: 'bar',  label: '외국인',     data: lp.foreign,  backgroundColor: C.teal + '88', yAxisID: 'y', order: 2 },
        { type: 'line', label: '총 생활인구', data: lp.total,   borderColor: C.red, backgroundColor: 'transparent', pointRadius: 4, tension: 0.3, borderDash: [4, 3], yAxisID: 'y', order: 1 },
      ]
    },
    options: {
      ...baseOpts,
      scales: {
        x: { stacked: true, grid: { color: gc }, ticks: { color: tc, font: { size: 11 } } },
        y: { stacked: true, grid: { color: gc }, min: 900, ticks: { color: tc, font: { size: 11 }, callback: v => v + '만' } }
      },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } } }
    }
  });
  setLegend('lg-living-for', [
    { color: C.navy, label: '외국인 전체' }, { color: C.amber, label: '장기체류', dash: true },
    { color: C.red,  label: '단기체류', dash: true },
  ]);
  mkChart('c_living_for', {
    type: 'line',
    data: {
      labels: lp.years,
      datasets: [
        { label: '외국인 전체', data: lp.foreign,   borderColor: C.navy,  borderWidth: 2.5, pointRadius: 4, tension: 0.3 },
        { label: '장기체류',   data: lp.longStay,  borderColor: C.amber, borderWidth: 2,   pointRadius: 3, tension: 0.3, borderDash: [4, 3] },
        { label: '단기체류',   data: lp.shortStay, borderColor: C.red,   borderWidth: 2,   pointRadius: 3, tension: 0.3, borderDash: [2, 4] },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '만' } } },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } } }
    }
  });
  setLegend('lg-capital', [
    { color: C.navy, label: '유입' }, { color: C.red, label: '유출' }, { color: C.teal, label: '순이동', dash: true },
  ]);
  const cm = d.capitalMobility;
  mkChart('c_capital', {
    type: 'bar',
    data: {
      labels: cm.years,
      datasets: [
        { type: 'bar',  label: '유입',   data: cm.inflow,  backgroundColor: C.navy + '88', yAxisID: 'y',  order: 2 },
        { type: 'bar',  label: '유출',   data: cm.outflow, backgroundColor: C.red  + '88', yAxisID: 'y',  order: 2 },
        { type: 'line', label: '순이동', data: cm.net,     borderColor: C.teal, backgroundColor: 'transparent', pointRadius: 5, borderWidth: 2.5, borderDash: [4, 3], yAxisID: 'y1', order: 1 },
      ]
    },
    options: {
      ...baseOpts,
      scales: {
        x:  baseOpts.scales.x,
        y:  { position: 'left',  grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, callback: v => (v / 10000).toFixed(0) + '만' } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: tc, font: { size: 10 }, callback: v => v.toLocaleString() } }
      },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } } }
    }
  });
}

// ══════════════════════════════════════════════
// 토글 콜백
// ══════════════════════════════════════════════
function setBirthRegion(r) { drawBirthChart(r); }
function setBirthYear(yr) {
  buildMonthCombo('c_bmonth', 'lg-bmonth', 'note-bmonth', DASHBOARD_DATA.birthMonthly, yr, String(parseInt(yr) - 1), C.navy, '#85B7EB');
}
function setMarryYear(yr) {
  buildMonthCombo('c_mmonth', 'lg-mmonth', 'note-mmonth', DASHBOARD_DATA.marryMonthly, yr, String(parseInt(yr) - 1), C.purple, '#AFA9EC');
}

// ══════════════════════════════════════════════
// 탭 전환
// ══════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const sec = document.getElementById(btn.dataset.tab);
    sec.classList.add('active');
    const id = btn.dataset.tab;
    requestAnimationFrame(() => {
      if      (id === 's1') initS1();
      else if (id === 's2') initS2();
      else if (id === 's3') initS3();
      else if (id === 's4') initS4();
      else if (id === 's5') initS5();
      else if (id === 's6') initS6();
      else if (id === 's7') initS7();
    });
  });
});

window.addEventListener('DOMContentLoaded', () => initS1());

// ══════════════════════════════════════════════
// 자치구별 차트 (S1 내)
// ══════════════════════════════════════════════
function renderDistrictChart() {
  const d = DASHBOARD_DATA.districtPopulation;
  const sortKey = document.getElementById('districtSort')?.value || 'registered';
  const indices = d.districts.map((_, i) => i).sort((a, b) => d[sortKey][b] - d[sortKey][a]);
  const labels     = indices.map(i => d.districts[i]);
  const registered = indices.map(i => d.registered[i]);
  const residents  = indices.map(i => d.residents[i]);
  const foreigners = indices.map(i => d.foreigners[i]);
  mkChart('c_district', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '주민등록인구',   data: residents,  backgroundColor: 'rgba(37,99,235,0.75)', order: 2 },
        { label: '등록외국인',     data: foreigners, backgroundColor: 'rgba(239,68,68,0.75)',  order: 1 },
        { label: '등록인구(합계)', data: registered, type: 'line', borderColor: '#f59e0b', backgroundColor: 'transparent', pointRadius: 3, pointHoverRadius: 5, borderWidth: 2, order: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}명` } },
      },
      scales: {
        x: { stacked: false, ticks: { font: { size: 11 } } },
        y: { stacked: false, ticks: { callback: v => (v / 10000).toFixed(0) + '만' }, title: { display: true, text: '인구 (명)' } },
      },
    },
  });
}

function renderForeignRatioChart() {
  const d = DASHBOARD_DATA.districtPopulation;
  const ratios = d.districts.map((name, i) => ({
    name, ratio: (d.foreigners[i] / d.registered[i] * 100).toFixed(1), count: d.foreigners[i],
  })).sort((a, b) => b.ratio - a.ratio);
  mkChart('c_foreign_ratio', {
    type: 'bar',
    data: {
      labels: ratios.map(r => r.name),
      datasets: [{ label: '외국인 비율 (%)', data: ratios.map(r => r.ratio), backgroundColor: ratios.map((_, i) => `hsl(${220 - i * 8}, 70%, ${55 + i * 1.5}%)`) }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `외국인 비율: ${ctx.parsed.x}% (${ratios[ctx.dataIndex].count.toLocaleString()}명)` } },
      },
      scales: { x: { title: { display: true, text: '외국인 비율 (%)' } } },
    },
  });
}
