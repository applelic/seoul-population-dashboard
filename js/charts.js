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

function mkChart(id, cfg) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), cfg);
}

function setLegend(id, items) {
  document.getElementById(id).innerHTML = items.map(i =>
    `<span><span class="legend-dot" style="background:${i.color};${i.dash?'border:1px dashed #999':''}"></span>${i.label}</span>`
  ).join('');
}

function buildKPI(id, items) {
  document.getElementById(id).innerHTML = items.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}${k.sub ? `<span class="kpi-sub"> · ${k.sub}</span>` : ''}</div>
      <div class="kpi-note ${k.trend}">${k.note}</div>
    </div>
  `).join('');
}

function buildToggle(id, items, onClickFn) {
  document.getElementById(id).innerHTML = items.map((item, i) => `
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
  const labs = [], cur = [], prev = [], diff = [];
  cy.forEach((v, i) => {
    labs.push(MONTHS[i]);
    cur.push(v);
    prev.push(py[i]);
    diff.push(v !== null && py[i] !== null ? v - py[i] : null);
  });
  const pos = diff.filter(d => d !== null && d > 0).length;
  setLegend(lgId, [
    { color: c1, label: curYear + '년' },
    { color: c2, label: prevYear + '년(전년)' },
    { color: '#888780', label: '증감(명)', dash: true }
  ]);
  
  document.getElementById(noteId).innerHTML =
    `${curYear}년 ${labs.length}개월 중 <strong>${pos}개월</strong> 전년동월 대비 증가.`;
  mkChart(canvasId, {
    type: 'bar',
    data: {
      labels: labs,
      datasets: [
        { type: 'bar', data: cur, backgroundColor: c1 + 'cc', yAxisID: 'y', order: 2 },
        { type: 'bar', data: prev, backgroundColor: c2 + '88', yAxisID: 'y', order: 3 },
        {
          type: 'line', data: diff,
          borderColor: '#888780', backgroundColor: 'transparent',
          pointRadius: 4,
          pointBackgroundColor: diff.map(d => d >= 0 ? '#1D9E75' : '#D85A30'),
          tension: 0.3, yAxisID: 'y1', order: 1
        }
      ]
    },
    options: {
      ...baseOpts,
      scales: {
        x: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 }, autoSkip: false, maxRotation: 35 } },
        y: { position: 'left', grid: { color: gc }, ticks: { color: tc, font: { size: 10 }, callback: v => v.toLocaleString() } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: tc, font: { size: 10 }, callback: v => (v >= 0 ? '+' : '') + v.toLocaleString() } }
      }
    }
  });
}

let hhMode = 'bar';

function drawHH() {
  const d = DASHBOARD_DATA.householdSize;
  if (hhMode === 'bar') {
    mkChart('c_hh', {
      type: 'bar',
      data: {
        labels: ['1인', '2인', '3인', '4인', '5인이상'],
        datasets: [
          { label: '1990', data: [9.1, 11.7, 19.1, 32.5, 27.6], backgroundColor: 'rgba(24,95,165,0.3)' },
          { label: '2000', data: [16.3, 17.0, 21.7, 32.1, 13.0], backgroundColor: 'rgba(24,95,165,0.5)' },
          { label: '2010', data: [24.4, 22.3, 22.5, 23.1, 7.8],  backgroundColor: 'rgba(24,95,165,0.7)' },
          { label: '2024', data: [39.9, 26.2, 18.6, 12.3, 3.0],  backgroundColor: '#185FA5' },
        ]
      },
      options: {
        ...baseOpts,
        scales: {
          x: baseOpts.scales.x,
          y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } }
        },
        plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } } }
      }
    });
  } else {
    mkChart('c_hh', {
      type: 'line',
      data: {
        labels: d.years,
        datasets: [
          { label: '1인', data: d.h1, borderColor: '#185FA5', tension: 0.3, pointRadius: 3 },
          { label: '2인', data: d.h2, borderColor: '#1D9E75', tension: 0.3, pointRadius: 3, borderDash: [4, 3] },
          { label: '3인', data: d.h3, borderColor: '#888780', tension: 0.3, pointRadius: 3, borderDash: [2, 4] },
          { label: '4인', data: d.h4, borderColor: '#BA7517', tension: 0.3, pointRadius: 3, borderDash: [6, 2] },
          { label: '5인이상', data: d.h5plus, borderColor: '#D85A30', tension: 0.3, pointRadius: 3, borderDash: [4, 4] },
        ]
      },
      options: {
        ...baseOpts,
        scales: {
          x: baseOpts.scales.x,
          y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } }
        },
        plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } } }
      }
    });
  }
}

function initS1() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s1', d.kpi.s1);
  setLegend('lg-pop', [{ color: '#185FA5', label: '주민등록' }, { color: '#1D9E75', label: '등록외국인', dash: true }]);
  mkChart('c_pop', {
    type: 'line',
    data: {
      labels: d.population.years,
      datasets: [
        { data: d.population.registered, borderColor: '#185FA5', backgroundColor: 'rgba(24,95,165,0.07)', fill: true, tension: 0.3, pointRadius: 3 },
        { data: d.population.foreign, borderColor: '#1D9E75', backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, borderDash: [4, 3] }
      ]
    },
    options: { ...baseOpts, scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '만' } } } }
  });
  setLegend('lg-age', [{ color: '#185FA5', label: '유소년' }, { color: '#1D9E75', label: '생산연령' }, { color: '#D85A30', label: '고령' }]);
  mkChart('c_age', {
    type: 'bar',
    data: {
      labels: d.ageStructure.years,
      datasets: [
        { label: '유소년', data: d.ageStructure.youth, backgroundColor: '#185FA5' },
        { label: '생산연령', data: d.ageStructure.working, backgroundColor: '#1D9E75' },
        { label: '고령', data: d.ageStructure.elderly, backgroundColor: '#D85A30' },
      ]
    },
    options: { ...baseOpts, scales: { x: { ...baseOpts.scales.x, stacked: true }, y: { ...baseOpts.scales.y, stacked: true, max: 100, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } } } }
  });
  setLegend('lg-sex', [{ color: '#7F77DD', label: '서울 20대' }, { color: '#B4B2A9', label: '서울 전체', dash: true }]);
  mkChart('c_sex', {
    type: 'line',
    data: {
      labels: d.sexRatio20s.years,
      datasets: [
        { data: d.sexRatio20s.seoul20s, borderColor: '#7F77DD', tension: 0.3, pointRadius: 3 },
        { data: d.sexRatio20s.seoulAll, borderColor: '#B4B2A9', tension: 0.3, pointRadius: 3, borderDash: [4, 3] }
      ]
    },
    options: { ...baseOpts, scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, min: 85 } } }
  });
}

function initS2() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s2', d.kpi.s2);
  setLegend('lg-birth', [{ color: '#185FA5', label: '출생아수' }, { color: '#D85A30', label: '합계출산율' }]);
  mkChart('c_birth', {
    type: 'bar',
    data: {
      labels: d.birthAnnual.years,
      datasets: [
        { type: 'bar', data: d.birthAnnual.values, backgroundColor: 'rgba(24,95,165,0.6)', yAxisID: 'y' },
        { type: 'line', data: d.fertilityRate.values, borderColor: '#D85A30', pointRadius: 4, tension: 0.3, yAxisID: 'y1' }
      ]
    },
    options: {
      ...baseOpts,
      scales: {
        x: baseOpts.scales.x,
        y: { position: 'left', grid: { color: gc }, ticks: { color: tc, font: { size: 10 }, callback: v => Math.round(v / 1000) + '천' } },
        y1: { position: 'right', min: 0.4, max: 1.1, grid: { display: false }, ticks: { color: tc, font: { size: 10 }, callback: v => v.toFixed(2) } }
      }
    }
  });
  buildToggle('tg-birth', [
    { label: '2024 vs 2023', value: '2024' },
    { label: '2025 vs 2024', value: '2025' },
    { label: '2026 vs 2025', value: '2026' },
  ], 'setBirthYear');
  buildMonthCombo('c_bmonth', 'lg-bmonth', 'note-bmonth', d.birthMonthly, '2024', '2023', '#185FA5', '#85B7EB');
  buildToggle('tg-marry', [
    { label: '2024 vs 2023', value: '2024' },
    { label: '2025 vs 2024', value: '2025' },
    { label: '2026 vs 2025', value: '2026' },
  ], 'setMarryYear');
  buildMonthCombo('c_mmonth', 'lg-mmonth', 'note-mmonth', d.marryMonthly, '2024', '2023', '#7F77DD', '#AFA9EC');
  setLegend('lg-marry', [{ color: '#185FA5', label: '혼인' }, { color: '#888780', label: '이혼', dash: true }]);
  mkChart('c_marry', {
    type: 'line',
    data: {
      labels: d.marryAnnual.years,
      datasets: [
        { data: d.marryAnnual.values, borderColor: '#185FA5', tension: 0.3, pointRadius: 3 },
        { data: d.divorceAnnual.values, borderColor: '#888780', tension: 0.3, pointRadius: 3, borderDash: [4, 3] }
      ]
    },
    options: { ...baseOpts, scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => (v / 10000).toFixed(1) + '만' } } } }
  });
}

function initS3() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s3', d.kpi.s3);
  buildToggle('tg-hh', [
    { label: '시점 비교', value: 'bar' },
    { label: '추세선', value: 'line' },
  ], 'setHHMode');
  setLegend('lg-hh', [
    { color: '#185FA5', label: '1인' }, { color: '#1D9E75', label: '2인' },
    { color: '#888780', label: '3인' }, { color: '#BA7517', label: '4인' }, { color: '#D85A30', label: '5인이상' }
  ]);
  drawHH();
  mkChart('c_1ph', {
    type: 'doughnut',
    data: {
      labels: d.singleHHAge2024.labels,
      datasets: [{ data: d.singleHHAge2024.values, backgroundColor: ['#B5D4F4','#185FA5','#5DCAA5','#1D9E75','#FAC775','#D85A30'], borderWidth: 1 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 5 } } } }
  });
  setLegend('lg-gen', [{ color: '#185FA5', label: '2세대' }, { color: '#1D9E75', label: '1인', dash: true }, { color: '#888780', label: '1세대', dash: true }, { color: '#D85A30', label: '3세대', dash: true }]);
  mkChart('c_gen', {
    type: 'line',
    data: {
      labels: d.singleHH1p.years,
      datasets: [
        { data: d.singleHH1p.gen2, borderColor: '#185FA5', tension: 0.3, pointRadius: 3 },
        { data: d.singleHH1p.single1p, borderColor: '#1D9E75', tension: 0.3, pointRadius: 3, borderDash: [4, 3] },
        { data: d.singleHH1p.gen1, borderColor: '#888780', tension: 0.3, pointRadius: 3, borderDash: [2, 4] },
        { data: d.singleHH1p.gen3, borderColor: '#D85A30', tension: 0.3, pointRadius: 3, borderDash: [6, 2] },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } } },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 6 } } }
    }
  });
}

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
  setLegend('lg-for', [{ color: '#185FA5', label: '중국' }, { color: '#D85A30', label: '베트남', dash: true }, { color: '#1D9E75', label: '미국', dash: true }, { color: '#888780', label: '그 외', dash: true }]);
  mkChart('c_for', {
    type: 'line',
    data: {
      labels: d.foreignNationality.years,
      datasets: [
        { data: d.foreignNationality.china, borderColor: '#185FA5', tension: 0.3, pointRadius: 3 },
        { data: d.foreignNationality.vietnam, borderColor: '#D85A30', tension: 0.3, pointRadius: 3, borderDash: [4, 3] },
        { data: d.foreignNationality.usa, borderColor: '#1D9E75', tension: 0.3, pointRadius: 3, borderDash: [2, 4] },
        { data: d.foreignNationality.others, borderColor: '#888780', tension: 0.3, pointRadius: 3, borderDash: [6, 2] },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } } },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 6 } } }
    }
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

function initS5() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s5', d.kpi.s5);
  setLegend('lg-proj', [{ color: '#185FA5', label: '총인구(만명)' }, { color: '#D85A30', label: '고령비중(%)', dash: true }, { color: '#1D9E75', label: '1인가구비중(%)', dash: true }]);
  mkChart('c_proj', {
    type: 'line',
    data: {
      labels: d.projection.years,
      datasets: [
        { type: 'bar', data: d.projection.total, backgroundColor: 'rgba(24,95,165,0.2)', yAxisID: 'y', order: 2 },
        { data: d.projection.elderly, borderColor: '#D85A30', tension: 0.3, pointRadius: 4, yAxisID: 'y1', borderDash: [4, 3], order: 1 },
        { data: d.projection.single, borderColor: '#1D9E75', tension: 0.3, pointRadius: 4, yAxisID: 'y1', borderDash: [2, 4], order: 1 }
      ]
    },
    options: {
      ...baseOpts,
      scales: {
        x: baseOpts.scales.x,
        y: { position: 'left', grid: { color: gc }, min: 700, ticks: { color: tc, font: { size: 11 }, callback: v => v + '만' } },
        y1: { position: 'right', min: 0, max: 60, grid: { display: false }, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } }
      }
    }
  });
  setLegend('lg-elder', [{ color: '#185FA5', label: '65~74세' }, { color: '#D85A30', label: '75~84세', dash: true }, { color: '#7F77DD', label: '85세이상', dash: true }]);
  mkChart('c_elder', {
    type: 'line',
    data: {
      labels: d.elderlyAlone.years,
      datasets: [
        { data: d.elderlyAlone.age6574, borderColor: '#185FA5', tension: 0.3, pointRadius: 3 },
        { data: d.elderlyAlone.age7584, borderColor: '#D85A30', tension: 0.3, pointRadius: 3, borderDash: [4, 3] },
        { data: d.elderlyAlone.age85p, borderColor: '#7F77DD', tension: 0.3, pointRadius: 3, borderDash: [2, 4] },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: { ...baseOpts.scales.x, ticks: { color: tc, font: { size: 10 }, maxRotation: 35 } }, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '만' } } },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 6 } } }
    }
  });
  setLegend('lg-hhp', [{ color: '#185FA5', label: '1인' }, { color: '#1D9E75', label: '2인', dash: true }, { color: '#888780', label: '3인이상', dash: true }]);
  mkChart('c_hhp', {
    type: 'line',
    data: {
      labels: d.projection.years,
      datasets: [
        { data: d.projection.single, borderColor: '#185FA5', tension: 0.3, pointRadius: 4 },
        { data: [26.2, 27.4, 28.4, 29.7, 30.9, 32.2, 33.3, 33.7], borderColor: '#1D9E75', tension: 0.3, pointRadius: 4, borderDash: [4, 3] },
        { data: [33.9, 31.4, 29.5, 27.5, 26.0, 24.7, 24.1, 23.8], borderColor: '#888780', tension: 0.3, pointRadius: 4, borderDash: [2, 4] },
      ]
    },
    options: {
      ...baseOpts,
      scales: { x: baseOpts.scales.x, y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } } },
      plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 6 } } }
    }
  });
}

function setBirthYear(yr) {
  buildMonthCombo('c_bmonth', 'lg-bmonth', 'note-bmonth', DASHBOARD_DATA.birthMonthly, yr, String(parseInt(yr) - 1), '#185FA5', '#85B7EB');
}
function setMarryYear(yr) {
  buildMonthCombo('c_mmonth', 'lg-mmonth', 'note-mmonth', DASHBOARD_DATA.marryMonthly, yr, String(parseInt(yr) - 1), '#7F77DD', '#AFA9EC');
}
function setHHMode(mode) {
  hhMode = mode;
  drawHH();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const sec = document.getElementById(btn.dataset.tab);
    sec.classList.add('active');
    const id = btn.dataset.tab;
    if (id === 's1') initS1();
    else if (id === 's2') initS2();
    else if (id === 's3') initS3();
    else if (id === 's4') initS4();
    else if (id === 's5') initS5();
  });
});

window.addEventListener('DOMContentLoaded', () => initS1());
