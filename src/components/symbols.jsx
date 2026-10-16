// 계통도 공통 기호. ISA-101 방식: 색은 이상 상태에만 쓰고, 상태는 채움/빈칸과 글자로 구분한다.
export const LIVE = '#2a2e33';
export const DEAD = '#8b949c';
export const AI = '#4352a8';
export const RED = '#c62828';
export const VAL = '#1d4f91';

export function Wire({ d, live = true, width = 2.5 }) {
  return (
    <path d={d} fill="none" stroke={live ? LIVE : DEAD} strokeWidth={width} strokeDasharray={live ? undefined : '6 4'} />
  );
}

// 차단기(52): 채운 사각형=투입, 빈 사각형=개방, 빨간 테두리=보호 동작 트립
export function Breaker({ cx, cy, state = 'closed', size = 11 }) {
  const half = size / 2;
  const tripped = state === 'tripped';
  return (
    <g>
      {tripped && (
        <rect
          className="trip-ring"
          x={cx - half - 3.5}
          y={cy - half - 3.5}
          width={size + 7}
          height={size + 7}
          fill="none"
          stroke={RED}
          strokeWidth="1.6"
        />
      )}
      <rect
        x={cx - half}
        y={cy - half}
        width={size}
        height={size}
        fill={state === 'closed' ? LIVE : '#fff'}
        stroke={tripped ? RED : LIVE}
        strokeWidth={tripped ? 2.2 : 1.4}
      />
    </g>
  );
}

export function TripBadge({ x, y }) {
  return (
    <g>
      <rect x={x - 13} y={y - 6} width={26} height={12} rx={1.5} fill={RED} />
      <text x={x} y={y + 3.3} textAnchor="middle" fontSize="8.8" fill="#fff" fontWeight="700">트립</text>
    </g>
  );
}

// 단로기(89): 채운 원=닫힘, 빈 원=열림
export function Disc({ cx, cy, closed = true, r = 5 }) {
  return <circle cx={cx} cy={cy} r={r} fill={closed ? LIVE : '#fff'} stroke={LIVE} strokeWidth="1.3" />;
}

export function Dot({ cx, cy, live = true }) {
  return <circle cx={cx} cy={cy} r="2.4" fill={live ? LIVE : DEAD} />;
}

export function Ground({ x, y }) {
  return (
    <g stroke={LIVE} strokeWidth="1.2">
      <path d={`M${x} ${y} v4 M${x - 6} ${y + 4} h12 M${x - 4} ${y + 7} h8 M${x - 2} ${y + 10} h4`} />
    </g>
  );
}

export function Transformer({ cx, cy, live = true }) {
  const stroke = live ? LIVE : DEAD;
  return (
    <g fill="#fff" stroke={stroke} strokeWidth="1.5" strokeDasharray={live ? undefined : '3 2'}>
      <circle cx={cx} cy={cy} r="8" />
      <circle cx={cx} cy={cy + 11} r="8" />
    </g>
  );
}

export function NeutralSection({ cx, y }) {
  return <path d={`M${cx - 4} ${y - 6} V${y + 6} M${cx + 4} ${y - 6} V${y + 6}`} stroke={LIVE} strokeWidth="1.6" />;
}

export function MeterBox({ x, y, rows, w = 74, title, dead, unitW = 22 }) {
  const h = rows.length * 13 + (title ? 18 : 6);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#fff" stroke="#9aa3ab" />
      {title && (
        <text x={x + w / 2} y={y + 11} textAnchor="middle" className="tag" style={{ fontWeight: 600, fill: '#47515b' }}>
          {title}
        </text>
      )}
      {rows.map((r, i) => (
        <g key={r.unit + i}>
          <text x={x + w - unitW - 4} y={y + (title ? 26 : 14) + i * 13} textAnchor="end" className="val" style={{ fill: dead ? RED : VAL }}>
            {r.v}
          </text>
          <text x={x + w - unitW} y={y + (title ? 26 : 14) + i * 13} className="tag">{r.unit}</text>
        </g>
      ))}
    </g>
  );
}
