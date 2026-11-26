/**
 * @jest-environment jsdom
 * @jest-environment-options {"url":"https://ctsv.hust.edu.vn/"}
 */

const { analyzeConductScore, getRankName } = require('../src/core/drl_analyzer');
const { renderHustDrlPanel } = require('../src/content/injected_panel');
const { renderPopupContent } = require('../src/popup/popup');

function criteriaData(score, sharedGroup, includeExtra = true) {
  const firstGroup = {
    CGId: 1,
    CGMaxPoint: sharedGroup ? score + 3 : score + 4,
    UserCriteriaDetailsLst: [
      { CId: 150, CName: 'Điểm hiện tại', UCPoint: score, CMaxPoint: score },
      { CId: 114, CName: 'Tiêu chí A', CMaxPoint: 4 }
    ]
  };
  const otherCriterion = { CId: 115, CName: 'Tiêu chí B', CMaxPoint: 4 };
  const groups = [firstGroup];

  if (sharedGroup) {
    firstGroup.UserCriteriaDetailsLst.push(otherCriterion);
  } else {
    groups.push({ CGId: 2, CGMaxPoint: 4, UserCriteriaDetailsLst: [otherCriterion] });
  }

  const categories = [{ CTId: 1, CTMaxPoint: sharedGroup ? 100 : score + 3, CriteriaGroupDetailsLst: groups }];
  if (includeExtra) {
    categories.push({
      CTId: 2,
      CTMaxPoint: 1,
      CriteriaGroupDetailsLst: [{
        CGId: 3,
        CGMaxPoint: 1,
        UserCriteriaDetailsLst: [{ CId: 121, CName: 'Tiêu chí C', CMaxPoint: 1 }]
      }]
    });
  }

  return { CriteriaTypeDetailsLst: categories };
}

beforeEach(() => {
  document.body.innerHTML = '<div id="popup-content"></div>';
  localStorage.clear();
});

function renderRoadmap(data) {
  const analysis = analyzeConductScore(data);
  renderHustDrlPanel(analysis, data);
  renderPopupContent(analysis);
  return document.getElementById('hust-drl-helper-root').shadowRoot.getElementById('tab-roadmap');
}

test.each([true, false])('applies shared score caps (shared group: %s)', (sharedGroup) => {
  const roadmap = renderRoadmap(criteriaData(66, sharedGroup));

  expect([...roadmap.querySelectorAll('.btn-toggle-check')].map(button => button.dataset.cid)).toEqual(['114', '121']);
  expect(roadmap.textContent).toContain('Tiêu chí A');
  expect(roadmap.textContent).toContain('+3đ');
  expect(roadmap.textContent).toContain('Tối đa 4đ');
  expect(roadmap.textContent).toContain('Tiêu chí C');
  expect(roadmap.textContent).toContain('+1đ');
  expect(roadmap.textContent).toContain('70/100đ. Đủ mốc Khá.');
  expect(document.getElementById('popup-content').textContent).toContain('2 tiêu chí gợi ý');
  expect(document.getElementById('popup-content').textContent).toContain('70/100đ');

  roadmap.querySelector('.btn-toggle-check').click();
  const header = roadmap.getRootNode().getElementById('header-score');
  expect(header.textContent).toContain('69 / 100đ');
  expect(roadmap.querySelector('.btn-toggle-check').dataset.cid).toBe('121');
  roadmap.querySelector('.btn-toggle-check').click();
  expect(header.textContent).toContain('70 / 100đ (Khá)');
});

test('shows the remaining gap when the roadmap falls short', () => {
  const roadmap = renderRoadmap(criteriaData(66, true, false));

  expect(roadmap.textContent).toContain('69/100đ. Còn thiếu 1đ để đạt mốc Khá.');
  expect(roadmap.querySelectorAll('.card')).toHaveLength(1);
});

test('stops suggesting criteria at the highest rank', () => {
  const roadmap = renderRoadmap(criteriaData(90, true));

  expect(roadmap.textContent).toContain('Bạn đã đạt xếp loại cao nhất.');
  expect(roadmap.querySelectorAll('.card')).toHaveLength(0);
  expect(document.getElementById('popup-content').textContent).toContain('Đã đạt Xuất sắc');
});

test('indexes current activities by criterion ID and matches legacy IDs by unique names', () => {
  const { indexCurrentActivities } = require('../src/content/activities');
  const criteria = [
    { id: 115, name: 'Sinh hoạt công dân' },
    { id: 121, name: 'Hỗ trợ cộng đồng' },
    { id: 122, name: 'Hỗ trợ cộng đồng' }
  ];
  const current = {
    id: 100, endsAt: '2026-12-01T00:00:00+07:00',
    criteria: [{ id: 115, name: 'Tên cũ' }, { id: 99, name: ' SINH HOẠT  CÔNG DÂN ' }, { id: 98, name: 'Hỗ trợ cộng đồng' }]
  };
  const ended = { ...current, id: 101, endsAt: '2026-11-01T00:00:00+07:00' };

  const byCriterion = indexCurrentActivities([current, ended], criteria, Date.parse('2026-11-26T10:00:00+07:00'));
  expect([...byCriterion.keys()]).toEqual(['115']);
  expect([...byCriterion.get('115').keys()]).toEqual([100]);
});

test('only fetches details for listed, current AIds and reuses recent details', async () => {
  const { buildPublicActivitySnapshot } = require('../scripts/update-public-activities');
  const now = new Date('2026-11-26T10:00:00+07:00');
  const row = {
    AId: 100, Publish: 1, AName: 'Hoạt động giả lập',
    StartTime: '2026-11-29 07:00:00', FinishTime: '2026-11-29 10:00:00'
  };
  const request = jest.fn(async (endpoint) => endpoint === 'GetPublishActivity'
    ? {
      NumberPage: 1,
      Activities: [row, row, { ...row, AId: 102, Publish: 0 },
        { ...row, AId: 103, StartTime: '2026-11-01 07:00:00', FinishTime: '2026-11-01 10:00:00' }]
    }
    : {
      Activities: [{ ...row, CreateUser: 'synthetic-user', CriteriaLst: [{ CId: 115, CName: 'Sinh hoạt công dân' }] }]
    }
  );

  const { snapshot, catalogRequests, detailRequests } = await buildPublicActivitySnapshot({}, request, now);
  expect([catalogRequests, detailRequests]).toEqual([1, 1]);
  expect(request.mock.calls).toEqual([
    ['GetPublishActivity', { PageNumber: 1, NumberRow: 1000 }],
    ['GetActivityById', { AId: 100 }]
  ]);
  expect(snapshot.activities).toEqual([{
    id: 100,
    name: 'Hoạt động giả lập',
    startsAt: '2026-11-29T07:00:00+07:00',
    endsAt: '2026-11-29T10:00:00+07:00',
    criteria: [{ id: 115, name: 'Sinh hoạt công dân' }],
    criteriaCheckedAt: now.toISOString()
  }]);

  request.mockClear();
  const secondRun = await buildPublicActivitySnapshot(snapshot, request, new Date(+now + 60000));
  expect(secondRun.detailRequests).toBe(0);
  expect(request).toHaveBeenCalledTimes(1);
});

test('captures only score data and cleans older browser snapshots', () => {
  const { initHustDrlHelper } = require('../src/content/content_script');
  const key = 'iCTSV_CriteriaData';
  const scoreData = criteriaData(66, true);
  const withUnrelatedFields = {
    ...scoreData,
    account: 'synthetic-account',
    CriteriaTypeDetailsLst: scoreData.CriteriaTypeDetailsLst.map(category => ({
      ...category,
      CriteriaGroupDetailsLst: category.CriteriaGroupDetailsLst.map(group => ({
        ...group,
        UserCriteriaDetailsLst: group.UserCriteriaDetailsLst.map(item => ({ ...item, UCId: 999 }))
      }))
    }))
  };

  const sendData = detail => window.dispatchEvent(new CustomEvent('HUST_DRL_DATA_EVENT', { detail }));
  sendData({ RespCode: 0, account: 'synthetic-account' });
  expect(localStorage.getItem(key)).toBeNull();

  sendData(withUnrelatedFields);
  expect(JSON.parse(localStorage.getItem(key))).toEqual(scoreData);

  localStorage.setItem(key, JSON.stringify(withUnrelatedFields));
  initHustDrlHelper();
  expect(JSON.parse(localStorage.getItem(key))).toEqual(scoreData);
});

test('chooses fewer criteria at the same difficulty under shared caps', () => {
  const data = {
    CriteriaTypeDetailsLst: [{
      CTId: 6, CTMaxPoint: 100,
      CriteriaGroupDetailsLst: [
        { CGId: 1, CGMaxPoint: 60, UserCriteriaDetailsLst: [{ CId: 150, UCPoint: 60, CMaxPoint: 60 }] },
        {
          CGId: 2, CGMaxPoint: 8,
          UserCriteriaDetailsLst: [{ CId: 114, CMaxPoint: 7 }, { CId: 115, CMaxPoint: 6 }]
        },
        { CGId: 3, CGMaxPoint: 5, UserCriteriaDetailsLst: [{ CId: 117, CMaxPoint: 5 }] }
      ]
    }]
  };

  const result = analyzeConductScore(data);
  expect(result.roadmapItems).toHaveLength(2);
  expect(result.roadmapItems.map(item => item.id)).toContain(117);
  expect(result.projectedScore).toBeGreaterThanOrEqual(70);
});

test('prefers easier criteria even if a harder option would reach the target alone', () => {
  const data = {
    CriteriaTypeDetailsLst: [{
      CTId: 6, CTMaxPoint: 100,
      CriteriaGroupDetailsLst: [{
        CGId: 1, CGMaxPoint: 100,
        UserCriteriaDetailsLst: [
          { CId: 150, UCPoint: 66, CMaxPoint: 66 },
          { CId: 114, CMaxPoint: 2 }, { CId: 115, CMaxPoint: 2 }, { CId: 124, CMaxPoint: 4 }
        ]
      }]
    }]
  };

  const result = analyzeConductScore(data);
  expect(result.projectedScore).toBe(70);
  expect(result.roadmapItems.map(item => item.id)).toEqual([114, 115]);
});

test('displays the five main categories and leaves missing category scores unknown', () => {
  const data = criteriaData(66, true);
  data.CriteriaTypeDetailsLst[0].CTId = 6;
  data.CriteriaTypeDetailsLst[1].CTId = 9;
  const roadmap = renderRoadmap(data);
  const categories = [...roadmap.querySelectorAll('.roadmap-category')];

  expect(categories.map(category => category.querySelector('h3').textContent)).toEqual([
    'Pháp luật và nội quy', 'Học tập', 'Hoạt động chính trị, xã hội, văn hóa, thể thao',
    'Trách nhiệm với cộng đồng', 'Công tác tập thể và thành tích'
  ]);
  expect(categories[0].textContent).toContain('Tiêu chí A');
  expect(categories[0].textContent).toContain('66 → 69/100đ');
  expect(categories[1].textContent).toContain('Chưa có dữ liệu · Trần 20đ');
  expect(categories[3].textContent).toContain('Tiêu chí C');
});

test('uses the self-assessed score when it is zero', () => {
  const data = criteriaData(0, true);
  data.CriteriaTypeDetailsLst[0].CriteriaGroupDetailsLst[0].UserCriteriaDetailsLst[0].TCPoint = 3;
  expect(analyzeConductScore(data).currentScore).toBe(0);
});

test('labels the 80-point rank Tốt in the analysis and in stored popup results', () => {
  expect(getRankName(79)).toBe('Khá');
  expect(getRankName(80)).toBe('Tốt');
  expect(getRankName(89)).toBe('Tốt');
  expect(getRankName(90)).toBe('Xuất sắc');

  renderPopupContent({ currentScore: 84, rank: 'Giỏi', targetScore: 90, scoreNeeded: 6 });
  expect(document.getElementById('popup-content').textContent).toContain('84 / 100đ (Tốt)');
});

test('reads the packaged snapshot once and shows activities under the corresponding criterion', async () => {
  const activities = require('../src/content/activities');
  global.indexCurrentActivities = activities.indexCurrentActivities;
  global.readPublicActivitySnapshot = jest.fn().mockResolvedValue({
    updatedAt: new Date().toISOString(),
    activities: [{
      id: 100, name: 'Hoạt động giả lập', endsAt: new Date(Date.now() + 3600000).toISOString(),
      criteria: [{ id: 121, name: 'Tiêu chí C' }]
    }]
  });

  try {
    const roadmap = renderRoadmap(criteriaData(66, true));
    const shadow = roadmap.getRootNode();
    const criteriaTab = shadow.getElementById('tab-all');

    roadmap.querySelector('.btn-scroll[data-cid="121"]').click();
    expect(criteriaTab.classList.contains('active')).toBe(true);
    const activitySlot = criteriaTab.querySelector('[data-criterion-activities="121"]');
    expect(activitySlot.textContent).toContain('Đang đọc dữ liệu hoạt động');

    await Promise.resolve();
    expect(activitySlot.querySelector('a').pathname).toBe('/hoat-dong/100/chi-tiet');
    expect(activitySlot.querySelector('a').textContent).toBe('Hoạt động giả lập');

    shadow.querySelector('[data-tab="tab-roadmap"]').click();
    roadmap.querySelector('.btn-scroll[data-cid="114"]').click();
    expect(criteriaTab.querySelector('[data-criterion-activities="114"]').textContent).toContain('Bản dữ liệu chưa có hoạt động');
    expect(global.readPublicActivitySnapshot).toHaveBeenCalledTimes(1);
  } finally {
    delete global.readPublicActivitySnapshot;
    delete global.indexCurrentActivities;
  }
});
