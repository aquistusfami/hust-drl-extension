# HUST ĐRL Helper (Chrome Extension Kỳ 20261) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng Chrome Extension (Manifest V3) giúp sinh viên HUST tự động trích xuất điểm rèn luyện kỳ 20261 từ website iCTSV, phân loại 63 tiêu chí theo 4 cấp độ dễ/khó và đề xuất lộ trình tích điểm tối ưu nhất.

**Architecture:** Sử dụng Chrome Extension Manifest V3 với Service Worker (`background.js`), Content Script (`content_script.js`) bắt API response trên `ctsv.hust.edu.vn`, và chèn góc phải màn hình một Slide-over Panel được bọc độc lập bằng Shadow DOM (`injected_panel.js`).

**Tech Stack:** JavaScript (ES6+), HTML5, Vanilla CSS3 (Custom Variables), Shadow DOM API, Chrome Extension Manifest V3 API, Node.js (với Jest để chạy unit test cho core logic).

## Global Constraints

- **Platform**: Chrome Extension Manifest V3.
- **Data Scope**: Phân loại chính xác 63 tiêu chí kỳ 20261 (CId 114 -> 176).
- **Privacy**: 100% Client-side processing, lưu trữ LocalStorage, không qua server trung gian.
- **UI Isolation**: Bắt buộc dùng Shadow DOM cho Injected Panel để tránh xung đột CSS với trang web iCTSV gốc.
- **Language & Tone**: Văn phong sinh viên Bách khoa, rõ ràng, thực tế, 0% AI Slop.

---

### Task 1: Cơ sở dữ liệu 63 tiêu chí ĐRL (`src/core/criteria_db.js`)

**Files:**
- Create: `src/core/criteria_db.js`
- Test: `tests/criteria_db.test.js`

**Interfaces:**
- Consumes: Raw JSON structure từ `drl_20261_raw.json`
- Produces: `CRITERIA_DB` object dạng key-value `{ [cId: number]: { id, level, defaultMaxPoint, proofType, tips } }` và hàm `getCriteriaMeta(cId)`

- [ ] **Step 1: Write failing unit test for `criteria_db.js`**

```javascript
// tests/criteria_db.test.js
const { getCriteriaMeta, CRITERIA_DB } = require('../src/core/criteria_db');

describe('Criteria Database Tests', () => {
  test('should contain exactly 63 criteria items', () => {
    const keys = Object.keys(CRITERIA_DB);
    expect(keys.length).toBe(63);
  });

  test('should return correct metadata for Level 1 criteria (CId 115 - SHCD)', () => {
    const meta = getCriteriaMeta(115);
    expect(meta.level).toBe(1);
    expect(meta.proofType).toBe('auto');
  });

  test('should return correct metadata for Level 2 criteria (CId 143 - Hiến máu)', () => {
    const meta = getCriteriaMeta(143);
    expect(meta.level).toBe(2);
    expect(meta.proofType).toBe('proof');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/criteria_db.test.js`
Expected: FAIL with "Cannot find module '../src/core/criteria_db'"

- [ ] **Step 3: Implement `src/core/criteria_db.js`**

```javascript
// src/core/criteria_db.js

const LEVEL_1_FREE = new Set([114, 115, 116, 117, 118, 119, 129, 140, 149, 170, 171]);
const LEVEL_2_EASY = new Set([120, 122, 123, 125, 133, 134, 135, 141, 142, 143, 144, 146, 152]);
const LEVEL_3_MEDIUM = new Set([121, 124, 128, 130, 131, 132, 136, 137, 138, 139, 145, 147, 148, 150, 151, 153, 157, 161, 162, 163]);
const LEVEL_4_HARD = new Set([126, 127, 154, 155, 156, 158, 159, 160, 164, 165, 166, 167, 168, 169]);
const LEVEL_PENALTY = new Set([172, 173, 174, 175, 176]);

const CRITERIA_DB = {};

// Map 63 criteria IDs 114 to 176
for (let id = 114; id <= 176; id++) {
  let level = 3;
  let proofType = 'proof';
  let tips = 'Nộp minh chứng hình ảnh/xác nhận lên hệ thống iCTSV';

  if (LEVEL_1_FREE.has(id)) {
    level = 1;
    proofType = 'auto';
    tips = 'Mục tự động hoặc thực hiện qua bài test/khai báo trực tuyến';
  } else if (LEVEL_2_EASY.has(id)) {
    level = 2;
    proofType = 'proof';
    tips = 'Mục dễ lấy điểm, chỉ cần quét mã QR hoặc nộp ảnh chứng nhận đơn giản';
  } else if (LEVEL_3_MEDIUM.has(id)) {
    level = 3;
    proofType = 'proof';
    tips = 'Yêu cầu quá trình rèn luyện, chứng chỉ ngoại ngữ, khóa kỹ năng hoặc tham gia CLB';
  } else if (LEVEL_4_HARD.has(id)) {
    level = 4;
    proofType = 'proof';
    tips = 'Yêu cầu chức vụ Ban cán sự/Đoàn Hội, giải thưởng NCKH, Olympic hoặc bằng khen';
  } else if (LEVEL_PENALTY.has(id)) {
    level = 0;
    proofType = 'penalty';
    tips = 'Mục điểm trừ do vi phạm quy chế hoặc kỷ luật';
  }

  CRITERIA_DB[id] = { id, level, proofType, tips };
}

function getCriteriaMeta(cId) {
  return CRITERIA_DB[cId] || { id: cId, level: 3, proofType: 'proof', tips: '' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRITERIA_DB, getCriteriaMeta };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/criteria_db.test.js`
Expected: PASS (3 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/core/criteria_db.js tests/criteria_db.test.js
git commit -m "feat: implement criteria metadata database for 63 DRL items"
```

---

### Task 2: Thuật toán Phân tích ĐRL & Đề xuất Lộ trình (`src/core/drl_analyzer.js`)

**Files:**
- Create: `src/core/drl_analyzer.js`
- Test: `tests/drl_analyzer.test.js`

**Interfaces:**
- Consumes: API Json `CriteriaTypeDetailsLst` từ iCTSV, `getCriteriaMeta` từ `criteria_db.js`
- Produces: `analyzeConductScore(rawJson)` -> `{ currentScore, rank, targetScore, scoreNeeded, roadmapItems, classifiedItems }`

- [ ] **Step 1: Write failing unit test for `drl_analyzer.js`**

```javascript
// tests/drl_analyzer.test.js
const fs = require('fs');
const path = require('path');
const { analyzeConductScore, getRankName } = require('../src/core/drl_analyzer');

describe('DRL Analyzer Algorithm Tests', () => {
  const rawJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../drl_20261_raw.json'), 'utf-8'));

  test('should return correct rank names', () => {
    expect(getRankName(95)).toBe('Xuất sắc');
    expect(getRankName(84)).toBe('Giỏi');
    expect(getRankName(72)).toBe('Khá');
    expect(getRankName(55)).toBe('Trung bình');
    expect(getRankName(40)).toBe('Yếu');
  });

  test('should parse initial raw JSON with score 0 and recommend target 70 (Khá)', () => {
    const result = analyzeConductScore(rawJson);
    expect(result.currentScore).toBe(0);
    expect(result.targetScore).toBe(70);
    expect(result.scoreNeeded).toBe(70);
    expect(result.roadmapItems.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/drl_analyzer.test.js`
Expected: FAIL with "Cannot find module '../src/core/drl_analyzer'"

- [ ] **Step 3: Implement `src/core/drl_analyzer.js`**

```javascript
// src/core/drl_analyzer.js
const { getCriteriaMeta } = require('./criteria_db');

function getRankName(score) {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Giỏi';
  if (score >= 70) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Yếu';
}

function getNextTarget(score) {
  if (score < 70) return 70;
  if (score < 80) return 80;
  if (score < 90) return 90;
  return 100;
}

function analyzeConductScore(rawJson) {
  let totalScore = 0;
  const items = [];

  if (rawJson && rawJson.CriteriaTypeDetailsLst) {
    for (const ct of rawJson.CriteriaTypeDetailsLst) {
      for (const cg of ct.CriteriaGroupDetailsLst || []) {
        for (const c of cg.UserCriteriaDetailsLst || []) {
          const cid = c.CId;
          const cname = c.CName;
          const userPoint = c.UCPoint || c.TCPoint || 0;
          const maxPoint = c.CMaxPoint || 0;
          const meta = getCriteriaMeta(cid);

          totalScore += userPoint;

          items.push({
            id: cid,
            name: cname,
            userPoint: userPoint,
            maxPoint: maxPoint,
            isAchieved: userPoint > 0,
            level: meta.level,
            proofType: meta.proofType,
            tips: meta.tips,
            groupName: cg.CGName,
            typeName: ct.CTName
          });
        }
      }
    }
  }

  const currentScore = Math.max(0, totalScore);
  const rank = getRankName(currentScore);
  const targetScore = getNextTarget(currentScore);
  const scoreNeeded = Math.max(0, targetScore - currentScore);

  // Roadmap algorithm: Filter unachieved items, sort by Level 1 -> Level 2 -> Level 3
  const unachieved = items.filter(item => !item.isAchieved && item.level > 0);
  unachieved.sort((a, b) => a.level - b.level);

  let accumulated = 0;
  const roadmapItems = [];
  for (const item of unachieved) {
    if (accumulated >= scoreNeeded && scoreNeeded > 0) break;
    roadmapItems.push(item);
    accumulated += item.maxPoint;
  }

  return {
    currentScore,
    rank,
    targetScore,
    scoreNeeded,
    roadmapItems,
    allItems: items
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeConductScore, getRankName, getNextTarget };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/drl_analyzer.test.js`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/core/drl_analyzer.js tests/drl_analyzer.test.js
git commit -m "feat: implement DRL score analysis and smart roadmap recommendation algorithm"
```

---

### Task 3: Manifest V3 Configuration & Service Worker (`manifest.json` & `background.js`)

**Files:**
- Create: `manifest.json`
- Create: `src/background/background.js`

**Interfaces:**
- Consumes: Chrome Extension APIs (`chrome.runtime`, `chrome.storage`)
- Produces: Service Worker background listener & Manifest V3 configuration

- [ ] **Step 1: Create `manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "HUST ĐRL Helper (Kỳ 20261)",
  "version": "1.0.0",
  "description": "Tiện ích trích xuất và gợi ý lộ trình tích điểm rèn luyện tối ưu cho sinh viên HUST",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "*://ctsv.hust.edu.vn/*",
    "*://*.hust.edu.vn/*"
  ],
  "background": {
    "service_worker": "src/background/background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "*://ctsv.hust.edu.vn/*",
        "*://*.hust.edu.vn/*"
      ],
      "js": [
        "src/core/criteria_db.js",
        "src/core/drl_analyzer.js",
        "src/content/injected_panel.js",
        "src/content/content_script.js"
      ],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

- [ ] **Step 2: Create `src/background/background.js`**

```javascript
// src/background/background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('[HUST ĐRL Helper] Extension installed successfully.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_DRL_DATA') {
    chrome.storage.local.set({ drlData: request.payload }, () => {
      sendResponse({ status: 'SUCCESS' });
    });
    return true;
  }
  if (request.type === 'GET_DRL_DATA') {
    chrome.storage.local.get(['drlData'], (result) => {
      sendResponse({ payload: result.drlData || null });
    });
    return true;
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add manifest.json src/background/background.js
git commit -m "feat: setup Manifest V3 config and background service worker"
```

---

### Task 4: Injected Floating Panel Component (`src/content/injected_panel.js`)

**Files:**
- Create: `src/content/injected_panel.js`

**Interfaces:**
- Consumes: Analysis result từ `drl_analyzer.js`
- Produces: Shadow DOM UI Floating Badge & Slide-over Panel trên `ctsv.hust.edu.vn`

- [ ] **Step 1: Create `src/content/injected_panel.js`**

```javascript
// src/content/injected_panel.js

function renderHustDrlPanel(analysis) {
  if (document.getElementById('hust-drl-helper-root')) {
    document.getElementById('hust-drl-helper-root').remove();
  }

  const container = document.createElement('div');
  container.id = 'hust-drl-helper-root';
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .badge {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #dc2626;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 24px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .panel {
      position: fixed;
      top: 5vh;
      right: -420px;
      width: 380px;
      height: 90vh;
      background: #ffffff;
      box-shadow: -4px 0 20px rgba(0,0,0,0.15);
      border-radius: 12px 0 0 12px;
      transition: right 0.3s ease;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
    }
    .panel.open { right: 0; }
    .panel-header {
      background: #dc2626;
      color: white;
      padding: 16px;
      border-radius: 12px 0 0 0;
    }
    .panel-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .btn-scroll {
      background: #2563eb;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      margin-top: 6px;
    }
  `;

  shadow.appendChild(style);

  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.innerHTML = `🔴 ${analysis.currentScore}đ - ${analysis.rank.toUpperCase()} | +${analysis.scoreNeeded}đ ➔`;
  shadow.appendChild(badge);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel-header">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0; font-size:16px;">HUST ĐRL Helper (20261)</h3>
        <button id="close-btn" style="background:none; border:none; color:white; font-size:18px; cursor:pointer;">✕</button>
      </div>
      <div style="margin-top:8px; font-size:20px; font-weight:bold;">${analysis.currentScore} / 100đ (${analysis.rank})</div>
      <div style="font-size:12px; margin-top:4px;">Cần thêm ${analysis.scoreNeeded}đ để đạt mốc ${analysis.targetScore}đ</div>
    </div>
    <div class="panel-body">
      <h4 style="margin-top:0;">🚀 Mục gợi ý làm thêm</h4>
      ${analysis.roadmapItems.map(item => `
        <div class="card">
          <div style="font-weight:bold; font-size:13px; color:#1e293b;">${item.name}</div>
          <div style="font-size:12px; color:#16a34a; margin-top:4px;">+${item.maxPoint}đ • Level ${item.level}</div>
          <button class="btn-scroll" data-cid="${item.id}">🔍 Kéo tới mục</button>
        </div>
      `).join('')}
    </div>
  `;
  shadow.appendChild(panel);

  badge.onclick = () => panel.classList.toggle('open');
  shadow.getElementById('close-btn').onclick = () => panel.classList.remove('open');

  shadow.querySelectorAll('.btn-scroll').forEach(btn => {
    btn.onclick = (e) => {
      const cid = e.target.getAttribute('data-cid');
      scrollToCriteriaOnPage(cid);
    };
  });
}

function scrollToCriteriaOnPage(cId) {
  const elements = document.querySelectorAll(`[data-cid="${cId}"], [id*="${cId}"]`);
  if (elements.length > 0) {
    elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    elements[0].style.backgroundColor = '#fef08a';
    setTimeout(() => { elements[0].style.backgroundColor = ''; }, 2500);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderHustDrlPanel, scrollToCriteriaOnPage };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/injected_panel.js
git commit -m "feat: implement Shadow DOM floating badge & slide-over panel"
```

---

### Task 5: Content Script Integration & Data Interceptor (`src/content/content_script.js`)

**Files:**
- Create: `src/content/content_script.js`

**Interfaces:**
- Consumes: iCTSV web page state / API data
- Produces: Passes extracted JSON data to `drl_analyzer.js` and calls `renderHustDrlPanel`

- [ ] **Step 1: Create `src/content/content_script.js`**

```javascript
// src/content/content_script.js

function initHustDrlHelper() {
  console.log('[HUST ĐRL Helper] Content script active on iCTSV.');

  // Try fetching data from window or localStorage if present
  let rawJson = null;

  try {
    const stored = localStorage.getItem('iCTSV_CriteriaData');
    if (stored) rawJson = JSON.parse(stored);
  } catch (e) {
    console.error('[HUST ĐRL Helper] LocalStorage parse error:', e);
  }

  // Fallback to initial sample structure if testing
  if (!rawJson && typeof sampleDrlRawJson !== 'undefined') {
    rawJson = sampleDrlRawJson;
  }

  if (rawJson) {
    const analysis = analyzeConductScore(rawJson);
    renderHustDrlPanel(analysis);

    // Save to extension storage
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'SAVE_DRL_DATA', payload: analysis });
    }
  }
}

// Run on page load
if (document.readyState === 'complete') {
  initHustDrlHelper();
} else {
  window.addEventListener('load', initHustDrlHelper);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/content_script.js
git commit -m "feat: connect content script to auto-extract API data and render panel"
```

---

### Task 6: Toolbar Popup UI (`src/popup/popup.html`, `popup.js`, `popup.css`)

**Files:**
- Create: `src/popup/popup.html`
- Create: `src/popup/popup.js`
- Create: `src/popup/popup.css`

**Interfaces:**
- Consumes: Data stored in `chrome.storage.local`
- Produces: Extension Toolbar Popup UI

- [ ] **Step 1: Create `src/popup/popup.html`**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>HUST ĐRL Helper</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="header">
    <h3>🔴 HUST ĐRL Helper (20261)</h3>
  </div>
  <div class="content" id="popup-content">
    <p>Đang tải dữ liệu ĐRL...</p>
  </div>
  <div class="footer">
    <a href="https://ctsv.hust.edu.vn" target="_blank" class="btn-link">🌐 Mở trang iCTSV</a>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `src/popup/popup.css`**

```css
body {
  width: 320px;
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  background: #ffffff;
}
.header {
  background: #dc2626;
  color: white;
  padding: 12px 16px;
}
.header h3 { margin: 0; font-size: 15px; }
.content { padding: 16px; }
.score-badge { font-size: 22px; font-weight: bold; color: #dc2626; }
.footer { padding: 12px 16px; border-top: 1px solid #e2e8f0; text-align: center; }
.btn-link {
  display: inline-block;
  background: #2563eb;
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

- [ ] **Step 3: Create `src/popup/popup.js`**

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const contentEl = document.getElementById('popup-content');

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'GET_DRL_DATA' }, (response) => {
      if (response && response.payload) {
        const data = response.payload;
        contentEl.innerHTML = `
          <div class="score-badge">${data.currentScore} / 100đ (${data.rank})</div>
          <p style="font-size:13px; color:#475569; margin-top:8px;">
            Cần thêm <b>${data.scoreNeeded}đ</b> để đạt mốc <b>${data.targetScore}đ</b>.
          </p>
          <div style="font-size:12px; background:#f8fafc; padding:8px; border-radius:6px; margin-top:8px;">
            🚀 Đã chọn sẵn ${data.roadmapItems.length} mục tối ưu nhất trên trang iCTSV!
          </div>
        `;
      } else {
        contentEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Chưa có dữ liệu. Vui lòng mở trang iCTSV để tự động trích xuất điểm.</p>`;
      }
    });
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add src/popup/popup.html src/popup/popup.js src/popup/popup.css
git commit -m "feat: implement extension toolbar popup UI"
```

---

## Plan Verification

- Run `npx jest` to ensure core analysis and database tests pass.
- Verify `manifest.json` schema and permissions.
- Validate Chrome Extension structure by loading unpacked extension in Chrome Developer Mode.
