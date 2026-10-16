// 가상 노선. 실제 노선·변전소·역 이름을 쓰지 않는다.
// 배치 근거: AT 급전 방식에서 SS–SSP–SP를 약 8~10 km 간격으로 두고, 한 상이 약 25 km를 맡는다.
// 변전소를 가운데 두고 M상은 서쪽(F1 상선, F2 하선), T상은 동쪽(F3 상선, F4 하선)을 급전한다.

export const LINE = {
  name: '한누리선',
  note: '가상 노선 · 교류 25 kV AT 급전 · 복선',
  lengthKm: 50,
  ssKm: 25,
};

export const POSTS = [
  { id: 'SP-W', kind: 'SP', name: '서들', km: 0, kindLabel: '급전구분소' },
  { id: 'SSP-1', kind: 'SSP', name: '미루', km: 8.1, kindLabel: '보조급전구분소' },
  { id: 'SSP-2', kind: 'SSP', name: '고운', km: 16.3, kindLabel: '보조급전구분소' },
  { id: 'SS', kind: 'SS', name: '한누리', km: 25, kindLabel: '변전소' },
  { id: 'SSP-3', kind: 'SSP', name: '솔빛', km: 33.4, kindLabel: '보조급전구분소' },
  { id: 'SSP-4', kind: 'SSP', name: '다온', km: 41.8, kindLabel: '보조급전구분소' },
  { id: 'SP-E', kind: 'SP', name: '너울', km: 50, kindLabel: '급전구분소' },
];

export const STATIONS = [
  { name: '서들', km: 1.4 },
  { name: '미루', km: 7.2 },
  { name: '버들', km: 12.1 },
  { name: '고운', km: 17.4 },
  { name: '한누리', km: 23.6 },
  { name: '솔빛', km: 31.9 },
  { name: '은솔', km: 37.2 },
  { name: '다온', km: 42.9 },
  { name: '너울', km: 48.6 },
];

// 급전 구간: 어느 차단기가 어느 선로 구간을 맡는지
export const FEEDERS = [
  { id: 'F1', phase: 'M', track: 'up', from: 0, to: 25, label: '52F1 · M상 상선' },
  { id: 'F2', phase: 'M', track: 'down', from: 0, to: 25, label: '52F2 · M상 하선' },
  { id: 'F3', phase: 'T', track: 'up', from: 25, to: 50, label: '52F3 · T상 상선' },
  { id: 'F4', phase: 'T', track: 'down', from: 25, to: 50, label: '52F4 · T상 하선' },
];

export const ADJACENT = { west: '인접 변전소 방면', east: '인접 변전소 방면' };
