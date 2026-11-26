/**
 * @jest-environment jsdom
 */

const { analyzeConductScore } = require('../src/core/drl_analyzer');
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

test('reads only same-site activity detail links from the iCTSV event cards', () => {
  const { getActivityLinks } = require('../src/content/activities');
  document.body.innerHTML = `
    <div class="slider">
      <a href="/hoat-dong/100/chi-tiet">Hoạt động A</a>
      <a href="/hoat-dong/100/chi-tiet">Bản sao</a>
      <a href="/hoat-dong/101/thanh-vien">Thành viên</a>
      <a href="https://example.org/hoat-dong/102/chi-tiet">Ngoài iCTSV</a>
    </div>
    <a href="/hoat-dong/103/chi-tiet">Ngoài danh sách sự kiện</a>
    <div class="frame-text-event"><a href="/hoat-dong/104/chi-tiet">Hoạt động B</a></div>
  `;

  expect(getActivityLinks(document)).toEqual(['/hoat-dong/100/chi-tiet', '/hoat-dong/104/chi-tiet']);
});

test('requires an enabled, visible registration action and an explicit criteria list', () => {
  const { getOpenActivity } = require('../src/content/activities');
  document.body.innerHTML = `
    <h1 class="st-hero-banner__title">Chương trình phục vụ cộng đồng</h1>
    <section class="ui-section--1"><button class="ui-btn-primary">Đăng ký tham gia</button></section>
    <section class="ui-section--2"><ul><li>
      <span class="ac-criteria__num">1</span><span> HỖ TRỢ   HOẠT ĐỘNG CỘNG ĐỒNG </span>
    </li></ul></section>
  `;
  const button = document.querySelector('button');
  expect(getOpenActivity(document)).toBeNull();

  button.getClientRects = () => [button.getBoundingClientRect()];
  expect(getOpenActivity(document)).toEqual({
    name: 'Chương trình phục vụ cộng đồng',
    criteria: ['hỗ trợ hoạt động cộng đồng']
  });

  button.disabled = true;
  expect(getOpenActivity(document)).toBeNull();
  button.disabled = false;
  button.textContent = 'Đã đăng ký';
  expect(getOpenActivity(document)).toBeNull();
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
