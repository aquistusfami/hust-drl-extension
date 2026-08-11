// src/content/injected_panel.js

let currentAnalysisState = null;
let currentRawData = null;
let isPanelOpenState = false;
let activeTabIdState = 'tab-roadmap';

function renderHustDrlPanel(analysis, rawData) {
  currentAnalysisState = analysis;
  if (rawData) currentRawData = rawData;

  const existingRoot = document.getElementById('hust-drl-helper-root');
  if (existingRoot && existingRoot.shadowRoot) {
    const existingPanel = existingRoot.shadowRoot.querySelector('.panel');
    if (existingPanel && existingPanel.classList.contains('open')) {
      isPanelOpenState = true;
    }
    const activeTab = existingRoot.shadowRoot.querySelector('.tab-btn.active');
    if (activeTab) {
      activeTabIdState = activeTab.getAttribute('data-tab');
    }
  }

  if (existingRoot) {
    existingRoot.remove();
  }

  const container = document.createElement('div');
  container.id = 'hust-drl-helper-root';

  const targetHost = document.body || document.documentElement;
  if (targetHost) {
    targetHost.appendChild(container);
  } else {
    return;
  }

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
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
    }
    .tab-btn {
      flex: 1;
      padding: 10px;
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
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
    .item-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .item-row:last-child { border-bottom: none; }
    .btn-scroll {
      background: #2563eb;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    }
    .level-header {
      font-weight: bold;
      font-size: 12px;
      padding: 6px 10px;
      background: #f1f5f9;
      color: #334155;
      border-radius: 6px;
      margin-top: 12px;
      margin-bottom: 6px;
      border-left: 3px solid #dc2626;
    }
  `;

  shadow.appendChild(style);

  const progressPercent = Math.min(100, (analysis.currentScore / 100) * 100);

  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.innerHTML = `HUST ĐRL: ${analysis.currentScore}đ (${analysis.rank.toUpperCase()}) | +${analysis.scoreNeeded}đ ➔`;
  shadow.appendChild(badge);

  const panel = document.createElement('div');
  panel.className = 'panel';
  if (isPanelOpenState) {
    panel.classList.add('open');
  }

  panel.innerHTML = `
    <div class="panel-header">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0; font-size:15px; font-weight:600;">HUST ĐRL Helper (20261)</h3>
        <button id="close-btn" style="background:none; border:none; color:white; font-size:18px; cursor:pointer;">✕</button>
      </div>
      <div style="margin-top:8px; font-size:22px; font-weight:bold;">${analysis.currentScore} / 100đ (${analysis.rank})</div>
      <div style="font-size:12px; margin-top:2px; opacity:0.9;">Cần thêm ${analysis.scoreNeeded}đ để đạt mốc ${analysis.targetScore}đ</div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
      </div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn ${activeTabIdState === 'tab-roadmap' ? 'active' : ''}" data-tab="tab-roadmap">Gợi ý Lộ trình</button>
      <button class="tab-btn ${activeTabIdState === 'tab-all' ? 'active' : ''}" data-tab="tab-all">63 Tiêu chí</button>
      <button class="tab-btn ${activeTabIdState === 'tab-tips' ? 'active' : ''}" data-tab="tab-tips">Mẹo nộp MC</button>
    </div>

    <div class="panel-body">
      <!-- Tab 1: Roadmap -->
      <div id="tab-roadmap" class="tab-content ${activeTabIdState === 'tab-roadmap' ? 'active' : ''}">
        <p style="font-size:12px; color:#475569; margin-top:0;">Các tiêu chí ưu tiên làm để đạt mốc ${analysis.targetScore}đ:</p>
        ${(analysis.roadmapItems || []).map(item => `
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="font-weight:bold; font-size:13px; color:#1e293b; flex:1;">${item.name}</div>
              <span style="font-size:12px; font-weight:bold; color:#15803d; background:#dcfce7; padding:2px 6px; border-radius:4px; margin-left:6px;">+${item.effectiveGain || item.maxPoint}đ</span>
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:4px;">Level ${item.level} • ${item.proofType === 'auto' ? 'Tự động cộng' : 'Cần nộp MC'}</div>
            <div style="margin-top:6px; display:flex; gap:6px;">
              <button class="btn-scroll" data-cid="${item.id}">Kéo tới mục</button>
              <button class="btn-toggle-check" data-cid="${item.id}" style="background:#15803d; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">Đánh dấu đã làm</button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Tab 2: All 63 Criteria Interactive Checklist -->
      <div id="tab-all" class="tab-content ${activeTabIdState === 'tab-all' ? 'active' : ''}">
        <p style="font-size:12px; color:#64748b; margin-top:0;">Danh sách toàn bộ 63 tiêu chí (tích chọn để thử điểm):</p>
        
        <div class="level-header">Level 1: Tự động / Bắt buộc (11 mục)</div>
        <div id="level-1-list"></div>

        <div class="level-header">Level 2: Mức Dễ (13 mục)</div>
        <div id="level-2-list"></div>

        <div class="level-header">Level 3: Trung Bình (20 mục)</div>
        <div id="level-3-list"></div>

        <div class="level-header">Level 4: Khó / Khen thưởng (14 mục)</div>
        <div id="level-4-list"></div>
      </div>

      <!-- Tab 3: Tips -->
      <div id="tab-tips" class="tab-content ${activeTabIdState === 'tab-tips' ? 'active' : ''}">
        <div class="card">
          <b>Hiến máu nhân đạo (+6đ)</b>
          <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Chụp rõ ảnh Giấy chứng nhận hiến máu hoặc mã QR trên ứng dụng Hiến máu.</p>
        </div>
        <div class="card">
          <b>Thể dục nâng cao sức khỏe (+4đ)</b>
          <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Nộp ảnh kết quả chạy bộ từ ứng dụng Strava, VietRace365 hoặc chứng nhận BKRun.</p>
        </div>
        <div class="card">
          <b>Khảo sát sinh viên (+3đ)</b>
          <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Thực hiện khảo sát đánh giá giảng dạy trực tuyến trên eHUST/iCTSV.</p>
        </div>
        <div class="card">
          <b>Khóa học kỹ năng bổ trợ / nghề nghiệp (+6đ)</b>
          <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Tải lên chứng chỉ hoàn thành khóa đào tạo kỹ năng do Trường/Khoa hoặc đơn vị hợp tác tổ chức.</p>
        </div>
        <div class="card">
          <b>Chứng chỉ Ngoại ngữ TOEIC 600+ (+6đ)</b>
          <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Tải ảnh chụp chứng chỉ quốc tế còn thời hạn lên hệ thống.</p>
        </div>
        <div class="card">
          <b>Thực tập sinh doanh nghiệp (>30 ngày) (+6đ)</b>
          <p style="font-size:12px; color:#475569; margin:4px 0 0 0;">Nộp Giấy xác nhận thực tập từ doanh nghiệp có đóng dấu hợp pháp.</p>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(panel);

  // Tab Navigation logic
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

  // Render All Items checklist inside Tab 2
  const levelLists = {
    1: shadow.getElementById('level-1-list'),
    2: shadow.getElementById('level-2-list'),
    3: shadow.getElementById('level-3-list'),
    4: shadow.getElementById('level-4-list')
  };

  (analysis.allItems || []).forEach(item => {
    const listEl = levelLists[item.level] || levelLists[3];
    if (listEl) {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <input type="checkbox" data-cid="${item.id}" ${item.isAchieved ? 'checked' : ''} style="cursor:pointer; margin-top:2px;">
        <div style="flex:1;">
          <div style="font-size:12px; font-weight:600; color:#334155;">${item.name}</div>
          <div style="font-size:11px; color:#64748b;">Điểm: +${item.maxPoint}đ (${item.isAchieved ? 'Đã đạt' : 'Chưa đạt'})</div>
        </div>
      `;
      listEl.appendChild(row);
    }
  });

  // Checkbox live score toggle event handler
  shadow.querySelectorAll('input[type="checkbox"], .btn-toggle-check').forEach(element => {
    element.onclick = (e) => {
      const cid = parseInt(e.target.getAttribute('data-cid'));
      toggleItemAchievedState(cid);
    };
  });

  // Toggle & Close Panel
  badge.onclick = () => {
    isPanelOpenState = !panel.classList.contains('open');
    panel.classList.toggle('open');
  };

  shadow.getElementById('close-btn').onclick = () => {
    isPanelOpenState = false;
    panel.classList.remove('open');
  };

  // Scroll to element button
  shadow.querySelectorAll('.btn-scroll').forEach(btn => {
    btn.onclick = (e) => {
      const cid = e.target.getAttribute('data-cid');
      scrollToCriteriaOnPage(cid);
    };
  });
}

function toggleItemAchievedState(cId) {
  if (!currentRawData) return;

  for (const ct of currentRawData.CriteriaTypeDetailsLst || []) {
    for (const cg of ct.CriteriaGroupDetailsLst || []) {
      for (const c of cg.UserCriteriaDetailsLst || []) {
        if (c.CId === cId) {
          if (c.UCPoint > 0) {
            c.UCPoint = 0.0;
            c.TCPoint = 0.0;
          } else {
            c.UCPoint = c.CMaxPoint;
            c.TCPoint = c.CMaxPoint;
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

  const analyzer = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : (typeof window !== 'undefined' ? window.analyzeConductScore : null);
  if (analyzer) {
    const updatedAnalysis = analyzer(currentRawData);
    renderHustDrlPanel(updatedAnalysis, currentRawData);

    // Save to Extension storage
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SAVE_DRL_DATA', payload: updatedAnalysis });
    }
  }
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
