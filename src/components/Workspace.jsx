import { useEffect, useRef, useState } from 'react';
import { fmtK } from '../data/scenes';
import { BreakerChart, FlHistoryChart, TemperatureChart, WaveformChart } from './Charts';

function Fact({ f }) {
  return (
    <div className="fact">
      <div className="fact-k">{f.k}</div>
      <div className="fact-v">
        {f.v}
        {f.unit && <small>{f.unit}</small>}
      </div>
      {f.sub && <div className="src">{f.sub}</div>}
    </div>
  );
}

function FaultLocation({ fl }) {
  const tests = fl.history.filter((h) => h.kind !== '사고').length;
  const gapM = Math.round(Math.abs(fl.fromSs - fl.first) * 1000);
  return (
    <div className="ws-section">
      <h3>고장 위치</h3>
      <div className="facts">
        <div className="fact is-wide">
          <div className="fact-k">고장점표정반 결과 (그대로 표시)</div>
          <div className="fact-v">
            SS로부터 {fl.fromSs.toFixed(2)}<small>km</small>
            <small style={{ marginLeft: 10 }}>= {fmtK(fl.kmp)}</small>
          </div>
          <div className="src">{fl.result}</div>
        </div>
        <div className="fact is-wide is-ai">
          <div className="fact-k">AI 대조 · 1차와 재트립 표정값</div>
          <div className="fact-v">
            {fl.first.toFixed(2)} / {fl.fromSs.toFixed(2)}<small>km · 차이 {gapM} m</small>
          </div>
          <div className="src">두 번의 고장이 같은 지점에서 난 것으로 보입니다.</div>
        </div>
        <div className="fact is-wide is-ai">
          <div className="fact-k">AI 참고 · 순회 우선 구간</div>
          <div className="fact-v">
            {fmtK(fl.band.kmp[0])}–{fmtK(fl.band.kmp[1])}
          </div>
          <div className="src">
            {fl.nearby.map((n) => `${n.what} ${n.where} (${n.note})`).join(' · ')}
          </div>
        </div>
      </div>
      <div className="ev" style={{ marginTop: 8 }}>
        <div className="ev-head">
          <span className="ev-title">이 AT 구간에서 위치가 확인된 과거 사건</span>
          <span className="src">사고 {fl.history.length - tests} · 강제지락시험 {tests}</span>
        </div>
        <FlHistoryChart history={fl.history} band={fl.band} fromSs={fl.fromSs} />
        <p className="ev-text">
          과거 {fl.history.length}건 모두 표정값에서 200 m 안쪽에서 확인됐습니다. AI는 표정값을 고치지 않고, 그중 사건이 많았던 쪽과 교량 구간을
          순회 때 먼저 보도록 순서만 제안합니다. 검은 점은 실제 사고, 흰 점은 강제지락시험입니다.
        </p>
      </div>
    </div>
  );
}

const DECISION_TEXT = {
  adopt: '관제사가 참고로 채택했습니다. AI는 어떤 장치도 조작하지 않았습니다.',
  hold: '관제사가 보류했습니다.',
};

const HOLD_REASONS = ['현장 확인이 먼저', '근거가 부족함', '이미 조치함'];

export default function Workspace({ incident, uncertain, aiReady, decision, onDecide }) {
  const [holding, setHolding] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    setHolding(false);
  }, [incident.id]);

  useEffect(() => {
    if (decision && logRef.current) logRef.current.focus();
  }, [decision]);

  if (!aiReady) {
    return (
      <section className="panel workspace" aria-label="AI 작업공간" id="workspace">
        <div className="ai-band"><span className="ai-dot" />AI 작업공간</div>
        <div className="ws-body">
          <p className="ws-summary" style={{ color: 'var(--ink-3)' }}>
            알람이 들어오는 중입니다. 수신이 잦아들면 AI가 같은 사건의 알람을 묶고 근거를 정리해 이 칸에 보여 줍니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel workspace" aria-label="AI 작업공간" id="workspace">
      <div className="ai-band">
        <span className="ai-dot" />
        <span>{incident.aiNote}</span>
      </div>
      <div className="ws-body">
        <div>
          <h2 className="ws-title">{incident.title}</h2>
          <div className="ws-where">{incident.where}</div>
        </div>

        <div className="ws-section">
          <h3>AI 정리</h3>
          {incident.summary.map((s) => (
            <p key={s} className="ws-summary">{s}</p>
          ))}
        </div>

        {uncertain.length > 0 && (
          <div className="uncertain">
            <b>확신이 낮은 묶음 {uncertain.length}건</b>
            {uncertain.map((a) => (
              <p key={a.t}>
                <span className="mono">{a.t}</span> {a.post} · {a.text} — {a.uncertain}
              </p>
            ))}
          </div>
        )}

        <div className="facts">
          {incident.facts.map((f) => (
            <Fact key={f.k} f={f} />
          ))}
        </div>

        {incident.fl && <FaultLocation fl={incident.fl} />}

        {incident.waveform && (
          <div className="ev">
            <div className="ev-head">
              <span className="ev-title">F1 전류 (고장기록장치)</span>
              <span className="src">FR-SS · 실효값</span>
            </div>
            <WaveformChart />
          </div>
        )}

        {incident.trend && (
          <div className="ev">
            <div className="ev-head">
              <span className="ev-title">TS1 M좌 권선 온도 · 같은 부하·외기 조건의 과거 값과 비교</span>
            </div>
            <TemperatureChart trend={incident.trend} />
            <p className="ev-text">회색 띠는 과거 같은 조건에서 나온 값의 범위입니다. 열흘쯤 전부터 실제 값이 띠 위로 올라왔습니다. 점마다 부하율과 외기 온도를 볼 수 있습니다.</p>
          </div>
        )}

        {incident.ops && (
          <div className="ev">
            <div className="ev-head">
              <span className="ev-title">52F3 개방 시간 · 최근 40회 동작</span>
              <span className="src">전철제어반 동작 기록</span>
            </div>
            <BreakerChart ops={incident.ops} />
            <p className="ev-text">점선은 같은 형식 차단기(이 변전소 4대, 인접 변전소 5대)의 평균입니다. 52F3만 열세 번째 동작 무렵부터 조금씩 늘었습니다.</p>
          </div>
        )}

        <div className="ws-section">
          <h3>{incident.stepsTitle}</h3>
          <ol className="steps">
            {incident.steps.map((s, i) => (
              <li key={s.text} className="step">
                <span className="step-n">{i + 1}</span>
                <span>
                  {s.text}
                  <span className="step-ref">{s.ref}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="src" style={{ marginTop: 6, fontFamily: 'var(--font)' }}>
            절차 문구는 화면 예시로 적은 것입니다. 실제 절차서와 다릅니다.
          </p>
        </div>

        <div className="ws-section">
          {!decision && !holding && (
            <div className="decision">
              <button type="button" className="btn btn-primary" onClick={() => onDecide({ kind: 'adopt' })}>
                참고로 채택
              </button>
              <button type="button" className="btn" onClick={() => setHolding(true)}>
                보류
              </button>
            </div>
          )}
          {!decision && holding && (
            <div className="decision" role="group" aria-label="보류 사유">
              <span className="src" style={{ fontFamily: 'var(--font)' }}>보류 사유</span>
              {HOLD_REASONS.map((r) => (
                <button key={r} type="button" className="btn" onClick={() => onDecide({ kind: 'hold', reason: r })}>
                  {r}
                </button>
              ))}
              <button type="button" className="btn btn-link" onClick={() => setHolding(false)}>
                취소
              </button>
            </div>
          )}
          {decision && (
            <>
              <p className="decision-log" role="status" tabIndex={-1} ref={logRef}>
                <span className="mono">{decision.at}</span> · {DECISION_TEXT[decision.kind]}
                {decision.reason ? ` 사유: ${decision.reason}.` : ''}
              </p>
              <button
                type="button"
                className="btn btn-link"
                onClick={() => {
                  setHolding(false);
                  onDecide(null);
                }}
              >
                기록 지우기
              </button>
            </>
          )}
          <p className="src" style={{ marginTop: 6, fontFamily: 'var(--font)' }}>
            이 버튼은 판단 기록만 남깁니다. 차단기·개폐기 조작 기능은 없습니다.
          </p>
        </div>
      </div>
    </section>
  );
}
