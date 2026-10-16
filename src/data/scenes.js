// 세 장면. 모든 시각·수치·사건은 가상이다.
// 알람 필드: t(표시 시각) prio(1~4) post(개소) tag(설비) text value state(UNACK/ACKED/RTN) group(묶인 사건 id 또는 null)
// effect: 알람이 들어올 때 계통도 상태를 바꾸는 값 (재생용)

export function fmtK(km) {
  const whole = Math.floor(km + 1e-9);
  const m = Math.round((km - whole) * 1000);
  return `${whole}k${String(m).padStart(3, '0')}`;
}

const FAULT_ALARMS = [
  { t: '14:21:07.412', prio: 1, post: '한누리 SS', tag: '44F1', text: 'F1 거리계전기 Zone1 동작', value: 'Z1', group: 'INC-F', first: true },
  { t: '14:21:07.416', prio: 1, post: '한누리 SS', tag: '44F2', text: 'F2 거리계전기 Zone1 동작', value: 'Z1', group: 'INC-F' },
  { t: '14:21:07.418', prio: 3, post: '한누리 SS', tag: 'FR-SS', text: '고장기록장치 기동', value: '', group: 'INC-F' },
  { t: '14:21:07.420', prio: 3, post: '한누리 SS', tag: 'FL-F1', text: '고장점표정반 기동', value: '', group: 'INC-F' },
  { t: '14:21:07.424', prio: 2, post: '미루 SSP', tag: '27M', text: 'M상 전압 저하', value: '6.2 kV', group: 'INC-F' },
  { t: '14:21:07.425', prio: 2, post: '고운 SSP', tag: '27M', text: 'M상 전압 저하', value: '4.8 kV', group: 'INC-F' },
  { t: '14:21:07.427', prio: 2, post: '서들 SP', tag: '27M', text: 'M상 전압 저하', value: '9.5 kV', group: 'INC-F' },
  { t: '14:21:07.431', prio: 3, post: '미루 SSP', tag: 'FR-SSP', text: '고장기록장치 기동 (인접 장치 알림 수신)', value: '', group: 'INC-F' },
  { t: '14:21:07.433', prio: 3, post: '고운 SSP', tag: 'FR-SSP', text: '고장기록장치 기동 (인접 장치 알림 수신)', value: '', group: 'INC-F' },
  { t: '14:21:07.463', prio: 1, post: '한누리 SS', tag: '52F1', text: 'F1 급전 차단기 트립', value: '개방', group: 'INC-F', effect: { breaker: '52F1', state: 'tripped' } },
  { t: '14:21:07.466', prio: 1, post: '한누리 SS', tag: '52F2', text: 'F2 급전 차단기 트립', value: '개방', group: 'INC-F', effect: { breaker: '52F2', state: 'tripped' } },
  { t: '14:21:07.481', prio: 2, post: '미루 SSP', tag: '27M', text: 'M상 무가압', value: '0.0 kV', group: 'INC-F' },
  { t: '14:21:07.482', prio: 2, post: '고운 SSP', tag: '27M', text: 'M상 무가압', value: '0.0 kV', group: 'INC-F' },
  { t: '14:21:07.484', prio: 2, post: '서들 SP', tag: '27M', text: 'M상 무가압', value: '0.0 kV', group: 'INC-F' },
  { t: '14:21:07.952', prio: 2, post: '한누리 SS', tag: 'FL-F1', text: '표정 결과 1: 전차선계통 지락상태 · 상행 · SS로부터 13.60 km', value: fmtK(25 - 13.6), group: 'INC-F' },
  { t: '14:21:08.912', prio: 3, post: '한누리 SS', tag: '79F1', text: 'F1 재폐로 동작', value: '', group: 'INC-F' },
  { t: '14:21:08.915', prio: 3, post: '한누리 SS', tag: '79F2', text: 'F2 재폐로 동작', value: '', group: 'INC-F' },
  { t: '14:21:08.985', prio: 3, post: '한누리 SS', tag: '52F1', text: 'F1 급전 차단기 투입 (재폐로)', value: '투입', group: 'INC-F', effect: { breaker: '52F1', state: 'closed' } },
  { t: '14:21:08.990', prio: 3, post: '한누리 SS', tag: '52F2', text: 'F2 급전 차단기 투입 (재폐로)', value: '투입', group: 'INC-F', effect: { breaker: '52F2', state: 'closed' } },
  { t: '14:21:09.003', prio: 1, post: '한누리 SS', tag: '44F1', text: 'F1 거리계전기 Zone1 재동작', value: 'Z1', group: 'INC-F' },
  { t: '14:21:09.006', prio: 1, post: '한누리 SS', tag: '44F2', text: 'F2 거리계전기 Zone1 재동작', value: 'Z1', group: 'INC-F' },
  { t: '14:21:09.052', prio: 1, post: '한누리 SS', tag: '52F1', text: 'F1 급전 차단기 재트립', value: '개방', group: 'INC-F', effect: { breaker: '52F1', state: 'tripped' } },
  { t: '14:21:09.055', prio: 1, post: '한누리 SS', tag: '52F2', text: 'F2 급전 차단기 재트립', value: '개방', group: 'INC-F', effect: { breaker: '52F2', state: 'tripped' } },
  { t: '14:21:09.060', prio: 1, post: '한누리 SS', tag: '79F1', text: 'F1 재폐로 실패 · 록아웃', value: '', group: 'INC-F' },
  { t: '14:21:09.064', prio: 1, post: '한누리 SS', tag: '79F2', text: 'F2 재폐로 실패 · 록아웃', value: '', group: 'INC-F' },
  { t: '14:21:09.540', prio: 2, post: '한누리 SS', tag: 'FL-F1', text: '표정 결과 2: 전차선계통 지락상태 · 상행 · SS로부터 13.62 km', value: fmtK(25 - 13.62), group: 'INC-F', effect: { fault: true } },
  { t: '14:21:09.802', prio: 3, post: '한누리 SS', tag: 'FR-SS', text: '고장기록장치 파형 저장 완료', value: '3.2 s', group: 'INC-F' },
  { t: '14:21:10.410', prio: 3, post: '미루 SSP', tag: 'RTU', text: 'RTU 이벤트 버퍼 사용률 높음', value: '82 %', group: 'INC-F', uncertain: '트립 직후라 함께 묶었지만, 통신 쪽 원인일 수도 있어 확신이 낮습니다. 관제사 확인이 필요합니다.' },
  { t: '14:21:11.240', prio: 2, post: '열차정보', tag: 'TID', text: '정전 구간 안 열차 정차 2편 (운행관제 연계 가정)', value: 'K1123 · K1130', group: 'INC-F', effect: { trainsStopped: true } },
  { t: '14:20:58.204', prio: 3, post: '솔빛 SSP', tag: 'DC', text: '제어용 축전지 전압 저하', value: '104.2 V', group: null, separate: '고장보다 9초 먼저 시작됐고 T상 쪽 개소입니다. 같은 사건으로 보지 않았습니다.' },
  { t: '14:21:10.917', prio: 4, post: '한누리 SS', tag: 'TS2', text: '예비 변압기 냉각팬 시험 운전', value: '', group: null, separate: '작업 계획에 있던 시험 운전 기록입니다. 고장과 계통이 다릅니다.' },
];

// 재생 순서는 시각순
FAULT_ALARMS.sort((a, b) => (a.t < b.t ? -1 : 1));

// 위치가 확인된 과거 사건이 표정값 주변 어디에 있었는지 (실제 위치 − 표정값, km). 모두 공단 규격(±200 m) 안쪽.
const FL_HISTORY = [
  { when: '2021-03', kind: '사고', err: 0.06 },
  { when: '2021-11', kind: '강제지락시험', err: -0.04 },
  { when: '2022-07', kind: '사고', err: 0.11 },
  { when: '2023-02', kind: '사고', err: 0.03 },
  { when: '2023-08', kind: '사고', err: 0.13 },
  { when: '2024-05', kind: '강제지락시험', err: -0.03 },
  { when: '2024-12', kind: '사고', err: 0.07 },
  { when: '2025-09', kind: '사고', err: 0.09 },
];

const FL_FROM_SS = 13.62;
const FL_BAND_FROM_SS = [13.57, 13.77];

// 주변압기 TS1 M좌 권선 온도 (21일). 마지막 날 값은 카드와 같게 고정한다.
const TRANSFORMER_TREND = (() => {
  const rows = Array.from({ length: 21 }, (_, i) => {
    const day = i + 1;
    const load = 58 + Math.round(6 * Math.sin(i / 2.2) + (i % 3));
    const ambient = +(17 + 2.5 * Math.sin(i / 3.1)).toFixed(1);
    const expected = +(36 + load * 0.5 + ambient * 0.3).toFixed(1);
    const drift = i < 10 ? 0.3 * Math.sin(i * 1.7) : (i - 9) * 0.6;
    return { day, load, ambient, expected, actual: +(expected + drift).toFixed(1) };
  });
  const last = rows[rows.length - 1];
  last.load = 62;
  last.ambient = 18.2;
  last.expected = 71.6;
  last.actual = 78.4;
  return rows;
})();

const lastWeekGap = (() => {
  const week = TRANSFORMER_TREND.slice(-7);
  return week.reduce((s, d) => s + (d.actual - d.expected), 0) / week.length;
})();

const BREAKER_OPS = (() => {
  const rows = Array.from({ length: 40 }, (_, i) => {
    const wobble = [0.4, -0.3, 0.6, -0.5, 0.1, 0.3, -0.2, 0.5][i % 8];
    return {
      n: i + 1,
      target: +(37.6 + (i > 12 ? (i - 12) * 0.27 : 0) + wobble).toFixed(1),
      fleet: +(37.9 + wobble * 0.5).toFixed(1),
    };
  });
  rows[0].target = 37.8;
  rows[rows.length - 1].target = 45.2;
  return rows;
})();

const fleetAvg = BREAKER_OPS.reduce((s, d) => s + d.fleet, 0) / BREAKER_OPS.length;

export const SCENES = [
  {
    id: 'fault',
    label: '급전선 지락 · 알람 묶기',
    replay: true,
    clock: '14:21:12',
    defaultLayer: 'line',
    alarms: FAULT_ALARMS,
    incidents: [
      {
        id: 'INC-F',
        prio: 1,
        title: 'F1·F2 급전 차단기 트립, 재폐로 실패',
        where: `한누리 SS M상 서쪽 급전구간 · 상선 고운SSP–미루SSP 구간 (${fmtK(25 - FL_FROM_SS)} 부근)`,
        summary: [
          '14:21:07.412 F1 거리계전기 Zone1 동작이 첫 알람입니다. F1·F2가 트립했고, 재폐로 뒤 다시 트립해 둘 다 록아웃 상태입니다.',
          '표정 결과는 두 번 모두 전차선계통 지락상태, 상행입니다. 1차 13.60 km와 2차 13.62 km가 20 m 차이라 같은 지점의 영구 고장으로 보입니다. 하선 F2가 함께 트립한 것은 SSP 타이(89T)로 상하선이 이어져 있어 고장 전류를 나눠 흘렸기 때문으로 보입니다.',
        ],
        facts: [
          { k: '첫 알람', v: '44F1 Zone1', sub: '14:21:07.412' },
          { k: '고장 전류 (고장기록장치)', v: '3.4', unit: 'kA' },
          { k: '정전 구간', v: `${fmtK(0)}–${fmtK(25)}`, sub: '상·하선 (M상 서쪽)' },
          { k: '구간 안 열차', v: '2', unit: '편', sub: 'K1123 · K1130 정차' },
        ],
        fl: {
          result: '전차선계통 지락상태 · 상행 · SS 기준 2구간 (고운SSP–미루SSP)',
          first: 13.6,
          fromSs: FL_FROM_SS,
          kmp: +(25 - FL_FROM_SS).toFixed(2),
          band: { fromSs: FL_BAND_FROM_SS, kmp: [+(25 - FL_BAND_FROM_SS[1]).toFixed(2), +(25 - FL_BAND_FROM_SS[0]).toFixed(2)] },
          history: FL_HISTORY,
          nearby: [
            { what: '버들천 교량', where: `${fmtK(11.15)}–${fmtK(11.31)}`, note: '교량 구간 (가상 설비대장)' },
            { what: '애자 교체 이력', where: fmtK(11.24), note: '2026-03 교체 (가상 정비기록)' },
          ],
        },
        waveform: true,
        stepsTitle: '확인 순서 후보 · 판단은 관제사',
        steps: [
          { text: '록아웃과 표정 결과를 확인하고, 정전 구간 안 열차 2편을 운행관제와 공유', ref: '가상 절차 예시' },
          { text: '고운SSP·미루SSP의 89T를 열어 하선만 먼저 재급전할 수 있는지 검토', ref: '가상 절차 예시 · 구간 분리 판단은 관제사' },
          { text: '순회 출동 때 표정 위치와 함께 주변 설비 정보 전달', ref: '참고 정보 · 표정값은 그대로' },
        ],
      },
    ],
    mimic: { aiTarget: 'fault' },
  },
  {
    id: 'transformer',
    label: '주변압기 온도 편차',
    replay: false,
    clock: '09:40:00',
    defaultLayer: 'ss',
    alarms: [
      { t: '10-11 15:31:08', prio: 4, post: '한누리 SS', tag: 'TS1', text: '냉각팬 2군 기동', value: 'M좌 75.1 °C', group: 'INC-T', state: 'RTN' },
      { t: '10-13 14:05:42', prio: 4, post: '한누리 SS', tag: 'TS1', text: '냉각팬 2군 기동', value: 'M좌 74.8 °C', group: 'INC-T', state: 'RTN' },
      { t: '10-14 11:02:17', prio: 3, post: '다온 SSP', tag: 'RTU', text: 'RTU 통신 재접속', value: '', group: null, separate: '통신 이벤트입니다. 변압기와 관계없습니다.', state: 'ACKED' },
      { t: '10-14 16:20:33', prio: 4, post: '한누리 SS', tag: 'TS1', text: '냉각팬 2군 기동', value: 'M좌 75.0 °C', group: 'INC-T', state: 'RTN' },
      { t: '10-15 08:58:04', prio: 4, post: '한누리 SS', tag: 'TS1', text: '냉각팬 2군 기동', value: 'M좌 74.6 °C', group: 'INC-T', state: 'RTN' },
      { t: '10-15 15:47:51', prio: 4, post: '한누리 SS', tag: 'TS1', text: '냉각팬 2군 기동', value: 'M좌 75.3 °C', group: 'INC-T', state: 'RTN' },
      { t: '10-16 09:12:26', prio: 4, post: '한누리 SS', tag: 'TS1', text: '냉각팬 2군 기동', value: 'M좌 74.9 °C', group: 'INC-T', state: 'RTN' },
    ],
    incidents: [
      {
        id: 'INC-T',
        prio: 'ai',
        title: '주변압기 TS1, 비슷한 운전 조건에서 M좌 권선 온도가 평소보다 높음',
        where: '한누리 SS 주변압기 TS1 (상용)',
        aiNote: '알람은 아닙니다. 점검 순서를 정할 때 참고하도록 올렸습니다',
        summary: [
          `지난 3주 동안 비슷한 부하율과 외기 온도에서 TS1 M좌 권선 온도가 과거 같은 조건의 값보다 높게 나옵니다. 최근 일주일은 평균 ${lastWeekGap.toFixed(1)} °C 높고, 차이가 조금씩 커지고 있습니다.`,
          '예방진단장치 판정은 정상입니다. 판정을 바꾸자는 것이 아니라, 운전 조건 비교를 덧붙여 냉각 계통 확인을 정기점검보다 먼저 할지 검토해 볼 만하다는 정도입니다. 냉각팬 2군 기동이 평소보다 잦은 것도 같은 방향입니다.',
        ],
        facts: [
          { k: 'M좌 권선 온도 (지금)', v: '78.4', unit: '°C', sub: '같은 조건 과거 값 71.6 °C' },
          { k: '부하율 · 외기', v: '62', unit: '% · 18.2 °C', sub: '최근 3주 범위 안' },
          { k: '냉각팬 2군 기동', v: '6', unit: '회/주', sub: '과거 평균 2회/주' },
          { k: '예방진단장치 판정', v: '정상', sub: '기준값 이내' },
        ],
        trend: TRANSFORMER_TREND,
        stepsTitle: '확인 순서 후보 · 판단은 담당 부서',
        steps: [
          { text: '냉각기(팬·방열기) 상태 현장 확인을 11월 20일 정기점검 전에 할지 검토', ref: '점검 순서 참고' },
          { text: '최근 절연유 분석 결과가 있으면 함께 확인', ref: '예방진단 기록' },
          { text: '확인 결과를 기록해 다음 평가의 확인 사례로 사용', ref: '평가 지표: 잘못 올린 후보 · 놓친 사건' },
        ],
      },
    ],
    mimic: { aiTarget: 'TS1' },
  },
  {
    id: 'breaker',
    label: '차단기 동작 시간 추세',
    replay: false,
    clock: '11:05:00',
    defaultLayer: 'ss',
    alarms: [
      { t: '09-24 01:08:12', prio: 4, post: '한누리 SS', tag: '52F3', text: 'F3 급전 차단기 개방 (작업 정전)', value: '43.6 ms', group: 'INC-B', state: 'RTN' },
      { t: '09-30 13:55:41', prio: 1, post: '한누리 SS', tag: '52F3', text: 'F3 급전 차단기 트립 (보호 동작 · 당시 사건은 별도 기록)', value: '44.1 ms', group: 'INC-B', state: 'ACKED' },
      { t: '10-09 01:12:30', prio: 4, post: '한누리 SS', tag: '52F3', text: 'F3 급전 차단기 개방 (작업 정전)', value: '44.6 ms', group: 'INC-B', state: 'RTN' },
      { t: '10-12 02:20:05', prio: 4, post: '솔빛 SSP', tag: '89T', text: '상하선 타이 개폐기 개방 (작업)', value: '', group: null, separate: '작업 계획에 따른 조작입니다. 차단기 추세와 관계없습니다.', state: 'RTN' },
      { t: '10-16 06:41:57', prio: 4, post: '한누리 SS', tag: '52F3', text: 'F3 급전 차단기 개방 (작업 정전)', value: '45.2 ms', group: 'INC-B', state: 'RTN' },
    ],
    incidents: [
      {
        id: 'INC-B',
        prio: 'ai',
        title: '급전 차단기 52F3, 개방 시간이 조금씩 늘어남',
        where: '한누리 SS F3 급전반 (T상 상선)',
        aiNote: '알람은 아닙니다. 점검 순서를 정할 때 참고하도록 올렸습니다',
        summary: [
          `최근 40회 동작에서 52F3의 개방 시간이 37.8 ms에서 45.2 ms로 늘었습니다. 관리 기준 안이지만, 같은 형식 차단기들의 평균은 같은 기간 ${fleetAvg.toFixed(1)} ms 안팎에서 거의 변하지 않았습니다.`,
          '기계 쪽 문제인지 측정 쪽 문제인지는 기록만으로 알 수 없습니다. 다음 정기점검 전에 동작 특성 시험을 할지 검토할 후보입니다.',
        ],
        facts: [
          { k: '최근 개방 시간', v: '45.2', unit: 'ms', sub: '40회 전 37.8 ms' },
          { k: '같은 형식 평균', v: fleetAvg.toFixed(1), unit: 'ms', sub: '이 SS 4대 · 인접 SS 5대' },
          { k: '관리 기준', v: '제조사 값', sub: '기준 안' },
          { k: '데이터 출처', v: '전철제어반', sub: '트립 지령 → 보조접점 변화' },
        ],
        ops: BREAKER_OPS,
        stepsTitle: '확인 순서 후보 · 판단은 담당 부서',
        steps: [
          { text: '다음 정기점검 전에 52F3 동작 특성 시험을 할지 검토', ref: '점검 순서 참고' },
          { text: '같은 형식 차단기와 비교한 기록을 정비 부서 점검 의뢰에 첨부', ref: '설비 이력 참고' },
        ],
      },
    ],
    mimic: { aiTarget: '52F3' },
  },
];

// 고장 장면의 묶음 문구는 데이터에서 센다.
{
  const fault = SCENES[0];
  const inc = fault.incidents[0];
  const n = fault.alarms.filter((a) => a.group === inc.id).length;
  inc.aiNote = `원래 알람 ${fault.alarms.length}건 가운데 ${n}건을 사건 1건으로 묶었습니다`;
}

export const DEFAULT_SCENE_ID = 'fault';

export function getScene(id) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}

// 보여 준 알람까지의 effect를 적용해 계통도 상태를 만든다.
export function deriveMimicState(scene, shownCount) {
  const breakers = {};
  let fault = false;
  let trainsStopped = false;
  scene.alarms.slice(0, shownCount).forEach((a) => {
    if (a.effect?.breaker) breakers[a.effect.breaker] = a.effect.state;
    if (a.effect?.fault) fault = true;
    if (a.effect?.trainsStopped) trainsStopped = true;
  });
  return { breakers, fault, trainsStopped };
}

export function sortNewestFirst(alarms) {
  return [...alarms].sort((a, b) => (a.t < b.t ? 1 : -1));
}
