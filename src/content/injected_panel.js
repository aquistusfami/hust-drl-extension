// src/content/injected_panel.js

let currentAnalysisState = null;
let currentRawData = null;
let isPanelOpenState = false;
let activeTabIdState = 'tab-roadmap';

function renderHustDrlPanel(analysis, rawData) {
  currentAnalysisState = analysis;
  if (rawData) currentRawData = rawData;

  let container = document.getElementById('hust-drl-helper-root');

  if (!container) {
    container = document.createElement('div');
    container.id = 'hust-drl-helper-root';

    const targetHost = document.body || document.documentElement;
    if (targetHost) {
      targetHost.appendChild(container);
    } else {
      return;
    }
    container.attachShadow({ mode: 'open' });
  }

  const shadow = container.shadowRoot;
  updateHustDrlPanelDOM(shadow, analysis, rawData);
}

function updateHustDrlPanelDOM(shadow, analysis, rawData) {
  const progressPercent = Math.min(100, (analysis.currentScore / 100) * 100);

  // If shadow DOM is empty, build initial structure
  if (!shadow.querySelector('.panel')) {
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
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .badge:hover { background: #b91c1c; }
      .panel {
        position: fixed;
        top: 5vh;
        right: -440px;
        width: 400px;
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
      .progress-bar-bg {
        background: rgba(255,255,255,0.3);
        height: 6px;
        border-radius: 3px;
        margin-top: 8px;
        overflow: hidden;
        position: relative;
      }
      .progress-bar-fill {
        background: #facc15;
        height: 100%;
        width: 0%;
        transition: width 0.4s ease;
      }
      .tab-bar {
        display: flex;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .tab-btn {
        flex: 1;
        padding: 11px 8px;
        border: none;
        background: none;
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        text-align: center;
      }
      .tab-btn.active {
        color: #dc2626;
        border-bottom: 2px solid #dc2626;
        background: #ffffff;
      }
      .panel-body {
        padding: 14px;
        overflow-y: auto;
        flex: 1;
        background: #f8fafc;
      }
      .tab-content { display: none; }
      .tab-content.active { display: block; }
      .card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      }
      .btn-scroll {
        background: #2563eb;
        color: white;
        border: none;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
      }
      .group-section {
        margin-top: 12px;
        margin-bottom: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      }
      .group-header {
        padding: 10px 12px;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .group-header.lvl-1 { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
      .group-header.lvl-2 { background: #f0f9ff; border-color: #bae6fd; color: #075985; }
      .group-header.lvl-3 { background: #f8fafc; border-color: #e2e8f0; color: #334155; }
      .group-header.lvl-4 { background: #fffbeb; border-color: #fde68a; color: #92400e; }

      .group-count {
        font-size: 11px;
        font-weight: 500;
        background: rgba(255,255,255,0.8);
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid rgba(0,0,0,0.08);
      }
      .item-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.15s ease;
      }
      .item-row:last-child { border-bottom: none; }
      .item-row:hover { background: #f8fafc; }
      .chk-item {
        width: 16px;
        height: 16px;
        accent-color: #dc2626;
        cursor: pointer;
      }
      .item-info {
        flex: 1;
      }
      .item-title {
        font-size: 13px;
        font-weight: 500;
        color: #0f172a;
        line-height: 1.4;
      }
      .item-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 3px;
      }
      .item-status {
        font-size: 11px;
        color: #94a3b8;
      }
      .item-status.achieved {
        color: #16a34a;
        font-weight: 600;
      }
      .select-priority {
        font-size: 10px;
        padding: 1px 4px;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        background: #ffffff;
        color: #475569;
        cursor: pointer;
      }
      .item-points {
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        background: #f1f5f9;
        padding: 3px 8px;
        border-radius: 6px;
        white-space: nowrap;
      }
      .item-points.achieved {
        color: #15803d;
        background: #dcfce7;
      }
    `;

    shadow.appendChild(style);

    const badge = document.createElement('div');
    badge.className = 'badge';
    shadow.appendChild(badge);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:15px; font-weight:600;">HUST ĐRL Helper (20261)</h3>
          <button id="close-btn" style="background:none; border:none; color:white; font-size:18px; cursor:pointer;">✕</button>
        </div>
        <div id="header-score" style="margin-top:8px; font-size:22px; font-weight:bold;">0 / 100đ (Yếu)</div>
        <div id="header-target" style="font-size:12px; margin-top:2px; opacity:0.9;">Cần thêm 70đ để đạt mốc 70đ</div>
        <div class="progress-bar-bg">
          <div id="header-progress" class="progress-bar-fill" style="width: 0%;"></div>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab-btn active" data-tab="tab-roadmap">Gợi ý Lộ trình</button>
        <button class="tab-btn" data-tab="tab-all">63 Tiêu chí</button>
        <button class="tab-btn" data-tab="tab-tips">Mẹo nộp MC</button>
      </div>

      <div class="panel-body">
        <!-- Tab 1: Roadmap -->
        <div id="tab-roadmap" class="tab-content active"></div>

        <!-- Tab 2: All 63 Criteria Interactive Checklist & Tier Customizer -->
        <div id="tab-all" class="tab-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:12px; color:#475569; font-weight:500;">Bảng 63 Tiêu chí rèn luyện</span>
            <button id="btn-reset-tiers" style="background:#ffffff; border:1px solid #cbd5e1; color:#475569; font-size:11px; padding:3px 8px; border-radius:4px; cursor:pointer;">Đặt lại nhóm</button>
          </div>

          <div class="group-section">
            <div class="group-header lvl-1">
              <span>Mục ưu tiên cao (Tự động / Dễ tích điểm)</span>
              <span id="count-lvl-1" class="group-count">0 tiêu chí</span>
            </div>
            <div id="level-1-list"></div>
          </div>

          <div class="group-section">
            <div class="group-header lvl-2">
              <span>Mục rèn luyện thông thường</span>
              <span id="count-lvl-2" class="group-count">0 tiêu chí</span>
            </div>
            <div id="level-2-list"></div>
          </div>

          <div class="group-section">
            <div class="group-header lvl-3">
              <span>Mục nâng cao / Kỹ năng & Khóa học</span>
              <span id="count-lvl-3" class="group-count">0 tiêu chí</span>
            </div>
            <div id="level-3-list"></div>
          </div>

          <div class="group-section">
            <div class="group-header lvl-4">
              <span>Mục thành tích & Khen thưởng</span>
              <span id="count-lvl-4" class="group-count">0 tiêu chí</span>
            </div>
            <div id="level-4-list"></div>
          </div>
        </div>

        <!-- Tab 3: Tips -->
        <div id="tab-tips" class="tab-content">
          <div class="card">
            <b style="color:#0f172a; font-size:13px;">Hiến máu nhân đạo (+6đ)</b>
            <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Chụp rõ ảnh Giấy chứng nhận hiến máu hoặc mã QR trên ứng dụng Hiến máu.</p>
          </div>
          <div class="card">
            <b style="color:#0f172a; font-size:13px;">Thể dục nâng cao sức khỏe (+4đ)</b>
            <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Nộp ảnh kết quả chạy bộ từ ứng dụng Strava, VietRace365 hoặc chứng nhận BKRun.</p>
          </div>
          <div class="card">
            <b style="color:#0f172a; font-size:13px;">Khảo sát sinh viên (+3đ)</b>
            <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Thực hiện khảo sát đánh giá giảng dạy trực tuyến trên eHUST/iCTSV.</p>
          </div>
          <div class="card">
            <b style="color:#0f172a; font-size:13px;">Khóa học kỹ năng bổ trợ / nghề nghiệp (+6đ)</b>
            <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Tải lên chứng chỉ hoàn thành khóa đào tạo kỹ năng do Trường/Khoa hoặc đơn vị hợp tác tổ chức.</p>
          </div>
          <div class="card">
            <b style="color:#0f172a; font-size:13px;">Chứng chỉ Ngoại ngữ TOEIC 600+ (+6đ)</b>
            <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Tải ảnh chụp chứng chỉ quốc tế còn thời hạn lên hệ thống.</p>
          </div>
          <div class="card">
            <b style="color:#0f172a; font-size:13px;">Thực tập sinh doanh nghiệp (>30 ngày) (+6đ)</b>
            <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Nộp Giấy xác nhận thực tập từ doanh nghiệp có đóng dấu hợp pháp.</p>
          </div>
        </div>
      </div>
    `;
    shadow.appendChild(panel);

    // Event listeners
    badge.onclick = () => {
      isPanelOpenState = !panel.classList.contains('open');
      panel.classList.toggle('open', isPanelOpenState);
    };

    shadow.getElementById('close-btn').onclick = () => {
      isPanelOpenState = false;
      panel.classList.remove('open');
    };

    const tabBtns = shadow.querySelectorAll('.tab-btn');
    const tabContents = shadow.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        activeTabIdState = targetId;
        const targetEl = shadow.getElementById(targetId);
        if (targetEl) targetEl.classList.add('active');
      };
    });

    const resetBtn = shadow.getElementById('btn-reset-tiers');
    if (resetBtn) {
      resetBtn.onclick = () => {
        const resetLevels = typeof resetCustomLevels !== 'undefined' ? resetCustomLevels : (typeof window !== 'undefined' ? window.resetCustomLevels : null);
        if (resetLevels) {
          resetLevels();
          reAnalyzeAndRender();
        }
      };
    }
  }

  // Update Header & Badge in-place
  const badgeEl = shadow.querySelector('.badge');
  if (badgeEl) {
    badgeEl.innerHTML = `HUST ĐRL: ${analysis.currentScore}đ (${analysis.rank.toUpperCase()}) | +${analysis.scoreNeeded}đ ➔`;
  }

  const panelEl = shadow.querySelector('.panel');
  if (panelEl) {
    panelEl.classList.toggle('open', isPanelOpenState);
  }

  const scoreEl = shadow.getElementById('header-score');
  if (scoreEl) scoreEl.textContent = `${analysis.currentScore} / 100đ (${analysis.rank})`;

  const targetEl = shadow.getElementById('header-target');
  if (targetEl) targetEl.textContent = `Cần thêm ${analysis.scoreNeeded}đ để đạt mốc ${analysis.targetScore}đ`;

  const progressEl = shadow.getElementById('header-progress');
  if (progressEl) progressEl.style.width = `${progressPercent}%`;

  // Update Tab Roadmap in-place
  const roadmapContainer = shadow.getElementById('tab-roadmap');
  if (roadmapContainer) {
    roadmapContainer.innerHTML = `
      <p style="font-size:12px; color:#475569; margin-top:0; margin-bottom:10px;">Các tiêu chí ưu tiên làm để đạt mốc ${analysis.targetScore}đ:</p>
      ${(analysis.roadmapItems || []).map(item => `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="font-weight:600; font-size:13px; color:#0f172a; flex:1;">${item.name}</div>
            <span style="font-size:12px; font-weight:700; color:#15803d; background:#dcfce7; padding:2px 8px; border-radius:4px; margin-left:6px;">+${item.effectiveGain || item.maxPoint}đ</span>
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:4px;">${item.proofType === 'auto' ? 'Tự động cộng điểm' : 'Cần nộp minh chứng'}</div>
          <div style="margin-top:8px; display:flex; gap:6px;">
            <button class="btn-scroll" data-cid="${item.id}">Kéo tới mục</button>
            <button class="btn-toggle-check" data-cid="${item.id}" style="background:#15803d; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:11px; cursor:pointer;">Đánh dấu đã làm</button>
          </div>
        </div>
      `).join('')}
    `;
  }

  // Update Tab 63 Criteria lists in-place
  const itemsByLevel = { 1: [], 2: [], 3: [], 4: [] };
  (analysis.allItems || []).forEach(item => {
    const lvl = itemsByLevel[item.level] ? item.level : 3;
    itemsByLevel[lvl].push(item);
  });

  const levelLists = {
    1: shadow.getElementById('level-1-list'),
    2: shadow.getElementById('level-2-list'),
    3: shadow.getElementById('level-3-list'),
    4: shadow.getElementById('level-4-list')
  };

  for (let l = 1; l <= 4; l++) {
    const countEl = shadow.getElementById(`count-lvl-${l}`);
    if (countEl) countEl.textContent = `${itemsByLevel[l].length} tiêu chí`;

    const listEl = levelLists[l];
    if (listEl) {
      listEl.innerHTML = itemsByLevel[l].map(item => `
        <div class="item-row">
          <input type="checkbox" class="chk-item" data-cid="${item.id}" ${item.isAchieved ? 'checked' : ''}>
          <div class="item-info">
            <div class="item-title">${item.name}</div>
            <div class="item-meta">
              <span class="item-status ${item.isAchieved ? 'achieved' : ''}">${item.isAchieved ? 'Đã đạt' : 'Chưa đạt'}</span>
              <select class="select-priority" data-cid="${item.id}">
                <option value="1" ${item.level === 1 ? 'selected' : ''}>Ưu tiên: Cao</option>
                <option value="2" ${item.level === 2 ? 'selected' : ''}>Ưu tiên: Dễ</option>
                <option value="3" ${item.level === 3 ? 'selected' : ''}>Ưu tiên: Thường</option>
                <option value="4" ${item.level === 4 ? 'selected' : ''}>Ưu tiên: Khó</option>
              </select>
            </div>
          </div>
          <span class="item-points ${item.isAchieved ? 'achieved' : ''}">+${item.maxPoint}đ</span>
        </div>
      `).join('');
    }
  }

  // Re-bind dynamic handlers
  shadow.querySelectorAll('.select-priority').forEach(select => {
    select.onchange = (e) => {
      const cid = parseInt(e.target.getAttribute('data-cid'));
      const lvl = parseInt(e.target.value);
      const setLevel = typeof setCustomLevel !== 'undefined' ? setCustomLevel : (typeof window !== 'undefined' ? window.setCustomLevel : null);
      if (setLevel) {
        setLevel(cid, lvl);
        reAnalyzeAndRender();
      }
    };
  });

  shadow.querySelectorAll('.chk-item, .btn-toggle-check').forEach(element => {
    element.onclick = (e) => {
      const cid = parseInt(e.target.getAttribute('data-cid'));
      toggleItemAchievedState(cid);
    };
  });

  shadow.querySelectorAll('.btn-scroll').forEach(btn => {
    btn.onclick = (e) => {
      const cid = e.target.getAttribute('data-cid');
      scrollToCriteriaOnPage(cid);
    };
  });
}

function reAnalyzeAndRender() {
  if (!currentRawData) return;
  const analyzer = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : (typeof window !== 'undefined' ? window.analyzeConductScore : null);
  if (analyzer) {
    const updatedAnalysis = analyzer(currentRawData);
    renderHustDrlPanel(updatedAnalysis, currentRawData);

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SAVE_DRL_DATA', payload: updatedAnalysis });
    }
  }
}

function toggleItemAchievedState(cId) {
  if (!currentRawData) return;

  const metaFetcher = typeof getCriteriaMeta !== 'undefined' ? getCriteriaMeta : (typeof window !== 'undefined' ? window.getCriteriaMeta : () => ({ defaultMaxPoint: 6.0 }));

  for (const ct of currentRawData.CriteriaTypeDetailsLst || []) {
    for (const cg of ct.CriteriaGroupDetailsLst || []) {
      for (const c of cg.UserCriteriaDetailsLst || []) {
        if (c.CId == cId) {
          const defaultP = metaFetcher(cId).defaultMaxPoint || 6.0;
          const targetPoint = c.CMaxPoint !== undefined && c.CMaxPoint > 0 ? c.CMaxPoint : defaultP;

          if (c.UCPoint > 0 || c.TCPoint > 0) {
            c.UCPoint = 0.0;
            c.TCPoint = 0.0;
          } else {
            c.UCPoint = targetPoint;
            c.TCPoint = targetPoint;
          }
          break;
        }
      }
    }
  }

  // Save to localStorage and re-analyze
  try {
    localStorage.setItem('iCTSV_CriteriaData', JSON.stringify(currentRawData));
  } catch (e) {}

  reAnalyzeAndRender();
}

function scrollToCriteriaOnPage(cId) {
  const elements = document.querySelectorAll(`[data-cid="${cId}"], [id*="${cId}"]`);
  if (elements.length > 0) {
    elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    elements[0].style.backgroundColor = '#fef08a';
    setTimeout(() => { elements[0].style.backgroundColor = ''; }, 2500);
  }
}

if (typeof window !== 'undefined') {
  window.renderHustDrlPanel = renderHustDrlPanel;
  window.scrollToCriteriaOnPage = scrollToCriteriaOnPage;
  window.toggleItemAchievedState = toggleItemAchievedState;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderHustDrlPanel, scrollToCriteriaOnPage, toggleItemAchievedState };
}
