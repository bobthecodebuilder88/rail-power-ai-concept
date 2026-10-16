import { EVALUATION } from '../data/evaluation';

export default function EvaluationView() {
  return (
    <div className="page">
      <section className="panel" style={{ padding: '12px 14px' }}>
        <h2 className="panel-title" style={{ fontSize: 15, whiteSpace: 'normal' }}>AI가 실제로 도움이 되는지는 이렇게 확인해 보시면 어떨까요</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-2)', fontSize: 12.5, lineHeight: 1.65, maxWidth: 760 }}>
          정확도 하나보다 잘못 올린 후보, 놓친 사건, 사람이 일을 덜었는지를 함께 봅니다. 아래 숫자는 지표의 생김새를 보여 드리려고
          넣은 가상 예시입니다. 실제 값은 과거 기록으로 검증하고 현장 병행 운영을 거쳐야 나옵니다.
        </p>
      </section>
      <div className="doc-grid">
        {EVALUATION.map((group) => (
          <section key={group.title} className="panel doc-card">
            <h2>{group.title}</h2>
            <p>{group.lead}</p>
            <div style={{ marginTop: 8 }}>
              {group.metrics.map((m) => (
                <div key={m.label} className="metric-row">
                  <span>
                    {m.label}
                    <span className="sample-tag">예시</span>
                  </span>
                  <span className="metric-v">{m.value}</span>
                  <span className="why">{m.why}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="footer-note">
        평가할 사건은 학습에 쓴 사건과 나눕니다. 효과가 확인되지 않은 조건에서는 AI 참고 정보를 띄우지 않고 원래 화면만 보여 줍니다.
      </p>
    </div>
  );
}
