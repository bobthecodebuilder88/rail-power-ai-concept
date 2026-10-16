import { sortNewestFirst } from '../data/scenes';

function PrioMark({ prio }) {
  if (prio === 'ai') return <span className="prio prio-ai">AI</span>;
  return <span className={`prio prio-${prio}`} aria-label={`우선순위 ${prio}`}>{prio}</span>;
}

function stateLabel(a) {
  const s = a.state ?? 'UNACK';
  if (s === 'UNACK') return <span className="ack unack">미확인</span>;
  if (s === 'RTN') return <span className="ack">복귀</span>;
  return <span className="ack">확인</span>;
}

function AlarmTable({ alarms, showGroup, newestKey }) {
  const rows = sortNewestFirst(alarms);
  return (
    <div className="alarm-table-wrap">
      <table className="alarm-table">
        <thead>
          <tr>
            <th scope="col">발생 시각 (최신순)</th>
            <th scope="col">순위</th>
            <th scope="col">개소</th>
            <th scope="col">설비</th>
            <th scope="col">내용</th>
            <th scope="col" className="col-src">값</th>
            <th scope="col">상태</th>
            {showGroup && <th scope="col">AI 묶음</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const key = `${a.t}-${a.tag}-${a.text}`;
            return (
              <tr key={key} className={`${key === newestKey ? 'is-new' : ''}${showGroup && a.group ? ' in-group' : ''}`}>
                <td className="t">{a.t}</td>
                <td><PrioMark prio={a.prio} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>{a.post}</td>
                <td className="tag-cell">{a.tag}</td>
                <td>{a.text}</td>
                <td className="col-src mono" style={{ whiteSpace: 'nowrap', color: 'var(--live-val)' }}>{a.value}</td>
                <td>{stateLabel(a)}</td>
                {showGroup && (
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {a.group ? (
                      <span className={`group-chip${a.uncertain ? ' is-uncertain' : ''}`}>{a.uncertain ? '사건 1 · 확신 낮음' : '사건 1'}</span>
                    ) : (
                      <span className="group-chip is-separate">따로</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AlarmPanel({ scene, shownAlarms, replaying, aiReady, mode, onModeChange, postFilter, onClearPost }) {
  const filtered = postFilter ? shownAlarms.filter((a) => a.post.startsWith(postFilter)) : shownAlarms;
  const separate = shownAlarms.filter((a) => !a.group);
  const showRaw = mode === 'raw' || !aiReady || Boolean(postFilter);
  const newest = shownAlarms[shownAlarms.length - 1];
  const newestKey = replaying && newest ? `${newest.t}-${newest.tag}-${newest.text}` : null;

  let note = `원래 알람 ${shownAlarms.length}건`;
  if (replaying) note = `알람 수신 중 · ${shownAlarms.length}건`;
  if (postFilter) note = `${postFilter} 알람 ${filtered.length}건 / 전체 ${shownAlarms.length}건`;

  return (
    <section className="panel" aria-label="알람과 사건">
      <div className="panel-head">
        <h2 className="panel-title">{showRaw ? '알람 목록' : 'AI 사건 목록'}</h2>
        <span className="panel-note">{note}</span>
        <span className="spacer" />
        {postFilter && (
          <button type="button" className="btn btn-small" onClick={onClearPost}>
            {postFilter} 필터 해제
          </button>
        )}
        <div className="seg" role="group" aria-label="보기 방식">
          <button
            type="button"
            aria-pressed={!showRaw}
            disabled={!aiReady || Boolean(postFilter)}
            title={postFilter ? '개소 필터를 해제하면 사건 묶음으로 볼 수 있습니다' : undefined}
            onClick={() => onModeChange('grouped')}
          >
            사건 묶음
          </button>
          <button type="button" aria-pressed={showRaw} onClick={() => onModeChange('raw')}>
            원래 알람
          </button>
        </div>
      </div>

      {showRaw ? (
        <>
          {!aiReady && replaying && (
            <div className="ungrouped-note">알람이 들어오는 동안에는 SCADA 원래 목록 그대로 보입니다. AI 묶음은 수신이 잦아든 뒤 나타납니다.</div>
          )}
          {!aiReady && !replaying && shownAlarms.length > 0 && (
            <div className="ungrouped-note ai-working">AI가 같은 사건의 알람을 묶는 중입니다…</div>
          )}
          <AlarmTable alarms={filtered} showGroup={aiReady} newestKey={newestKey} />
        </>
      ) : (
        <>
          {scene.incidents.map((inc, i) => {
            const grouped = shownAlarms.filter((a) => a.group === inc.id);
            const pClass = inc.prio === 'ai' ? 'pai' : `p${inc.prio}`;
            const key = scene.replay
              ? grouped
                  .filter((a) => a.prio === 1 || a.tag.startsWith('FL') || a.tag === 'TID' || a.uncertain)
                  .filter((a) => !/재?동작$/.test(a.text) || a.first)
              : grouped;
            const ordered = [...key].sort((a, b) => (a.t < b.t ? -1 : 1));
            return (
              <div key={inc.id}>
                <div className="incident">
                  <span className={`incident-bar ${pClass}`} />
                  <span>
                    <span className="incident-title">사건 {i + 1}. {inc.title}</span>
                    <span className="incident-meta" style={{ display: 'block' }}>{inc.where}</span>
                  </span>
                  <span className="incident-count">
                    <b>{grouped.length}</b>
                    {inc.prio === 'ai' ? '관련 기록' : '묶인 알람'}
                  </span>
                </div>
                <div className="sequence">
                  <div className="sequence-head">
                    <h3 className="separate-title">사건 {i + 1} {scene.replay ? '주요 순서 (SOE · 시각순)' : '관련 기록 (시각순)'}</h3>
                    {scene.replay && (
                      <button type="button" className="btn btn-small" onClick={() => onModeChange('raw')}>
                        원래 알람 {shownAlarms.length}건 모두 보기
                      </button>
                    )}
                  </div>
                  <ol className="sequence-list">
                    {ordered.map((a) => (
                      <li key={`${a.t}-${a.tag}-${a.text}`} className={a.uncertain ? 'is-uncertain' : undefined}>
                        <span className="mono t">{a.t}</span>
                        <PrioMark prio={a.prio} />
                        <span className="mono seq-tag">{a.tag}</span>
                        <span>
                          {a.text}
                          {a.first ? ' · 첫 알람' : ''}
                          {a.uncertain ? ' · 확신 낮음' : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })}
          {separate.length > 0 && (
            <div className="separate">
              <h3 className="separate-title">묶지 않은 알람 {separate.length}건 · 따로 확인하세요</h3>
              <ul>
                {sortNewestFirst(separate).map((a) => (
                  <li key={`${a.t}-${a.tag}`}>
                    <div className="separate-row">
                      <PrioMark prio={a.prio} />
                      <span className="mono t">{a.t}</span>
                      <span>{a.post} · {a.text}{a.value ? ` (${a.value})` : ''}</span>
                    </div>
                    <p className="separate-why">{a.separate}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
