/**
 * @jest-environment jsdom
 */
const util = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

const fs = require('fs');
const path = require('path');

describe('Toolbar Popup UI Tests', () => {
  let initPopup;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="header">
        <h3>🔴 HUST ĐRL Helper (20261)</h3>
      </div>
      <div class="content" id="popup-content">
        <p>Đang tải dữ liệu ĐRL...</p>
      </div>
      <div class="footer">
        <button id="btn-demo" class="btn-demo">🧪 Xem dữ liệu mẫu (Demo)</button>
        <a href="https://ctsv.hust.edu.vn" target="_blank" class="btn-link">🌐 Trang iCTSV HUST</a>
      </div>
    `;

    global.chrome = {
      runtime: {
        sendMessage: jest.fn()
      }
    };

    delete require.cache[require.resolve('../src/popup/popup.js')];
    initPopup = require('../src/popup/popup.js').initPopup;
  });

  test('should contain valid HTML structure', () => {
    expect(document.getElementById('popup-content')).not.toBeNull();
    expect(document.getElementById('btn-demo')).not.toBeNull();
  });

  test('should render DRL data card when GET_DRL_DATA returns payload', () => {
    const mockData = {
      currentScore: 84,
      rank: 'Giỏi',
      targetScore: 90,
      scoreNeeded: 6,
      roadmapItems: [{ id: 143, name: 'Hiến máu' }]
    };

    global.chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      if (msg.type === 'GET_DRL_DATA') {
        cb({ payload: mockData });
      }
    });

    initPopup();

    const contentEl = document.getElementById('popup-content');
    expect(contentEl.innerHTML).toContain('84 / 100đ (Giỏi)');
    expect(contentEl.innerHTML).toContain('6đ');
  });

  test('should render no-data message when GET_DRL_DATA returns empty/null response', () => {
    global.chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      if (msg.type === 'GET_DRL_DATA') {
        cb({ payload: null });
      }
    });

    initPopup();

    const contentEl = document.getElementById('popup-content');
    expect(contentEl.innerHTML).toContain('Chưa có dữ liệu từ trang iCTSV');
  });
});
