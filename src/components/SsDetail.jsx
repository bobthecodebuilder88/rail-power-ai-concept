import { AI, Breaker, DEAD, Disc, Dot, Ground, LIVE, MeterBox, RED, TripBadge, Transformer, VAL, Wire } from './symbols';

// 한누리 변전소 단선도. 수전 → 154 kV 이중모선 → 52TP → 스코트 변압기 → 52TS → 55 kV M/T 모선 → 급전반.
// 배치는 실제 전철변전소 화면의 순서(89 단로기 - 52 차단기 - 89 단로기 - AT - 선로)를 따르되 값은 모두 가상이다.
const W = 1240;
const H = 500;

const Y = {
  bus1: 116,
  bus2: 132,
  busM: 268,
  busT: 284,
  fA: 304,
  fBr: 330,
  fB: 358,
  node: 374,
  xfer: 430,
  up: 456,
  dn: 472,
};

const FEEDERS = [
  { id: 'F1', x: 200, bus: 'M', out: 'up', amps: 412 },
  { id: 'F2', x: 380, bus: 'M', out: 'dn', amps: 386 },
  { id: 'F3', x: 860, bus: 'T', out: 'up', amps: 455 },
  { id: 'F4', x: 1040, bus: 'T', out: 'dn', amps: 398 },
];

function Incoming({ x, n, meterX }) {
  return (
    <g>
      <text x={x} y={14} textAnchor="middle" className="tag">154 kV {n}L (한전 변전소)</text>
      <path d={`M${x - 5} 20 h10 l-5 7 Z`} fill={LIVE} />
      <Wire d={`M${x} 27 V88`} width={1.6} />
      <Disc cx={x} cy={44} />
      <text x={x + 9} y={47} className="tag">89RL{n}</text>
      <Breaker cx={x} cy={68} />
      <text x={x + 10} y={71} className="tag">52R{n}</text>
      <Wire d={`M${x - 16} 88 H${x + 16}`} width={1.6} />
      <Wire d={`M${x - 16} 88 V${Y.bus1}`} width={1.6} />
      <Wire d={`M${x + 16} 88 V${Y.bus2}`} width={1.6} />
      <Disc cx={x - 16} cy={100} r={4.5} />
      <Disc cx={x + 16} cy={100} r={4.5} />
      <text x={x - 24} y={103} className="tag" textAnchor="end">89R{n}B1</text>
      <text x={x + 24} y={103} className="tag">89R{n}B2</text>
      <Dot cx={x - 16} cy={Y.bus1} />
      <Dot cx={x + 16} cy={Y.bus2} />
      <MeterBox
        x={meterX}
        y={20}
        w={82}
        title={`R${n}`}
        unitW={28}
        rows={[
          { v: n === 1 ? '154.6' : '154.4', unit: 'kV' },
          { v: n === 1 ? '118' : '0', unit: 'A' },
          { v: n === 1 ? '27.9' : '0.0', unit: 'MW' },
          { v: n === 1 ? '0.99' : '–', unit: 'PF' },
        ]}
      />
    </g>
  );
}

function MainTransformer({ x, n, live, meterX, meterRows }) {
  const state = live ? 'closed' : 'open';
  return (
    <g>
      <Wire d={`M${x - 16} ${Y.bus1} V158`} live={live} width={1.6} />
      <Wire d={`M${x + 16} ${Y.bus2} V158`} live={live} width={1.6} />
      <Dot cx={x - 16} cy={Y.bus1} />
      <Dot cx={x + 16} cy={Y.bus2} />
      <Disc cx={x - 16} cy={146} r={4.5} />
      <Disc cx={x + 16} cy={146} r={4.5} closed={false} />
      <text x={x - 24} y={149} className="tag" textAnchor="end">89TP{n}B1</text>
      <text x={x + 24} y={149} className="tag">89TP{n}B2</text>
      <Wire d={`M${x - 16} 158 H${x + 16} M${x} 158 V218`} live={live} width={1.6} />
      <Breaker cx={x} cy={172} state={state} />
      <text x={x + 10} y={175} className="tag">52TP{n}</text>
      <Transformer cx={x} cy={194} live={live} />
      <text x={x + 12} y={204} className="tag">TS{n}{live ? '' : ' 예비'}</text>
      <Breaker cx={x} cy={232} state={state} />
      <text x={x + 10} y={235} className="tag">52TS{n}</text>
      <Wire d={`M${x} 238 V246 M${x - 8} 246 H${x + 8} M${x - 8} 246 V${Y.busM} M${x + 8} 246 V${Y.busT}`} live={live} width={1.6} />
      <Disc cx={x - 8} cy={256} r={3.8} closed={live} />
      <Disc cx={x + 8} cy={256} r={3.8} closed={live} />
      <Dot cx={x - 8} cy={Y.busM} />
      <Dot cx={x + 8} cy={Y.busT} />
      <MeterBox x={meterX} y={168} w={112} unitW={42} title={`TS${n}`} rows={meterRows} />
    </g>
  );
}

function Feeder({ f, state, highlight }) {
  const live = state === 'closed';
  const busY = f.bus === 'M' ? Y.busM : Y.busT;
  const outY = f.out === 'up' ? Y.up : Y.dn;
  const n = f.id.slice(1);
  return (
    <g>
      <Dot cx={f.x} cy={busY} />
      <Wire d={`M${f.x} ${busY} V${Y.fBr - 6}`} width={1.6} />
      <Disc cx={f.x} cy={Y.fA} />
      <text x={f.x - 9} y={Y.fA + 3} className="tag" textAnchor="end">89{f.id}a</text>
      <Breaker cx={f.x} cy={Y.fBr} state={state} />
      <text x={f.x - 10} y={Y.fBr + 3} className="tag" textAnchor="end">52{f.id}</text>
      <text x={f.x - 10} y={Y.fBr + 15} className="tag" textAnchor="end" style={{ fontSize: 8.5 }}>원격</text>
      {state === 'tripped' && <TripBadge x={f.x + 34} y={Y.fA} />}
      <MeterBox
        x={f.x + 12}
        y={Y.fBr - 13}
        w={66}
        rows={[
          { v: live ? String(f.amps) : '0', unit: 'A' },
          { v: live ? (f.bus === 'M' ? '54.8' : '55.0') : '0.0', unit: 'kV' },
        ]}
        dead={!live}
      />
      <Wire d={`M${f.x} ${Y.fBr + 6} V${outY}`} live={live} width={1.6} />
      <Disc cx={f.x} cy={Y.fB} closed />
      <text x={f.x - 9} y={Y.fB + 3} className="tag" textAnchor="end">89{f.id}b</text>
      <Dot cx={f.x} cy={Y.node} live={live} />
      {/* 출구 AT */}
      <Wire d={`M${f.x} ${Y.node} H${f.x + 30} V${Y.node + 20}`} live={live} width={1.2} />
      <Disc cx={f.x + 30} cy={Y.node + 8} r={3.6} closed />
      <text x={f.x + 36} y={Y.node + 11} className="tag">89AT{n}</text>
      <circle cx={f.x + 30} cy={Y.node + 25} r="5" fill="#fff" stroke={live ? LIVE : DEAD} strokeWidth="1.3" />
      <text x={f.x + 38} y={Y.node + 28} className="tag">AT</text>
      <Ground x={f.x + 30} y={Y.node + 30} />
      {/* FZ 절체 경로 (평상시 열림) */}
      <path d={`M${f.x} ${Y.node + 14} H${f.x - 22} V${Y.xfer}`} stroke={DEAD} strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
      <Disc cx={f.x - 22} cy={Y.xfer - 12} r={3.6} closed={false} />
      <text x={f.x - 28} y={Y.xfer - 9} className="tag" textAnchor="end">89FZ{n}</text>
      <Dot cx={f.x} cy={outY} live={live} />
      {highlight && (
        <g>
          <rect x={f.x - 46} y={Y.fBr - 18} width={130} height={36} fill="none" stroke={AI} strokeWidth="1.6" strokeDasharray="4 3" />
          <text x={f.x + 12} y={Y.fBr + 30} className="ai-label">AI 점검 후보</text>
          <text x={f.x + 12} y={Y.fBr + 41} className="ai-sub">개방 37.8 → 45.2 ms</text>
        </g>
      )}
    </g>
  );
}

export default function SsDetail({ mimicState, scene }) {
  const { breakers } = mimicState;
  const br = (id) => breakers[id] ?? 'closed';
  const aiTarget = scene.mimic.aiTarget;
  const st = {
    F1: br('52F1'),
    F2: br('52F2'),
    F3: br('52F3'),
    F4: br('52F4'),
  };
  const mAmps = (st.F1 === 'closed' ? 412 : 0) + (st.F2 === 'closed' ? 386 : 0);
  const tAmps = (st.F3 === 'closed' ? 455 : 0) + (st.F4 === 'closed' ? 398 : 0);
  const winding = aiTarget === 'TS1' ? '78.4' : '66.2';
  const upLeftLive = st.F1 === 'closed' || st.F2 === 'closed';
  const upRightLive = st.F3 === 'closed' || st.F4 === 'closed';

  return (
    <svg className="mimic mimic-ss" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="한누리 변전소 단선도">
      <text x={16} y={22} className="post-name">한누리 변전소 (SS)</text>
      <text x={16} y={37} className="post-kind">스코트 결선 · 55 kV GIS · 25k000</text>
      <text x={W - 16} y={18} textAnchor="end" className="tag">154 kV 통신 ● 정상   55 kV 통신 ● 정상</text>
      <text x={W - 16} y={32} textAnchor="end" className="tag">제어 위치: 원격 (관제센터)</text>

      <Incoming x={300} n={1} meterX={360} />
      <Incoming x={940} n={2} meterX={836} />

      <path d={`M220 ${Y.bus1} H1020`} stroke={LIVE} strokeWidth="3" />
      <path d={`M220 ${Y.bus2} H1020`} stroke={LIVE} strokeWidth="3" />
      <text x={214} y={Y.bus1 + 3} className="tag" textAnchor="end">154 kV BUS-1</text>
      <text x={214} y={Y.bus2 + 3} className="tag" textAnchor="end">154 kV BUS-2</text>

      <MainTransformer
        x={470}
        n={1}
        live
        meterX={342}
        meterRows={[
          { v: String(mAmps), unit: 'A (M)' },
          { v: String(tAmps), unit: 'A (T)' },
          { v: winding, unit: '°C M좌' },
        ]}
      />
      <MainTransformer
        x={770}
        n={2}
        live={false}
        meterX={640}
        meterRows={[
          { v: '0', unit: 'A (M)' },
          { v: '0', unit: 'A (T)' },
          { v: '31.0', unit: '°C M좌' },
        ]}
      />
      <MeterBox x={560} y={228} w={78} title="BUS-M PT" rows={[{ v: '55.1', unit: 'kV' }]} />
      <MeterBox x={646} y={228} w={78} title="BUS-T PT" rows={[{ v: '55.0', unit: 'kV' }]} />

      <path d={`M140 ${Y.busM} H1100`} stroke={LIVE} strokeWidth="3" />
      <path d={`M140 ${Y.busT} H1100`} stroke={LIVE} strokeWidth="3" />
      <text x={134} y={Y.busM + 3} className="tag" textAnchor="end">55 kV M</text>
      <text x={134} y={Y.busT + 3} className="tag" textAnchor="end">55 kV T</text>

      {FEEDERS.map((f) => (
        <Feeder key={f.id} f={f} state={st[f.id]} highlight={aiTarget === '52F3' && f.id === 'F3'} />
      ))}

      {/* FZ 공통반: M·T 모선 중 하나를 골라 고장 난 급전반 대신 쓴다 (평상시 대기) */}
      <g>
        <Dot cx={604} cy={Y.busM} />
        <Dot cx={636} cy={Y.busT} />
        <Wire d={`M604 ${Y.busM} V306 M636 ${Y.busT} V306`} width={1.4} />
        <Disc cx={604} cy={298} r={4} closed={false} />
        <Disc cx={636} cy={298} r={4} closed={false} />
        <text x={596} y={301} className="tag" textAnchor="end">89FZM</text>
        <text x={644} y={301} className="tag">89FZT</text>
        <Wire d={`M604 306 H636 M620 306 V${Y.xfer}`} live={false} width={1.4} />
        <Breaker cx={620} cy={Y.fBr} state="open" />
        <text x={630} y={Y.fBr + 3} className="tag">52FZ 대기</text>
        <Dot cx={620} cy={Y.xfer} live={false} />
      </g>
      <path d={`M150 ${Y.xfer} H1060`} stroke={DEAD} strokeWidth="1.6" strokeDasharray="5 3" />
      <text x={1066} y={Y.xfer + 3} className="tag">FZ 절체 모선</text>

      {/* 선로 인출 */}
      <Wire d={`M40 ${Y.up} H200`} live={upLeftLive} width={2.5} />
      <Wire d={`M40 ${Y.dn} H380`} live={upLeftLive} width={2.5} />
      <Wire d={`M860 ${Y.up} H1200`} live={upRightLive} width={2.5} />
      <Wire d={`M1040 ${Y.dn} H1200`} live={upRightLive} width={2.5} />
      <path d={`M40 ${Y.up - 6} l-10 6 l10 6 Z`} fill={upLeftLive ? LIVE : DEAD} />
      <path d={`M40 ${Y.dn - 6} l-10 6 l10 6 Z`} fill={upLeftLive ? LIVE : DEAD} />
      <path d={`M1200 ${Y.up - 6} l10 6 l-10 6 Z`} fill={upRightLive ? LIVE : DEAD} />
      <path d={`M1200 ${Y.dn - 6} l10 6 l-10 6 Z`} fill={upRightLive ? LIVE : DEAD} />
      <text x={48} y={Y.up - 6} className="tag">상선 · 서들 SP 방면 (M상)</text>
      <text x={48} y={Y.dn + 15} className="tag">하선</text>
      <text x={1192} y={Y.up - 6} textAnchor="end" className="tag">너울 SP 방면 (T상) · 상선</text>
      <text x={1192} y={Y.dn + 15} textAnchor="end" className="tag">하선</text>
      <path d={`M612 ${Y.up - 8} l8 16 M620 ${Y.up - 8} l8 16`} stroke={LIVE} strokeWidth="1.4" />
      <text x={620} y={Y.dn + 15} textAnchor="middle" className="tag">절연구간</text>

      {aiTarget === 'TS1' && (
        <g>
          <rect x={448} y={178} width={56} height={38} fill="none" stroke={AI} strokeWidth="1.6" strokeDasharray="4 3" />
          <rect x={340} y={166} width={116} height={56} fill="none" stroke={AI} strokeWidth="1.2" strokeDasharray="4 3" />
          <text x={336} y={186} textAnchor="end" className="ai-label">AI 점검 후보</text>
          <text x={336} y={198} textAnchor="end" className="ai-sub">M좌 권선 오늘 +6.8 °C</text>
        </g>
      )}
      {(st.F1 === 'tripped' || st.F2 === 'tripped') && (
        <text x={290} y={Y.fBr + 34} textAnchor="middle" className="val" style={{ fill: RED, fontWeight: 600 }}>
          F1·F2 록아웃
        </text>
      )}
      <text x={16} y={52} className="tag" style={{ fill: VAL }}>
        파란 숫자: 실시간 계측값 (가상)
      </text>
    </svg>
  );
}
