const VIEWS = [
  { id: 'console', label: '계통 감시' },
  { id: 'evaluation', label: '평가 지표' },
  { id: 'data', label: '데이터 연계' },
];

export default function TopBar({ view, onViewChange, clock }) {
  return (
    <header className="topbar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 26 26" aria-hidden="true">
          <rect x="0.5" y="0.5" width="25" height="25" rx="3" fill="#f4f5f6" stroke="#9aa3ab" />
          <path d="M3 9h20M3 18h20" stroke="#3a4550" strokeWidth="2" />
          <rect x="9" y="5" width="8" height="8" fill="#c62828" />
          <path d="M13 13v5" stroke="#3a4550" strokeWidth="2" />
        </svg>
        <div>
          <div className="brand-name">전철전력 관제 · AI 보조</div>
          <div className="brand-sub">휴몬랩이 그려 본 콘셉트 화면</div>
        </div>
      </div>
      <nav className="view-tabs" aria-label="화면">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className="view-tab"
            aria-current={view === v.id ? 'page' : undefined}
            onClick={() => onViewChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>
      <div className="topbar-right">
        <span className="virtual-flag">가상 노선·가상 데이터 · 제어 기능 없음</span>
        <span className="clock" aria-label="현재 시각">{clock}</span>
      </div>
    </header>
  );
}
