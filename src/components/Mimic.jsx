import { POSTS, STATIONS } from '../data/line';
import { fmtK } from '../data/scenes';
import { AI, Breaker, DEAD, Dot, LIVE, NeutralSection, RED, TripBadge, Transformer, VAL, Wire } from './symbols';

// 노선 개요 계통도. 기점 0k000에서 50k000까지 가로로 편다.
const W = 1240;
const H = 396;
const X0 = 116;
const PX_PER_KM = 21.2;
const x = (km) => X0 + km * PX_PER_KM;
const SS_X = x(25);

const Y = {
  upAF: 180,
  upTF: 192,
  dnTF: 228,
  dnAF: 240,
  upMain: 284,
  dnMain: 308,
  plate: 344,
  scale: 368,
};

const MAJOR = ['고운', '한누리', '다온'];

function HDisc({ cx, y, live }) {
  // 선로 위 구분 개폐기 (닫힘)
  return <circle cx={cx} cy={y} r="3.6" fill={live ? LIVE : '#fff'} stroke={live ? LIVE : DEAD} strokeWidth="1.2" />;
}

function AutoTransformer({ cx, yTop, yBot, live }) {
  const mid = (yTop + yBot) / 2;
  const stroke = live ? LIVE : DEAD;
  return (
    <g stroke={stroke} strokeWidth="1.2" fill="#fff">
      <path d={`M${cx} ${yTop} V${mid - 3.5} M${cx} ${mid + 3.5} V${yBot}`} />
      <circle cx={cx} cy={mid} r="3.5" />
    </g>
  );
}

function Train({ km, track, id, stopped }) {
  const up = track === 'up';
  const cy = up ? Y.upMain : Y.dnMain;
  const cx = x(km);
  // 상선은 기점(왼쪽) 방향, 하선은 종점(오른쪽) 방향으로 달린다.
  const nose = up
    ? `M${cx - 19} ${cy} L${cx - 14} ${cy - 6} L${cx - 14} ${cy + 6} Z`
    : `M${cx + 19} ${cy} L${cx + 14} ${cy - 6} L${cx + 14} ${cy + 6} Z`;
  const fill = stopped ? '#fff' : '#59636d';
  return (
    <g>
      <rect x={cx - 14} y={cy - 6} width={28} height={12} fill={fill} stroke="#59636d" strokeWidth="1.2" />
      <path d={nose} fill={fill} stroke="#59636d" strokeWidth="1.2" />
      <text x={cx} y={cy + 3.2} textAnchor="middle" className="train-label" style={stopped ? { fill: '#3a4550' } : undefined}>
        {id}
      </text>
    </g>
  );
}

function Station({ s }) {
  const cx = x(s.km);
  const major = MAJOR.includes(s.name);
  const pw = major ? 56 : 40;
  return (
    <g>
      {major ? (
        <>
          {/* 부본선: 본선에서 갈라져 승강장 쪽으로 붙었다가 다시 합류 */}
          <path d={`M${cx - 48} ${Y.upMain} L${cx - 36} ${Y.upMain - 12} H${cx + 36} L${cx + 48} ${Y.upMain}`} stroke="#7d868f" strokeWidth="1.6" fill="none" />
          <path d={`M${cx - 48} ${Y.dnMain} L${cx - 36} ${Y.dnMain + 12} H${cx + 36} L${cx + 48} ${Y.dnMain}`} stroke="#7d868f" strokeWidth="1.6" fill="none" />
          <rect x={cx - pw / 2} y={Y.upMain - 22} width={pw} height={6} fill="#cfd5da" stroke="#8b949c" strokeWidth="0.8" />
          <rect x={cx - pw / 2} y={Y.dnMain + 16} width={pw} height={6} fill="#cfd5da" stroke="#8b949c" strokeWidth="0.8" />
          {/* 건넘선 */}
          <path d={`M${cx + 52} ${Y.upMain} L${cx + 68} ${Y.dnMain}`} stroke="#7d868f" strokeWidth="1.4" />
        </>
      ) : (
        <>
          <rect x={cx - pw / 2} y={Y.upMain - 11} width={pw} height={6} fill="#cfd5da" stroke="#8b949c" strokeWidth="0.8" />
          <rect x={cx - pw / 2} y={Y.dnMain + 5} width={pw} height={6} fill="#cfd5da" stroke="#8b949c" strokeWidth="0.8" />
        </>
      )}
      <rect x={cx - 41} y={Y.plate - 12} width={82} height={17} rx={2} fill="#fff" stroke="#9aa3ab" />
      <text x={cx - 36} y={Y.plate} className="stn-name">{s.name}</text>
      <text x={cx + 37} y={Y.plate} textAnchor="end" className="km">{fmtK(s.km)}</text>
    </g>
  );
}

function PostBox({ post, voltage, live, selected, onSelect }) {
  const cx = x(post.km);
  const w = 92;
  return (
    <g
      className="clickable"
      role="button"
      tabIndex={0}
      aria-label={`${post.name} ${post.kindLabel} 알람 보기`}
      onClick={() => onSelect(post)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(post);
        }
      }}
    >
      <rect
        className="post-box"
        x={cx - w / 2}
        y={128}
        width={w}
        height={36}
        rx={2}
        fill={selected ? '#eceef9' : '#f4f5f6'}
        stroke={selected ? AI : '#9aa3ab'}
        strokeWidth={selected ? 1.6 : 1}
      />
      <text x={cx} y={143} textAnchor="middle" className="post-name">
        {post.name} {post.kind}
      </text>
      <text x={cx - 4} y={157} textAnchor="end" className="km">{fmtK(post.km)}</text>
      <text x={cx + 2} y={157} className="val" style={{ fill: live ? VAL : RED }}>{voltage}</text>
    </g>
  );
}

const BASE_KV = { 'SP-W': 26.3, 'SSP-1': 26.9, 'SSP-2': 27.2, 'SSP-3': 27.1, 'SSP-4': 26.8, 'SP-E': 26.4 };
const FEEDER_A = { '52F1': 412, '52F2': 386, '52F3': 455, '52F4': 398 };

export default function Mimic({ mimicState, scene, trains, selectedPostId, onSelectPost, onOpenSs }) {
  const { breakers, fault, trainsStopped } = mimicState;
  const br = (id) => breakers[id] ?? 'closed';
  const mLive = br('52F1') === 'closed' || br('52F2') === 'closed';
  const tLive = br('52F3') === 'closed' || br('52F4') === 'closed';
  const incident = scene.incidents[0];
  const aiTarget = scene.mimic.aiTarget;
  const fl = incident.fl;
  const showFault = fault && fl;

  const feeders = [
    { id: '52F1', fx: SS_X - 86, bus: 104, rows: [Y.upAF, Y.upTF], live: mLive, side: 'left' },
    { id: '52F2', fx: SS_X - 48, bus: 104, rows: [Y.dnTF, Y.dnAF], live: mLive, side: 'right' },
    { id: '52F3', fx: SS_X + 48, bus: 116, rows: [Y.upAF, Y.upTF], live: tLive, side: 'left' },
    { id: '52F4', fx: SS_X + 86, bus: 116, rows: [Y.dnTF, Y.dnAF], live: tLive, side: 'right' },
  ];

  // AI 표시 띠: 최소 26 px로 보이게 한다.
  let band = null;
  if (showFault && aiTarget === 'fault') {
    const x1 = x(fl.band.kmp[0]);
    const x2 = x(fl.band.kmp[1]);
    const mid = (x1 + x2) / 2;
    const half = Math.max(13, (x2 - x1) / 2);
    band = { x1: mid - half, x2: mid + half };
  }

  return (
    <svg className="mimic" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="한누리선 급전 계통도 (노선 개요)">
      {POSTS.map((p) => (
        <path key={`g-${p.id}`} d={`M${x(p.km)} 166 V${Y.scale}`} stroke="#dde1e4" strokeDasharray="2 3" />
      ))}

      <text x={8} y={Y.upAF + 3} className="tag">상선 AF</text>
      <text x={8} y={Y.upTF + 3} className="tag">상선 TF</text>
      <text x={8} y={Y.dnTF + 3} className="tag">하선 TF</text>
      <text x={8} y={Y.dnAF + 3} className="tag">하선 AF</text>
      <text x={8} y={Y.upMain + 4} className="track-label">◀ 상선</text>
      <text x={8} y={Y.dnMain + 4} className="track-label">하선 ▶</text>

      {/* ---------------- 변전소 (요약) ---------------- */}
      <g
        className="clickable"
        role="button"
        tabIndex={0}
        aria-label="한누리 변전소 단선도 열기"
        onClick={onOpenSs}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenSs();
          }
        }}
      >
        <rect className="post-box" x={SS_X + 104} y={6} width={150} height={52} rx={2} fill="#f4f5f6" stroke="#9aa3ab" />
        <text x={SS_X + 114} y={23} className="post-name">한누리 SS</text>
        <text x={SS_X + 114} y={37} className="post-kind">변전소 · {fmtK(25)}</text>
        <text x={SS_X + 114} y={51} className="post-kind" style={{ fill: AI, fontWeight: 600 }}>단선도 열기 ›</text>
      </g>
      <text x={SS_X - 52} y={9} className="tag" textAnchor="end">154 kV 1L</text>
      <text x={SS_X + 52} y={9} className="tag">2L</text>
      <Wire d={`M${SS_X - 45} 4 V40`} width={1.6} />
      <Wire d={`M${SS_X + 45} 4 V40`} width={1.6} />
      <Breaker cx={SS_X - 45} cy={22} size={10} />
      <text x={SS_X - 54} y={25} className="tag" textAnchor="end">52R1</text>
      <Breaker cx={SS_X + 45} cy={22} size={10} />
      <text x={SS_X + 54} y={25} className="tag">52R2</text>
      <path d={`M${SS_X - 80} 40 H${SS_X + 80}`} stroke={LIVE} strokeWidth="3.5" />
      <text x={SS_X - 84} y={43} className="tag" textAnchor="end">154 kV</text>

      <Wire d={`M${SS_X - 30} 40 V60`} width={1.6} />
      <Breaker cx={SS_X - 30} cy={50} size={9} />
      <text x={SS_X - 38} y={53} className="tag" textAnchor="end">52TP1</text>
      <Transformer cx={SS_X - 30} cy={66} />
      <text x={SS_X - 44} y={80} className="tag" textAnchor="end">TS1</text>
      <Wire d={`M${SS_X - 33} 84 V104`} width={1.6} />
      <Wire d={`M${SS_X - 27} 84 V116`} width={1.6} />
      <Dot cx={SS_X - 33} cy={104} />
      <Dot cx={SS_X - 27} cy={116} />

      <Wire d={`M${SS_X + 30} 40 V60`} width={1.6} />
      <Breaker cx={SS_X + 30} cy={50} state="open" size={9} />
      <text x={SS_X + 38} y={53} className="tag">52TP2</text>
      <Transformer cx={SS_X + 30} cy={66} live={false} />
      <text x={SS_X + 44} y={80} className="tag">TS2 예비</text>
      <Wire d={`M${SS_X + 27} 84 V104`} live={false} width={1.4} />
      <Wire d={`M${SS_X + 33} 84 V116`} live={false} width={1.4} />

      <path d={`M${SS_X - 100} 104 H${SS_X + 100}`} stroke={LIVE} strokeWidth="3" />
      <path d={`M${SS_X - 100} 116 H${SS_X + 100}`} stroke={LIVE} strokeWidth="3" />
      <text x={SS_X - 104} y={107} className="tag" textAnchor="end">55 kV M</text>
      <text x={SS_X - 104} y={119} className="tag" textAnchor="end">55 kV T</text>

      {feeders.map((f) => {
        const state = br(f.id);
        const outLive = state === 'closed' && f.live;
        const left = f.side === 'left';
        const tx = left ? f.fx - 9 : f.fx + 9;
        const anchor = left ? 'end' : 'start';
        return (
          <g key={f.id}>
            <Dot cx={f.fx} cy={f.bus} />
            <Wire d={`M${f.fx} ${f.bus} V134`} width={1.6} />
            <Wire d={`M${f.fx} 146 V${f.rows[1]}`} live={outLive} width={1.6} />
            <Breaker cx={f.fx} cy={140} state={state} />
            <text x={tx} y={135} className="tag" textAnchor={anchor}>{f.id}</text>
            <text x={tx} y={147} className="val" textAnchor={anchor} style={{ fill: outLive ? VAL : RED }}>
              {outLive ? `${FEEDER_A[f.id]} A` : '0 A'}
            </text>
            {state === 'tripped' && <TripBadge x={f.fx} y={123} />}
            <Dot cx={f.fx} cy={f.rows[0]} live={outLive} />
            <Dot cx={f.fx} cy={f.rows[1]} live={outLive} />
          </g>
        );
      })}
      <Breaker cx={SS_X} cy={140} state="open" size={9} />
      <text x={SS_X} y={158} className="tag" textAnchor="middle">52FZ</text>

      {/* ---------------- 전차선(TF)·급전선(AF) ---------------- */}
      {[
        { y: Y.upAF, w: 1.4 },
        { y: Y.upTF, w: 3 },
        { y: Y.dnTF, w: 3 },
        { y: Y.dnAF, w: 1.4 },
      ].map((row) => (
        <g key={row.y}>
          <Wire d={`M${x(0)} ${row.y} H${SS_X - 9}`} live={mLive} width={row.w} />
          <Wire d={`M${SS_X + 9} ${row.y} H${x(50)}`} live={tLive} width={row.w} />
        </g>
      ))}
      <NeutralSection cx={SS_X} y={Y.upTF} />
      <NeutralSection cx={SS_X} y={Y.dnTF} />
      <text x={SS_X} y={Y.dnAF + 14} textAnchor="middle" className="tag">절연구간</text>

      {/* SP 바깥: 절연구간을 건너는 연장급전 차단기 52E (평상시 개방) */}
      {[
        { post: 'SP-W', edge: x(0), dir: -1 },
        { post: 'SP-E', edge: x(50), dir: 1 },
      ].map((e) => {
        const ns = e.edge + e.dir * 16;
        const far = e.edge + e.dir * 34;
        return (
          <g key={e.post}>
            {[Y.upTF, Y.dnTF].map((ty, i) => {
              const off = i === 0 ? -11 : 11;
              return (
                <g key={ty}>
                  <path d={`M${e.edge} ${ty} H${far}`} stroke={DEAD} strokeWidth="2" strokeDasharray="4 3" />
                  <NeutralSection cx={ns} y={ty} />
                  <path d={`M${e.edge + e.dir * 6} ${ty} V${ty + off} H${far - e.dir * 4} V${ty}`} stroke={LIVE} strokeWidth="1" fill="none" />
                  <Breaker cx={ns} cy={ty + off} state="open" size={8} />
                </g>
              );
            })}
            <text x={ns} y={Y.upTF - 18} textAnchor="middle" className="tag">52E</text>
          </g>
        );
      })}
      <text x={8} y={Y.dnAF + 26} className="tag">← 인접 SS 구역</text>
      <text x={W - 6} y={Y.dnAF + 26} textAnchor="end" className="tag">인접 SS 구역 →</text>

      {/* SSP·SP: AT, 상하선 타이(89T), 구분 개폐기 */}
      {POSTS.filter((p) => p.kind !== 'SS').map((p) => {
        const cx = x(p.km);
        const live = p.km < 25 ? mLive : tLive;
        const east = p.id === 'SP-E';
        return (
          <g key={`at-${p.id}`}>
            <AutoTransformer cx={cx + (east ? -12 : 12)} yTop={Y.upAF} yBot={Y.upTF} live={live} />
            <AutoTransformer cx={cx + (east ? -12 : 12)} yTop={Y.dnTF} yBot={Y.dnAF} live={live} />
            <path d={`M${cx} ${Y.upTF} V${Y.dnTF}`} stroke={live ? LIVE : DEAD} strokeWidth="1.3" />
            <circle cx={cx} cy={(Y.upTF + Y.dnTF) / 2} r="4.2" fill={live ? LIVE : '#fff'} stroke={live ? LIVE : DEAD} strokeWidth="1.2" />
            <Dot cx={cx} cy={Y.upTF} live={live} />
            <Dot cx={cx} cy={Y.dnTF} live={live} />
            <text x={east ? cx - 8 : cx + 8} y={(Y.upTF + Y.dnTF) / 2 + 3} className="tag" textAnchor={east ? 'end' : 'start'}>89T</text>
            {p.kind === 'SSP' && (
              <>
                <HDisc cx={cx + 30} y={Y.upTF} live={live} />
                <HDisc cx={cx + 30} y={Y.dnTF} live={live} />
              </>
            )}
          </g>
        );
      })}

      {POSTS.filter((p) => p.kind !== 'SS').map((p) => {
        const live = p.km < 25 ? mLive : tLive;
        return (
          <PostBox
            key={p.id}
            post={p}
            voltage={live ? `${BASE_KV[p.id].toFixed(1)} kV` : '0.0 kV'}
            live={live}
            selected={selectedPostId === p.id}
            onSelect={onSelectPost}
          />
        );
      })}

      {/* ---------------- 선로·역 ---------------- */}
      <path d={`M${x(0) - 34} ${Y.upMain} H${x(50) + 34}`} stroke="#7d868f" strokeWidth="2" />
      <path d={`M${x(0) - 34} ${Y.dnMain} H${x(50) + 34}`} stroke="#7d868f" strokeWidth="2" />
      {STATIONS.map((s) => (
        <Station key={s.name} s={s} />
      ))}
      {trains.map((t) => (
        <Train key={t.id} {...t} stopped={Boolean(t.stopsOnFault && trainsStopped)} />
      ))}

      {/* km 눈금 */}
      <path d={`M${x(0)} ${Y.scale} H${x(50)}`} stroke="#9aa3ab" strokeWidth="1" />
      {Array.from({ length: 51 }, (_, km) => (
        <path key={`t-${km}`} d={`M${x(km)} ${Y.scale} V${Y.scale + (km % 5 === 0 ? 6 : 3)}`} stroke="#9aa3ab" strokeWidth="1" />
      ))}
      {Array.from({ length: 11 }, (_, i) => i * 5).map((km) => (
        <text key={`l-${km}`} x={x(km)} y={Y.scale + 17} textAnchor="middle" className="km">{km}k</text>
      ))}

      {/* ---------------- 고장점표정 결과 (원래 정보) ---------------- */}
      {showFault && (
        <g>
          <path d={`M${x(fl.kmp) - 6} ${Y.upAF - 13} h12 l-6 9 Z`} fill={RED} />
          <path d={`M${x(fl.kmp)} ${Y.upAF - 4} V${Y.upTF + 4}`} stroke={RED} strokeWidth="1.5" />
          <circle cx={x(fl.kmp)} cy={Y.upTF} r="3" fill={RED} />
        </g>
      )}

      {/* ---------------- AI 표시 (참고) ---------------- */}
      {band && (
        <g>
          <rect x={band.x1} y={Y.upAF - 6} width={band.x2 - band.x1} height={Y.upTF - Y.upAF + 12} fill={AI} fillOpacity="0.1" stroke={AI} strokeDasharray="4 3" />
          <rect x={band.x1} y={Y.upMain - 9} width={band.x2 - band.x1} height={18} fill={AI} fillOpacity="0.1" stroke={AI} strokeDasharray="4 3" />
          <path d={`M${band.x1} ${Y.upAF - 6} L${band.x1 - 16} 112`} stroke={AI} strokeWidth="1" />
          <text x={band.x1 - 20} y={92} textAnchor="end" className="val" style={{ fill: RED, fontWeight: 600 }}>
            표정 {fmtK(fl.kmp)} (SS로부터 {fl.fromSs.toFixed(2)} km)
          </text>
          <text x={band.x1 - 20} y={106} textAnchor="end" className="ai-label">AI 참고 · 순회 우선 구간</text>
          <text x={band.x1 - 20} y={118} textAnchor="end" className="ai-sub">
            {fmtK(fl.band.kmp[0])}–{fmtK(fl.band.kmp[1])} · 교량 구간 포함
          </text>
        </g>
      )}
      {aiTarget === 'TS1' && (
        <g>
          <rect x={SS_X - 62} y={56} width={48} height={36} fill="none" stroke={AI} strokeWidth="1.6" strokeDasharray="4 3" />
          <path d={`M${SS_X - 62} 70 H${SS_X - 150}`} stroke={AI} strokeWidth="1" />
          <text x={SS_X - 154} y={67} textAnchor="end" className="ai-label">AI 점검 후보</text>
          <text x={SS_X - 154} y={79} textAnchor="end" className="ai-sub">M좌 권선 오늘 +6.8 °C</text>
        </g>
      )}
      {aiTarget === '52F3' && (
        <g>
          <rect x={SS_X + 12} y={128} width={48} height={24} fill="none" stroke={AI} strokeWidth="1.6" strokeDasharray="4 3" />
          <path d={`M${SS_X + 60} 130 L${SS_X + 150} 84`} stroke={AI} strokeWidth="1" />
          <text x={SS_X + 154} y={78} className="ai-label">AI 점검 후보</text>
          <text x={SS_X + 154} y={90} className="ai-sub">개방 37.8 → 45.2 ms</text>
        </g>
      )}
    </svg>
  );
}

export function MimicLegend() {
  return (
    <div className="legend" aria-label="범례">
      <span className="legend-item">
        <svg width="12" height="12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill={LIVE} /></svg>차단기 투입
      </span>
      <span className="legend-item">
        <svg width="12" height="12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#fff" stroke={LIVE} strokeWidth="1.4" /></svg>개방
      </span>
      <span className="legend-item">
        <svg width="16" height="16" aria-hidden="true"><rect x="1" y="1" width="14" height="14" fill="none" stroke={RED} strokeWidth="1.4" /><rect x="4" y="4" width="8" height="8" fill="#fff" stroke={RED} strokeWidth="1.8" /></svg>보호 동작 트립
      </span>
      <span className="legend-item">
        <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill={LIVE} /></svg>단로기 닫힘
      </span>
      <span className="legend-item">
        <svg width="26" height="8" aria-hidden="true"><path d="M1 4H25" stroke={LIVE} strokeWidth="3" /></svg>가압
      </span>
      <span className="legend-item">
        <svg width="26" height="8" aria-hidden="true"><path d="M1 4H25" stroke={DEAD} strokeWidth="2.5" strokeDasharray="6 4" /></svg>무가압
      </span>
      <span className="legend-item">
        <svg width="12" height="12" aria-hidden="true"><path d="M1 2h10l-5 8Z" fill={RED} /></svg>고장점표정 위치
      </span>
      <span className="legend-item">
        <svg width="22" height="12" aria-hidden="true"><rect x="1" y="1" width="20" height="10" fill={AI} fillOpacity="0.1" stroke={AI} strokeDasharray="3 2" /></svg>
        <span style={{ color: AI, fontWeight: 600 }}>AI가 덧붙인 참고 정보</span>
      </span>
      <span className="legend-item">
        <svg width="30" height="12" aria-hidden="true"><rect x="5" y="1" width="24" height="10" fill="#59636d" /><path d="M1 6L5 1V11Z" fill="#59636d" /></svg>열차 (흰 칸: 정전 구간 정차)
      </span>
      <span className="legend-note">기호는 ISA-101 방식(색은 이상 상태에만)으로 그렸습니다. 실제 화면의 색 관례와 다를 수 있습니다.</span>
    </div>
  );
}
