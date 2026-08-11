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
      targetScore: 70,
      scoreNeeded: 5,
      rank: 'Trung bình',
      roadmapItems: [
        { id: '1.1', name: 'Tham gia họp lớp', maxPoint: 3, level: 1 },
        { id: '2.1', name: 'Tham gia NCKH', maxPoint: 5, level: 2 }
      ],
      allItems: []
    };

    // Polyfill Element.prototype.scrollIntoView if missing in JSDOM
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = jest.fn();
    } else {
      jest.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    }
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('should create container with shadow DOM and render badge & panel', () => {
    renderHustDrlPanel(mockAnalysis);

    const root = document.getElementById('hust-drl-helper-root');
    expect(root).not.toBeNull();
    expect(root.shadowRoot).not.toBeNull();

    const shadow = root.shadowRoot;
    const badge = shadow.querySelector('.badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('65đ');
    expect(badge.textContent).toContain('TRUNG BÌNH');
    expect(badge.textContent).toContain('+5đ');

    const panel = shadow.querySelector('.panel');
    expect(panel).not.toBeNull();
    expect(panel.querySelector('.panel-header').textContent).toContain('65 / 100đ (Trung bình)');
    expect(panel.querySelector('.panel-header').textContent).toContain('Cần thêm 5đ');

    const cards = shadow.querySelectorAll('.card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Tham gia họp lớp');
    expect(cards[0].textContent).toContain('+3đ • Level 1');
    expect(cards[1].textContent).toContain('Tham gia NCKH');
    expect(cards[1].textContent).toContain('+5đ • Level 2');
  });

  test('should remove existing root before rendering new panel', () => {
    const existingRoot = document.createElement('div');
    existingRoot.id = 'hust-drl-helper-root';
    existingRoot.innerHTML = '<div class="old-content">Old</div>';
    document.body.appendChild(existingRoot);

    renderHustDrlPanel(mockAnalysis);

    const roots = document.querySelectorAll('#hust-drl-helper-root');
    expect(roots.length).toBe(1);
    expect(roots[0].shadowRoot.querySelector('.old-content')).toBeNull();
  });

  test('should toggle panel open/close on badge click and close button click', () => {
    renderHustDrlPanel(mockAnalysis);

    const root = document.getElementById('hust-drl-helper-root');
    const shadow = root.shadowRoot;
    const badge = shadow.querySelector('.badge');
    const panel = shadow.querySelector('.panel');
    const closeBtn = shadow.querySelector('#close-btn');

    expect(panel.classList.contains('open')).toBe(false);

    // Click badge to open panel
    badge.click();
    expect(panel.classList.contains('open')).toBe(true);

    // Click badge to close panel
    badge.click();
    expect(panel.classList.contains('open')).toBe(false);

    // Click badge to open panel again
    badge.click();
    expect(panel.classList.contains('open')).toBe(true);

    // Click close button to close panel
    closeBtn.click();
    expect(panel.classList.contains('open')).toBe(false);
  });

  test('scrollToCriteriaOnPage should find element by data-cid or id, highlight it and scroll', () => {
    const targetDiv = document.createElement('div');
    targetDiv.setAttribute('data-cid', '1.1');
    document.body.appendChild(targetDiv);

    scrollToCriteriaOnPage('1.1');

    expect(targetDiv.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(targetDiv.style.backgroundColor).toBe('rgb(254, 240, 138)'); // #fef08a in rgb

    // Fast-forward 2500ms timer
    jest.advanceTimersByTime(2500);
    expect(targetDiv.style.backgroundColor).toBe('');
  });

  test('clicking scroll button in panel should invoke scrollToCriteriaOnPage', () => {
    const targetDiv = document.createElement('div');
    targetDiv.setAttribute('data-cid', '2.1');
    document.body.appendChild(targetDiv);

    renderHustDrlPanel(mockAnalysis);

    const root = document.getElementById('hust-drl-helper-root');
    const shadow = root.shadowRoot;
    const scrollBtns = shadow.querySelectorAll('.btn-scroll');

    expect(scrollBtns.length).toBe(2);
    scrollBtns[1].click();

    expect(targetDiv.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(targetDiv.style.backgroundColor).toBe('rgb(254, 240, 138)');
  });
});
