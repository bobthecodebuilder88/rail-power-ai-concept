import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { SCENES, deriveMimicState, fmtK, getScene } from './data/scenes';

describe('장면 데이터', () => {
  it('고장 장면은 재폐로 실패 뒤 F1·F2가 모두 트립 상태로 끝난다', () => {
    const scene = getScene('fault');
    const state = deriveMimicState(scene, scene.alarms.length);
    expect(state.breakers['52F1']).toBe('tripped');
    expect(state.breakers['52F2']).toBe('tripped');
    expect(state.fault).toBe(true);
  });

  it('재폐로 직후에는 차단기가 잠시 투입 상태다', () => {
    const scene = getScene('fault');
    const idx = scene.alarms.findIndex((a) => a.text.includes('F2 급전 차단기 투입'));
    expect(idx).toBeGreaterThan(-1);
    const state = deriveMimicState(scene, idx + 1);
    expect(state.breakers['52F1']).toBe('closed');
    expect(state.breakers['52F2']).toBe('closed');
  });

  it('묶음 문구의 건수가 실제 알람 수와 같다', () => {
    const scene = getScene('fault');
    const inc = scene.incidents[0];
    const n = scene.alarms.filter((a) => a.group === inc.id).length;
    expect(inc.aiNote).toBe(`원래 알람 ${scene.alarms.length}건 가운데 ${n}건을 사건 1건으로 묶었습니다`);
  });

  it('재폐로 중에는 전압 복귀 알람이 없다 (영구 고장)', () => {
    const scene = getScene('fault');
    expect(scene.alarms.some((a) => a.text.includes('복귀'))).toBe(false);
  });

  it('과거 표정 확인 사건은 모두 규격 ±200 m 안쪽이다', () => {
    const { fl } = getScene('fault').incidents[0];
    fl.history.forEach((h) => expect(Math.abs(h.err)).toBeLessThanOrEqual(0.2));
  });

  it('카드 숫자와 차트 데이터가 맞는다', () => {
    const t = getScene('transformer').incidents[0];
    const last = t.trend[t.trend.length - 1];
    expect(t.facts[0].v).toBe(String(last.actual));
    expect(t.facts[0].sub).toContain(String(last.expected));
    const b = getScene('breaker').incidents[0];
    expect(b.facts[0].v).toBe(String(b.ops[b.ops.length - 1].target));
    expect(b.facts[0].sub).toContain(String(b.ops[0].target));
  });

  it('묶지 않은 알람에는 모두 이유가 붙어 있다', () => {
    SCENES.forEach((scene) => {
      scene.alarms.filter((a) => !a.group).forEach((a) => expect(a.separate).toBeTruthy());
    });
  });

  it('AI 참고 범위는 표정값을 포함하고 kmp와 SS 기준 거리가 서로 맞는다', () => {
    const { fl } = getScene('fault').incidents[0];
    expect(fmtK(11.38)).toBe('11k380');
    expect(fl.band.fromSs[0]).toBeLessThanOrEqual(fl.fromSs);
    expect(fl.band.fromSs[1]).toBeGreaterThanOrEqual(fl.fromSs);
    expect(25 - fl.fromSs).toBeCloseTo(fl.kmp, 2);
    expect(25 - fl.band.fromSs[1]).toBeCloseTo(fl.band.kmp[0], 2);
    expect(25 - fl.band.fromSs[0]).toBeCloseTo(fl.band.kmp[1], 2);
  });
});

describe('화면', () => {
  it('첫 화면은 고장 장면의 묶인 사건과 근거를 보여 준다', () => {
    render(<App />);
    expect(screen.getAllByText('F1·F2 급전 차단기 트립, 재폐로 실패').length).toBeGreaterThan(0);
    expect(screen.getByText(getScene('fault').incidents[0].aiNote)).toBeInTheDocument();
    expect(screen.getByText(/묶지 않은 알람 2건/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '한누리선 급전 계통도 (노선 개요)' })).toBeInTheDocument();
    expect(screen.getByText(/확신이 낮은 묶음 1건/)).toBeInTheDocument();
  });

  it('원래 알람으로 바꾸면 전부가 최신순으로 표에 나온다', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '원래 알람' }));
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    const n = getScene('fault').alarms.length;
    expect(rows).toHaveLength(n);
    const times = rows.map((r) => r.querySelector('td').textContent);
    expect([...times].sort().reverse()).toEqual(times);
  });

  it('변전소 단선도를 열 수 있고 장면 2·3은 단선도로 시작한다', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '한누리 변전소 단선도 열기' }));
    expect(screen.getByRole('img', { name: '한누리 변전소 단선도' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /주변압기 온도 편차/ }));
    expect(screen.getByRole('img', { name: '한누리 변전소 단선도' })).toBeInTheDocument();
  });

  it('장면을 바꾸면 작업공간이 그 장면의 사건으로 바뀐다', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /주변압기 온도 편차/ }));
    expect(screen.getAllByText(/주변압기 TS1, 비슷한 운전 조건에서/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /차단기 동작 시간 추세/ }));
    expect(screen.getAllByText(/52F3, 개방 시간이/).length).toBeGreaterThan(0);
  });

  it('판단 버튼은 기록만 남기고 다시 지울 수 있다', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '참고로 채택' }));
    expect(screen.getByRole('status')).toHaveTextContent('AI는 어떤 장치도 조작하지 않았습니다');
    fireEvent.click(screen.getByRole('button', { name: '기록 지우기' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '보류' }));
    fireEvent.click(screen.getByRole('button', { name: '근거가 부족함' }));
    expect(screen.getByRole('status')).toHaveTextContent('사유: 근거가 부족함');
  });

  it('다시 보기를 누르면 판단 기록이 지워진다', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '참고로 채택' }));
    fireEvent.click(screen.getByRole('button', { name: '고장 순간부터 다시 보기' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('개소 이름표를 누르면 그 개소 알람만 걸러진다', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '미루 보조급전구분소 알람 보기' }));
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((r) => expect(r).toHaveTextContent('미루 SSP'));
    expect(screen.getByText(`미루 알람 ${rows.length}건 / 전체 ${getScene('fault').alarms.length}건`)).toBeInTheDocument();
  });

  it('평가 지표와 데이터 연계 화면이 열린다', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '평가 지표' }));
    expect(screen.getByText('AI가 실제로 도움이 되는지는 이렇게 확인해 보시면 어떨까요')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '데이터 연계' }));
    expect(screen.getByText('AI가 하지 않는 일')).toBeInTheDocument();
  });
});
