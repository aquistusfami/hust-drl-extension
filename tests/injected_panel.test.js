/**
 * @jest-environment jsdom
 */

const { renderHustDrlPanel, scrollToCriteriaOnPage } = require('../src/content/injected_panel');

describe('Injected Floating Panel Component Tests', () => {
  let mockAnalysis;

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();

    mockAnalysis = {
      currentScore: 65,
      rank: 'Trung bình',
      targetScore: 70,
      scoreNeeded: 5,
      roadmapItems: [
        { id: 117, name: 'Tham gia họp lớp', maxPoint: 3, level: 1, proofType: 'auto' },
        { id: 121, name: 'Tham gia NCKH', maxPoint: 2, level: 3, proofType: 'proof' }
      ],
      allItems: [
        { id: 117, name: 'Tham gia họp lớp', maxPoint: 3, level: 1, isAchieved: false },
        { id: 121, name: 'Tham gia NCKH', maxPoint: 2, level: 3, isAchieved: false }
      ]
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create container with shadow DOM and render badge & panel', () => {
    renderHustDrlPanel(mockAnalysis);

    const root = document.getElementById('hust-drl-helper-root');
    expect(root).not.toBeNull();

    const shadow = root.shadowRoot;
    expect(shadow).not.toBeNull();

    const badge = shadow.querySelector('.badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('HUST ĐRL: 65đ (TRUNG BÌNH) | +5đ ➔');

    const panel = shadow.querySelector('.panel');
    expect(panel).not.toBeNull();
    expect(panel.querySelector('.panel-header').textContent).toContain('65 / 100đ (Trung bình)');
    expect(panel.querySelector('.panel-header').textContent).toContain('Cần thêm 5đ');

    const cards = shadow.querySelectorAll('#tab-roadmap .card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Tham gia họp lớp');
    expect(cards[0].textContent).toContain('+3đ');
    expect(cards[0].textContent).toContain('Level 1');
    expect(cards[1].textContent).toContain('Tham gia NCKH');
  });

  test('should remove existing root before re-rendering', () => {
    renderHustDrlPanel(mockAnalysis);
    renderHustDrlPanel(mockAnalysis);

    const roots = document.querySelectorAll('#hust-drl-helper-root');
    expect(roots.length).toBe(1);
  });

  test('should toggle panel open class when badge is clicked', () => {
    renderHustDrlPanel(mockAnalysis);
    const shadow = document.getElementById('hust-drl-helper-root').shadowRoot;
    const badge = shadow.querySelector('.badge');
    const panel = shadow.querySelector('.panel');

    expect(panel.classList.contains('open')).toBe(false);
    badge.click();
    expect(panel.classList.contains('open')).toBe(true);

    const closeBtn = shadow.querySelector('#close-btn');
    closeBtn.click();
    expect(panel.classList.contains('open')).toBe(false);
  });

  test('should scroll to criteria and highlight element temporarily', () => {
    const targetEl = document.createElement('div');
    targetEl.setAttribute('data-cid', '117');
    targetEl.scrollIntoView = jest.fn();
    document.body.appendChild(targetEl);

    scrollToCriteriaOnPage('117');

    expect(targetEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

    jest.advanceTimersByTime(2600);
    expect(targetEl.style.backgroundColor).toBe('');
  });
});
