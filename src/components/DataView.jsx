import { SOURCES } from '../data/sources';

const FLOW = [
  {
    title: '현장 장치',
    text: '전철제어반, 고장점표정반, 예방진단장치는 지금 하던 일을 그대로 합니다. 보호 동작과 표정 계산에 AI가 끼어들지 않습니다.',
  },
  {
    title: 'SCADA',
    text: '현장 데이터를 모으고 기록하는 역할도 그대로입니다. 관제사가 보는 원래 알람 목록은 바뀌지 않습니다.',
  },
  {
    title: '분석 계층 (AI)',
    text: '각 장치의 기록을 읽기만 합니다. 같은 사건의 알람을 묶고, 과거 기록과 비교해 근거를 붙입니다. 사내에 설치해 밖으로 나가는 데이터가 없습니다.',
    ai: true,
  },
  {
    title: '관제사 판단',
    text: 'AI가 붙인 묶음과 근거를 참고할지는 관제사가 정합니다. 채택·보류 기록은 다음 평가에서 확인 사례로 씁니다.',
  },
];

export default function DataView() {
  return (
    <div className="page">
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">데이터가 흐르는 길</h2>
          <span className="panel-note">장치는 그대로 두고, 데이터 분석 계층에 AI를 얹는 그림</span>
        </div>
        <div className="flow">
          {FLOW.map((f) => (
            <div key={f.title} className={`flow-step${f.ai ? ' is-ai' : ''}`}>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">이 화면이 쓰는 데이터</h2>
          <span className="panel-note">모두 가상 데이터입니다. 실제 장치와 연결된 것은 없습니다.</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="source-table">
            <thead>
              <tr>
                <th scope="col">원천</th>
                <th scope="col">이 화면에서 쓰는 기록</th>
                <th scope="col">AI가 하는 일</th>
                <th scope="col">먼저 확인할 것</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.records}</td>
                  <td>{s.ai}</td>
                  <td>{s.check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">AI가 하지 않는 일</h2>
        </div>
        <ul className="limits" style={{ padding: '10px 14px 12px 30px' }}>
          <li>차단기·개폐기를 조작하지 않습니다. 화면의 버튼은 관제사의 채택·보류 기록만 남깁니다.</li>
          <li>보호계전기 정정값과 고장점표정 계산을 바꾸지 않습니다. 표정값은 늘 그대로 표시합니다.</li>
          <li>원래 알람을 숨기거나 지우지 않습니다. 묶음은 보기 방식일 뿐이고, 묶지 못한 알람은 따로 보여 줍니다.</li>
          <li>운용 데이터를 밖으로 보내지 않습니다. 언어 모델도 사내 설치형을 전제로 합니다.</li>
        </ul>
      </section>
    </div>
  );
}
