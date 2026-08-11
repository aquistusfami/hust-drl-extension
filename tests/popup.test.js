/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Toolbar Popup UI Tests', () => {
  let initPopup;

  beforeEach(() => {
    // Setup initial DOM content resembling popup.html
    document.body.innerHTML = `
      <div class="header">
        <h3>🔴 HUST ĐRL Helper (20261)</h3>
      </div>
      <div class="content" id="popup-content">
        <p>Đang tải dữ liệu ĐRL...</p>
      </div>
      <div class="footer">
        <a href="https://ctsv.hust.edu.vn" target="_blank" class="btn-link">🌐 Mở trang iCTSV</a>
      </div>
    `;

    // Mock chrome.runtime.sendMessage
    global.chrome = {
      runtime: {
        sendMessage: jest.fn()
      }
    };

    // Load module
    initPopup = require('../src/popup/popup').initPopup;
  });

  afterEach(() => {
    jest.resetModules();
    delete global.chrome;
  });

  test('popup.html file exists and contains essential elements', () => {
    const htmlPath = path.join(__dirname, '../src/popup/popup.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    expect(htmlContent).toContain('popup-content');
    expect(htmlContent).toContain('popup.css');
    expect(htmlContent).toContain('popup.js');
    expect(htmlContent).toContain('https://ctsv.hust.edu.vn');
  });

  test('popup.css file exists and contains basic styling rules', () => {
    const cssPath = path.join(__dirname, '../src/popup/popup.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const cssContent = fs.readFileSync(cssPath, 'utf8');
    expect(cssContent).toContain('.score-badge');
    expect(cssContent).toContain('.btn-link');
    expect(cssContent).toContain('.header');
  });

  test('should render DRL data card when GET_DRL_DATA returns payload', () => {
    const mockPayload = {
      currentScore: 78,
      targetScore: 80,
      scoreNeeded: 2,
      rank: 'Khá',
      roadmapItems: [
        { id: '1.1', name: 'Tham gia họp lớp' }
      ]
    };

    global.chrome.runtime.sendMessage.mockImplementation((msg, callback) => {
      if (msg.type === 'GET_DRL_DATA') {
        callback({ payload: mockPayload });
      }
    });

    initPopup();

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'GET_DRL_DATA' },
      expect.any(Function)
    );

    const contentEl = document.getElementById('popup-content');
    expect(contentEl.innerHTML).toContain('78 / 100đ (Khá)');
    expect(contentEl.innerHTML).toContain('Cần thêm <b>2đ</b> để đạt mốc <b>80đ</b>');
    expect(contentEl.innerHTML).toContain('Đã chọn sẵn 1 mục tối ưu nhất');
  });

  test('should render no-data message when GET_DRL_DATA returns empty/null response', () => {
    global.chrome.runtime.sendMessage.mockImplementation((msg, callback) => {
      if (msg.type === 'GET_DRL_DATA') {
        callback(null);
      }
    });

    initPopup();

    const contentEl = document.getElementById('popup-content');
    expect(contentEl.innerHTML).toContain('Chưa có dữ liệu. Vui lòng mở trang iCTSV để tự động trích xuất điểm.');
  });
});
