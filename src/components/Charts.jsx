// 근거 카드 안의 작은 차트들. 값은 모두 가상이다.
const INK = '#2a2e33';
const MUTED = '#646e78';
const GRID = '#e1e4e7';
const AI = '#4352a8';
const RED = '#c62828';

function scale(d0, d1, r0, r1) {
  return (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

// 고장기록장치: F1 전류 실효값. 트립 → 재폐로 → 재트립
export function WaveformChart() {
  const w = 400;
  const h = 120;
  const sx = scale(-0.3, 2.2, 36, w - 10);
  const sy = scale(0, 4, h - 22, 10);
  const pts = [
    [-0.3, 0.41], [0, 0.41], [0.002, 3.4], [0.051, 3.4], [0.055, 0], [1.503, 0], [1.505, 3.3], [1.556, 3.3], [1.6, 0], [2.2, 0],
  ];
  const d = pts.map(([t, v], i) => `${i ? 'L' : 'M'}${sx(t).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ');
  const marks = [
    { t: 0.051, label: '트립 07.463' },
    { t: 1.503, label: '재폐로 08.915' },
    { t: 1.6, label: '재트립 09.011' },
  ];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="F1 전류 실효값: 0.41 kA에서 3.4 kA로 올랐다가 트립, 재폐로 뒤 3.3 kA로 다시 올라 재트립">
      {[0, 1, 2, 3, 4].map((v) => (
        <g key={v}>
          <path d={`M36 ${sy(v)} H${w - 10}`} stroke={GRID} />
          <text x={30} y={sy(v) + 3} textAnchor="end" fontSize="9" fill={MUTED} fontFamily="var(--mono)">{v}</text>
        </g>
      ))}
      <text x={36} y={8} fontSize="9" fill={MUTED}>kA</text>
      <path d={d} fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      {marks.map((m, i) => (
        <g key={m.label}>
          <path d={`M${sx(m.t)} ${sy(0)} V${sy(0) + 4}`} stroke={MUTED} />
          <text x={sx(m.t) + (i === 2 ? 4 : i === 1 ? -4 : 4)} y={h - 6} fontSize="9" fill={MUTED} textAnchor={i === 1 ? 'end' : 'start'}>{m.label}</text>
        </g>
      ))}
      <text x={sx(0.03)} y={sy(3.4) - 4} fontSize="9.5" fill={INK} fontFamily="var(--mono)">3.4 kA</text>
    </svg>
  );
}

// 위치가 확인된 과거 사건이 표정값 주변 어디에 있었는지 (m)
export function FlHistoryChart({ history, band, fromSs }) {
  const w = 400;
  const h = 100;
  const lo = band.fromSs[0] - fromSs;
  const hi = band.fromSs[1] - fromSs;
  const sx = scale(-0.25, 0.25, 20, w - 20);
  const rowY = 50;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`이 구간에서 위치가 확인된 과거 ${history.length}건은 모두 표정값에서 200 m 안쪽. AI 참고 구간은 표정값 기준 ${Math.round(lo * 1000)} m에서 +${Math.round(hi * 1000)} m`}>
      <rect x={sx(-0.2)} y={20} width={sx(0.2) - sx(-0.2)} height={52} fill={GRID} fillOpacity="0.6" />
      <text x={sx(-0.2) + 3} y={30} fontSize="9" fill={MUTED}>공단 규격 ±200 m</text>
      <rect x={sx(lo)} y={24} width={sx(hi) - sx(lo)} height={44} fill={AI} fillOpacity="0.12" stroke={AI} strokeDasharray="3 2" />
      <text x={sx(hi) + 4} y={44} fontSize="9.5" fill={AI} fontWeight="700">AI 참고 구간</text>
      <path d={`M${sx(0)} 14 V76`} stroke={RED} strokeWidth="1.5" />
      <text x={sx(0)} y={11} fontSize="9.5" fill={RED} textAnchor="middle">표정값</text>
      {history.map((hItem, i) => (
        <circle
          key={hItem.when}
          cx={sx(hItem.err)}
          cy={rowY + (i % 2 ? 8 : -8)}
          r="4.5"
          fill={hItem.kind === '사고' ? INK : '#fff'}
          stroke={INK}
          strokeWidth="1.4"
        >
          <title>{`${hItem.when} ${hItem.kind}: 표정값에서 ${hItem.err >= 0 ? '+' : ''}${Math.round(hItem.err * 1000)} m`}</title>
        </circle>
      ))}
      <path d={`M20 80 H${w - 20}`} stroke={MUTED} />
      {[-200, -100, 0, 100, 200].map((m) => (
        <g key={m}>
          <path d={`M${sx(m / 1000)} 80 V84`} stroke={MUTED} />
          <text x={sx(m / 1000)} y={95} fontSize="9" fill={MUTED} textAnchor="middle" fontFamily="var(--mono)">{m > 0 ? `+${m}` : m}</text>
        </g>
      ))}
      <text x={w - 20} y={11} fontSize="9" fill={MUTED} textAnchor="end">m · SS에서 먼 쪽 +</text>
    </svg>
  );
}

// 주변압기 권선 온도: 같은 부하·외기 조건 예상값 vs 실제
export function TemperatureChart({ trend }) {
  const w = 400;
  const h = 130;
  const vals = trend.flatMap((d) => [d.expected, d.actual]);
  const min = Math.floor(Math.min(...vals) - 2);
  const max = Math.ceil(Math.max(...vals) + 2);
  const sx = scale(1, trend.length, 34, w - 54);
  const sy = scale(min, max, h - 22, 8);
  const line = (key) => trend.map((d, i) => `${i ? 'L' : 'M'}${sx(d.day).toFixed(1)} ${sy(d[key]).toFixed(1)}`).join(' ');
  const bandTop = trend.map((d, i) => `${i ? 'L' : 'M'}${sx(d.day).toFixed(1)} ${sy(d.expected + 1.5).toFixed(1)}`).join(' ');
  const bandBot = [...trend].reverse().map((d) => `L${sx(d.day).toFixed(1)} ${sy(d.expected - 1.5).toFixed(1)}`).join(' ');
  const last = trend[trend.length - 1];
  const ticks = [min, Math.round((min + max) / 2), max];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`최근 21일 권선 온도. 오늘 실제 ${last.actual} °C, 같은 조건 과거 값 ${last.expected} °C`}>
      {ticks.map((v) => (
        <g key={v}>
          <path d={`M34 ${sy(v)} H${w - 54}`} stroke={GRID} />
          <text x={28} y={sy(v) + 3} textAnchor="end" fontSize="9" fill={MUTED} fontFamily="var(--mono)">{v}</text>
        </g>
      ))}
      <path d={`${bandTop} ${bandBot} Z`} fill={MUTED} fillOpacity="0.16" />
      <path d={line('expected')} fill="none" stroke={MUTED} strokeWidth="2" strokeDasharray="5 3" />
      <path d={line('actual')} fill="none" stroke={INK} strokeWidth="2" />
      {trend.map((d) => (
        <circle key={d.day} cx={sx(d.day)} cy={sy(d.actual)} r="6" fill="transparent">
          <title>{`${d.day === trend.length ? '오늘' : `${trend.length - d.day}일 전`}: 실제 ${d.actual} °C, 같은 조건 과거 값 ${d.expected} °C, 부하율 ${d.load}%, 외기 ${d.ambient} °C`}</title>
        </circle>
      ))}
      <circle cx={sx(last.day)} cy={sy(last.actual)} r="3.5" fill={INK} />
      <text x={sx(last.day) + 6} y={sy(last.actual) + 3} fontSize="9.5" fill={INK}>실제</text>
      <text x={sx(last.day) + 6} y={sy(last.expected) + 3} fontSize="9.5" fill={MUTED}>과거 값</text>
      <text x={34} y={h - 6} fontSize="9" fill={MUTED}>20일 전</text>
      <text x={w - 54} y={h - 6} fontSize="9" fill={MUTED} textAnchor="end">오늘</text>
      <text x={w - 4} y={h - 6} fontSize="9" fill={MUTED} textAnchor="end">°C</text>
    </svg>
  );
}

// 차단기 개방 시간: 52F3 vs 같은 형식 5대 평균
export function BreakerChart({ ops }) {
  const w = 400;
  const h = 130;
  const sx = scale(1, ops.length, 34, w - 60);
  const sy = scale(34, 48, h - 22, 8);
  const line = (key) => ops.map((d, i) => `${i ? 'L' : 'M'}${sx(d.n).toFixed(1)} ${sy(d[key]).toFixed(1)}`).join(' ');
  const last = ops[ops.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`최근 40회 개방 시간. 52F3 마지막 ${last.target} ms, 같은 형식 평균 ${last.fleet} ms`}>
      {[36, 40, 44, 48].map((v) => (
        <g key={v}>
          <path d={`M34 ${sy(v)} H${w - 60}`} stroke={GRID} />
          <text x={28} y={sy(v) + 3} textAnchor="end" fontSize="9" fill={MUTED} fontFamily="var(--mono)">{v}</text>
        </g>
      ))}
      <path d={line('fleet')} fill="none" stroke={MUTED} strokeWidth="2" strokeDasharray="5 3" />
      <path d={line('target')} fill="none" stroke={INK} strokeWidth="2" />
      {ops.map((d) => (
        <circle key={d.n} cx={sx(d.n)} cy={sy(d.target)} r="6" fill="transparent">
          <title>{`${d.n}번째 동작: 52F3 ${d.target} ms, 같은 형식 평균 ${d.fleet} ms`}</title>
        </circle>
      ))}
      <circle cx={sx(last.n)} cy={sy(last.target)} r="3.5" fill={INK} />
      <text x={sx(last.n) + 6} y={sy(last.target) + 3} fontSize="9.5" fill={INK}>52F3</text>
      <text x={sx(last.n) + 6} y={sy(last.fleet) + 3} fontSize="9.5" fill={MUTED}>같은 형식</text>
      <text x={34} y={h - 6} fontSize="9" fill={MUTED}>40회 전</text>
      <text x={w - 60} y={h - 6} fontSize="9" fill={MUTED} textAnchor="end">최근</text>
      <text x={w - 4} y={h - 6} fontSize="9" fill={MUTED} textAnchor="end">ms</text>
    </svg>
  );
}
