import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AlarmPanel from './components/AlarmPanel';
import DataView from './components/DataView';
import EvaluationView from './components/EvaluationView';
import Mimic, { MimicLegend } from './components/Mimic';
import SsDetail from './components/SsDetail';
import TopBar from './components/TopBar';
import Workspace from './components/Workspace';
import { LINE, POSTS } from './data/line';
import { DEFAULT_SCENE_ID, SCENES, deriveMimicState, fmtK, getScene } from './data/scenes';
import './styles/app.css';

const IS_TEST = import.meta.env.MODE === 'test';
const REPLAY_STEP_MS = 170;
const AI_DELAY_MS = 1100;

const TRAINS = {
  fault: [
    { id: 'K1123', km: 10.2, track: 'up', stopsOnFault: true },
    { id: 'K1130', km: 19.6, track: 'down', stopsOnFault: true },
    { id: 'K1127', km: 35.4, track: 'up' },
    { id: 'K1134', km: 45.6, track: 'down' },
  ],
  default: [
    { id: 'K1203', km: 9.4, track: 'up' },
    { id: 'K1206', km: 19.8, track: 'down' },
    { id: 'K1209', km: 34.6, track: 'up' },
    { id: 'K1212', km: 46.2, track: 'down' },
  ],
};

function toSeconds(hms) {
  const [h, m, s] = hms.split(':').map(Number);
  return h * 3600 + m * 60 + Math.floor(s);
}

function fromSeconds(total) {
  const t = ((total % 86400) + 86400) % 86400;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
}

function useTicker(active) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (IS_TEST || !active) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return elapsed;
}

// 장면 하나. 장면이 바뀌거나 다시 재생하면 key가 바뀌어 처음부터 다시 그린다.
function ConsoleScene({ scene, onClock, onReplay }) {
  const startReplay = scene.replay && !IS_TEST;
  const [shown, setShown] = useState(startReplay ? 0 : scene.alarms.length);
  const [aiReady, setAiReady] = useState(!startReplay);
  const [mode, setMode] = useState('grouped');
  const [layer, setLayer] = useState(scene.defaultLayer);
  const [postFilter, setPostFilter] = useState(null);
  const [decision, setDecision] = useState(null);
  const timers = useRef({});
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!startReplay) return undefined;
    let count = 0;
    const t = timers.current;
    t.interval = setInterval(() => {
      count += 1;
      setShown(count);
      if (count >= scene.alarms.length) {
        clearInterval(t.interval);
        t.ai = setTimeout(() => setAiReady(true), AI_DELAY_MS);
      }
    }, REPLAY_STEP_MS);
    return () => {
      clearInterval(t.interval);
      clearTimeout(t.ai);
    };
  }, [scene, startReplay]);

  const replaying = shown < scene.alarms.length;
  const elapsed = useTicker(!replaying);
  const shownAlarms = useMemo(() => scene.alarms.slice(0, shown), [scene, shown]);
  const mimicState = useMemo(() => deriveMimicState(scene, shown), [scene, shown]);
  const incident = scene.incidents[0];
  const uncertain = shownAlarms.filter((a) => a.uncertain);

  // 시뮬레이션 시각: 재생 중에는 마지막으로 받은 알람 시각, 끝나면 그 뒤로 1초씩
  let clock;
  if (replaying) {
    const last = shownAlarms[shownAlarms.length - 1];
    clock = last ? last.t.slice(0, 8) : fromSeconds(toSeconds(scene.alarms[0].t.slice(0, 8)) - 2);
  } else {
    clock = fromSeconds(toSeconds(scene.clock) + elapsed);
  }
  useEffect(() => {
    onClock(clock);
  }, [clock, onClock]);

  // 좁은 화면에서는 계통도를 사건이 보이는 쪽으로 미리 옮겨 둔다.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const ratio = layer === 'ss' ? 0.5 : scene.id === 'fault' ? 0.34 : 0.5;
    el.scrollLeft = el.scrollWidth * ratio - el.clientWidth / 2;
  }, [layer, scene.id]);

  const skipReplay = () => {
    clearInterval(timers.current.interval);
    clearTimeout(timers.current.ai);
    setShown(scene.alarms.length);
    setAiReady(true);
  };

  const decide = (d) => setDecision(d ? { ...d, at: clock } : null);

  const mDead = ['52F1', '52F2'].every((b) => (mimicState.breakers[b] ?? 'closed') !== 'closed');
  const unack1 = shownAlarms.filter((a) => a.prio === 1 && (a.state ?? 'UNACK') === 'UNACK').length;
  const unack2 = shownAlarms.filter((a) => a.prio === 2 && (a.state ?? 'UNACK') === 'UNACK').length;

  let aiStrip = null;
  if (aiReady) {
    aiStrip = incident.fl
      ? `사건 1건 · ${incident.title} · 표정 ${fmtK(incident.fl.kmp)} · 순회 우선 구간 ${fmtK(incident.fl.band.kmp[0])}–${fmtK(incident.fl.band.kmp[1])}`
      : `점검 후보 1건 · ${incident.title}`;
  }

  return (
    <>
      <div className="statusbar">
        <span className="line-id">{LINE.name}</span>
        <span className="line-meta">{LINE.note} · {fmtK(0)}–{fmtK(50)}</span>
        <span className={`stat${unack1 ? ' is-alarm' : ''}`}>미확인 1순위 <b>{unack1}</b></span>
        <span className="stat">2순위 <b>{unack2}</b></span>
        <span className={`stat${mDead ? ' is-alarm' : ''}`}>정전 구간 <b>{mDead ? `${fmtK(0)}–${fmtK(25)}` : '없음'}</b></span>
        <span className="stat">RTU <b>7/7</b> 정상</span>
        <div className="scene-picker" role="group" aria-label="장면 선택">
          <span className="scene-picker-label">장면</span>
          {SCENES.map((s, i) => (
            <button key={s.id} type="button" className="scene-btn" aria-pressed={s.id === scene.id} onClick={() => onReplay(s.id)}>
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
      </div>

      {aiStrip && (
        <div className="ai-strip">
          <span className="ai-dot" />
          <span className="ai-strip-text">AI · {aiStrip}</span>
          <button
            type="button"
            className="btn btn-small btn-ai"
            onClick={() => document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            근거 보기
          </button>
        </div>
      )}

      <main className="page">
        <section className="panel" aria-label="계통도">
          <div className="panel-head">
            <div className="seg" role="group" aria-label="계통도 범위">
              <button type="button" aria-pressed={layer === 'line'} onClick={() => setLayer('line')}>노선 개요</button>
              <button type="button" aria-pressed={layer === 'ss'} onClick={() => setLayer('ss')}>한누리 SS 단선도</button>
            </div>
            <span className="panel-note">
              {layer === 'line' ? '개소 이름표를 누르면 그 개소 알람만 볼 수 있습니다' : '수전부터 급전반까지 · 89 단로기, 52 차단기, 계측값'}
            </span>
            <span className="spacer" />
            {scene.replay && (
              <div className="replay">
                {replaying ? (
                  <>
                    <span className="replay-progress" aria-hidden="true">
                      <span style={{ width: `${(shown / scene.alarms.length) * 100}%` }} />
                    </span>
                    <span className="replay-label">고장 재생 중</span>
                    <button type="button" className="btn btn-small" onClick={skipReplay}>건너뛰기</button>
                  </>
                ) : (
                  <button type="button" className="btn btn-small" onClick={() => onReplay(scene.id)}>
                    고장 순간부터 다시 보기
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="mimic-hint">계통도는 옆으로 밀어서 볼 수 있습니다.</p>
          <div className="mimic-wrap" ref={wrapRef}>
            {layer === 'line' ? (
              <Mimic
                mimicState={mimicState}
                scene={scene}
                trains={TRAINS[scene.id] ?? TRAINS.default}
                selectedPostId={POSTS.find((p) => p.name === postFilter)?.id}
                onSelectPost={(post) => setPostFilter((cur) => (cur === post.name ? null : post.name))}
                onOpenSs={() => setLayer('ss')}
              />
            ) : (
              <SsDetail mimicState={mimicState} scene={scene} />
            )}
          </div>
          <MimicLegend />
        </section>

        <div className="console-grid">
          <AlarmPanel
            scene={scene}
            shownAlarms={shownAlarms}
            replaying={replaying}
            aiReady={aiReady}
            mode={mode}
            onModeChange={setMode}
            postFilter={postFilter}
            onClearPost={() => setPostFilter(null)}
          />
          <Workspace incident={incident} uncertain={uncertain} aiReady={aiReady} decision={decision} onDecide={decide} />
        </div>

        <p className="footer-note">
          휴몬랩이 AI가 들어간 전철전력 관제를 상상해 그려 본 콘셉트 화면입니다. 노선·설비·수치는 모두 가상이며 실제 시스템과 연결되어 있지 않습니다.
        </p>
      </main>
    </>
  );
}

export default function App() {
  const [view, setView] = useState('console');
  const [sceneId, setSceneId] = useState(DEFAULT_SCENE_ID);
  const [run, setRun] = useState(0);
  const [clock, setClock] = useState(getScene(DEFAULT_SCENE_ID).clock);
  const scene = getScene(sceneId);

  const replay = (id) => {
    setSceneId(id);
    setRun((r) => r + 1);
  };

  return (
    <div className="app">
      <TopBar view={view} onViewChange={setView} clock={clock} />
      {view === 'console' && <ConsoleScene key={`${sceneId}-${run}`} scene={scene} onClock={setClock} onReplay={replay} />}
      {view === 'evaluation' && <EvaluationView />}
      {view === 'data' && <DataView />}
    </div>
  );
}
