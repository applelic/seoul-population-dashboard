// ══════════════════════════════════════════════════════════════════
// charts.js  ·  initS3() 교체 구간
// 변경 요약:
//   1) c_hh (가구원수별) — 선 tooltip에 가구수(비중%) 병기
//   2) c_gen (세대구성별) — 선 tooltip에 가구수(비중%) 병기
//   3) 두 차트 모두 interaction: { mode:'index' } 추가
// ══════════════════════════════════════════════════════════════════

function initS3() {
  const d = DASHBOARD_DATA;
  buildKPI('kpi-s3', d.kpi.s3);

  // ─────────────────────────────────────────────────────────────
  // 가구원수별 가구 수 원시값 룩업 (years 순서와 동일)
  // 출처: data.js  householdSize.years = [1990,1995,2000,2005,2010,2015,2022,2023,2024]
  // ─────────────────────────────────────────────────────────────
  const hhRawCounts = {
    '1인':    [  257382,  382024,  502245,  675739,  854606, 1115744, 1564187, 1627480, 1660813],
    '2인':    [  330684,  426210,  524663,  670455,  781527,  930467, 1076409, 1080790, 1090555],
    '3인':    [  537364,  615127,  670538,  732043,  788115,  817440,  776479,  774023,  772973],
    '4인':    [  914443,  996854,  989621,  917243,  807836,  701945,  544807,  528911,  511523],
    '5인이상':[  775148,  545579,  398869,  314410,  272213,  218894,  136936,  130455,  123638],
  };

  // ─────────────────────────────────────────────────────────────
  // 세대구성별 가구 수 원시값 룩업
  // 출처: data.js  singleHH1p.years = [2016..2024]
  // ─────────────────────────────────────────────────────────────
  const genRawCounts = {
    '2세대': [1804454, 1775431, 1740777, 1710502, 1691450, 1644223, 1611980, 1593557, 1573061],
    '1인':   [1138860, 1180540, 1229421, 1299787, 1390701, 1489893, 1564187, 1627480, 1660813],
    '1세대': [ 598233,  614037,  626988,  645266,  665193,  680825,  689093,  685396,  687649],
    '3세대': [ 181625,  173908,  164734,  155420,  142292,  131646,  125014,  121065,  116025],
  };

  // 공통 툴팁 콜백 팩토리
  // rawMap: { 레이블명: [가구수...] }
  function makeTooltipCallbacks(rawMap) {
    return {
      callbacks: {
        label(ctx) {
          const label = ctx.dataset.label || '';
          const pct   = ctx.parsed.y;
          const counts = rawMap[label];
          if (counts) {
            const n = counts[ctx.dataIndex];
            return ` ${label}: ${n.toLocaleString()}가구 (${pct}%)`;
          }
          // 해당 없는 dataset(범례 없는 경우) — 기본 표시
          return ` ${label}: ${pct}%`;
        }
      }
    };
  }

  // ── c_hh : 가구원수별 추이 ────────────────────────────────────
  buildToggle('tg-hh', [
    { label: '시점 비교', value: 'bar' },
    { label: '추세선',   value: 'line' },
  ], 'setHHMode');

  setLegend('lg-hh', [
    { color: '#185FA5', label: '1인' },    { color: '#1D9E75', label: '2인' },
    { color: '#888780', label: '3인' },    { color: '#BA7517', label: '4인' },
    { color: '#D85A30', label: '5인이상' },
  ]);

  drawHH();   // drawHH() 는 hhMode 에 따라 분기 — 아래에서 별도 재정의

  // ── c_gen : 세대구성별 추이 ──────────────────────────────────
  setLegend('lg-gen', [
    { color: '#185FA5', label: '2세대' },  { color: '#1D9E75', label: '1인', dash: true },
    { color: '#888780', label: '1세대', dash: true }, { color: '#D85A30', label: '3세대', dash: true },
  ]);

  mkChart('c_gen', {
    type: 'line',
    data: {
      labels: d.singleHH1p.years,
      datasets: [
        { label: '2세대', data: d.singleHH1p.gen2,    borderColor: '#185FA5', tension: 0.3, pointRadius: 3 },
        { label: '1인',   data: d.singleHH1p.single1p, borderColor: '#1D9E75', tension: 0.3, pointRadius: 3, borderDash: [4, 3] },
        { label: '1세대', data: d.singleHH1p.gen1,    borderColor: '#888780', tension: 0.3, pointRadius: 3, borderDash: [2, 4] },
        { label: '3세대', data: d.singleHH1p.gen3,    borderColor: '#D85A30', tension: 0.3, pointRadius: 3, borderDash: [6, 2] },
      ]
    },
    options: {
      ...baseOpts,
      interaction: { mode: 'index', intersect: false },   // ★ 추가
      scales: {
        x: baseOpts.scales.x,
        y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } }
      },
      plugins: {
        legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 6 } },
        tooltip: makeTooltipCallbacks(genRawCounts),       // ★ 추가
      }
    }
  });

  // 이하 기존 코드 (1인가구 도넛, 연령별 시계열) 그대로 유지
  mkChart('c_1ph', {
    type: 'doughnut',
    data: {
      labels: d.singleHHAge2024.labels,
      datasets: [{ data: d.singleHHAge2024.values, backgroundColor: ['#B5D4F4','#185FA5','#5DCAA5','#1D9E75','#FAC775','#D85A30'], borderWidth: 1 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 5 } } } }
  });
}


// ══════════════════════════════════════════════════════════════════
// drawHH() 재정의 — 추세선 모드에서 툴팁 가구수(비중%) 병기 추가
// ══════════════════════════════════════════════════════════════════
let hhMode = 'bar';

// 가구원수별 원시 가구수 (drawHH 내부에서 참조)
const _hhRaw = {
  '1인':    [  257382,  382024,  502245,  675739,  854606, 1115744, 1564187, 1627480, 1660813],
  '2인':    [  330684,  426210,  524663,  670455,  781527,  930467, 1076409, 1080790, 1090555],
  '3인':    [  537364,  615127,  670538,  732043,  788115,  817440,  776479,  774023,  772973],
  '4인':    [  914443,  996854,  989621,  917243,  807836,  701945,  544807,  528911,  511523],
  '5인이상':[  775148,  545579,  398869,  314410,  272213,  218894,  136936,  130455,  123638],
};

function drawHH() {
  const d = DASHBOARD_DATA.householdSize;

  if (hhMode === 'bar') {
    // 시점 비교 막대 — 비중만 표시하면 충분 (연도별 비교용)
    mkChart('c_hh', {
      type: 'bar',
      data: {
        labels: ['1인', '2인', '3인', '4인', '5인이상'],
        datasets: [
          { label: '1990', data: [9.1, 11.7, 19.1, 32.5, 27.6], backgroundColor: 'rgba(24,95,165,0.3)' },
          { label: '2000', data: [16.3, 17.0, 21.7, 32.1, 13.0], backgroundColor: 'rgba(24,95,165,0.5)' },
          { label: '2010', data: [24.4, 22.3, 22.5, 23.1,  7.8], backgroundColor: 'rgba(24,95,165,0.7)' },
          { label: '2024', data: [39.9, 26.2, 18.6, 12.3,  3.0], backgroundColor: '#185FA5' },
        ]
      },
      options: {
        ...baseOpts,
        scales: {
          x: baseOpts.scales.x,
          y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } }
        },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } }
        }
      }
    });

  } else {
    // 추세선 — 가구수(비중%) 툴팁
    mkChart('c_hh', {
      type: 'line',
      data: {
        labels: d.years,
        datasets: [
          { label: '1인',    data: d.h1,     borderColor: '#185FA5', tension: 0.3, pointRadius: 3 },
          { label: '2인',    data: d.h2,     borderColor: '#1D9E75', tension: 0.3, pointRadius: 3, borderDash: [4, 3] },
          { label: '3인',    data: d.h3,     borderColor: '#888780', tension: 0.3, pointRadius: 3, borderDash: [2, 4] },
          { label: '4인',    data: d.h4,     borderColor: '#BA7517', tension: 0.3, pointRadius: 3, borderDash: [6, 2] },
          { label: '5인이상', data: d.h5plus, borderColor: '#D85A30', tension: 0.3, pointRadius: 3, borderDash: [4, 4] },
        ]
      },
      options: {
        ...baseOpts,
        interaction: { mode: 'index', intersect: false },   // ★ 추가
        scales: {
          x: baseOpts.scales.x,
          y: { ...baseOpts.scales.y, ticks: { color: tc, font: { size: 11 }, callback: v => v + '%' } }
        },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, color: tc, boxWidth: 10, padding: 8 } },
          tooltip: {
            callbacks: {                                    // ★ 추가
              label(ctx) {
                const label  = ctx.dataset.label || '';
                const pct    = ctx.parsed.y;
                const counts = _hhRaw[label];
                if (counts) {
                  const n = counts[ctx.dataIndex];
                  return ` ${label}: ${n.toLocaleString()}가구 (${pct}%)`;
                }
                return ` ${label}: ${pct}%`;
              }
            }
          },
        }
      }
    });
  }
}

function setHHMode(mode) {
  hhMode = mode;
  drawHH();
}
