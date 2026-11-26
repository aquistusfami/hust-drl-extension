// src/content/injected_panel.js

let currentAnalysisState = null;
let currentRawData = null;
let isPanelOpenState = false;
let activeTabIdState = 'tab-roadmap';
let publicActivitySnapshot = null;
let activityDataState = 'idle';
let focusedActivityCriterion = null;

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
  const targetRankTitle = analysis.targetRankName || 'Khá';
  const targetText = analysis.currentScore >= 90 
    ? `Đã đạt Xuất sắc (${analysis.currentScore}/100đ)` 
    : `Cần thêm ${analysis.scoreNeeded}đ để đạt mốc ${targetRankTitle} (${analysis.targetScore}đ)`;
  const badgeText = analysis.currentScore >= 90 
    ? `HUST ĐRL: ${analysis.currentScore}đ (XUẤT SẮC)` 
    : `HUST ĐRL: ${analysis.currentScore}đ (${analysis.rank.toUpperCase()}) | +${analysis.scoreNeeded}đ lên ${targetRankTitle} ➔`;

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
      .roadmap-category {
        border-top: 1px solid #e2e8f0;
        margin-bottom: 12px;
        padding-top: 9px;
      }
      .roadmap-category-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 6px;
      }
      .roadmap-category h3 { margin: 0; color: #0f172a; font-size: 13px; }
      .roadmap-category-score { color: #334155; font-size: 12px; white-space: nowrap; }
      .roadmap-category-empty { margin: 0; color: #475569; font-size: 12px; }
      .btn-scroll {
        background: #2563eb;
        color: white;
        border: none;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
      }
      .activity-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px 8px;
        margin-bottom: 10px;
        color: #475569;
        font-size: 12px;
      }
      .activity-toolbar[hidden] { display: none; }
      .activity-toolbar a { color: #1d4ed8; }
      .criterion-activities { margin-top: 8px; color: #475569; font-size: 12px; line-height: 1.45; }
      .criterion-activities ul { margin: 3px 0 0; padding-left: 16px; }
      .criterion-activities a { color: #1d4ed8; overflow-wrap: anywhere; }
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
      .group-header.lvl-0 { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }

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
      .item-status.penalty {
        color: #dc2626;
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
      .item-points.penalty {
        color: #b91c1c;
        background: #fef2f2;
        border: 1px solid #fca5a5;
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
        <div id="header-target" style="font-size:12px; margin-top:2px; opacity:0.9;">Cần thêm 70đ để đạt mốc Khá (70đ)</div>
        <div class="progress-bar-bg">
          <div id="header-progress" class="progress-bar-fill" style="width: 0%;"></div>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab-btn active" data-tab="tab-roadmap">Gợi ý Lộ trình</button>
        <button class="tab-btn" data-tab="tab-all">Tiêu chí</button>
        <button class="tab-btn" data-tab="tab-tips">Mẹo nộp MC</button>
      </div>

      <div class="panel-body">
        <!-- Tab 1: Roadmap -->
        <div id="tab-roadmap" class="tab-content active">
          <div id="roadmap-content"></div>
          <div class="activity-toolbar" ${window.location.hostname === 'ctsv.hust.edu.vn' ? '' : 'hidden'}>
            <span id="activity-status" role="status"></span>
            <a href="https://ctsv.hust.edu.vn/danh-sach-su-kien/" target="_blank" rel="noopener noreferrer">Xem sự kiện trên iCTSV</a>
          </div>
          <div id="roadmap-items"></div>
        </div>

        <!-- Tab 2: All Criteria Interactive Checklist & Tier Customizer -->
        <div id="tab-all" class="tab-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:12px; color:#475569; font-weight:500;">Bảng Tiêu chí rèn luyện</span>
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

          <div class="group-section" style="border-color:#fca5a5;">
            <div class="group-header lvl-0">
              <span>Mục vi phạm kỷ luật (Điểm trừ)</span>
              <span id="count-lvl-0" class="group-count" style="color:#991b1b; background:#fee2e2;">0 tiêu chí</span>
            </div>
            <div id="level-0-list"></div>
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
      if (isPanelOpenState) loadBundledActivities(shadow);
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
    badgeEl.innerHTML = badgeText;
  }

  const panelEl = shadow.querySelector('.panel');
  if (panelEl) {
    panelEl.classList.toggle('open', isPanelOpenState);
  }

  const scoreEl = shadow.getElementById('header-score');
  if (scoreEl) scoreEl.textContent = `${analysis.currentScore} / 100đ (${analysis.rank})`;

  const targetEl = shadow.getElementById('header-target');
  if (targetEl) targetEl.textContent = targetText;

  const progressEl = shadow.getElementById('header-progress');
  if (progressEl) progressEl.style.width = `${progressPercent}%`;

  const roadmapContainer = shadow.getElementById('roadmap-items');
  if (roadmapContainer) {
    const roadmapItems = analysis.roadmapItems || [];
    const projectedScore = analysis.projectedScore;
    let roadmapStatus = `Các tiêu chí ưu tiên để đạt mốc ${targetRankTitle} (${analysis.targetScore}đ).`;
    if (analysis.currentScore >= 90) {
      roadmapStatus = 'Bạn đã đạt xếp loại cao nhất.';
    } else if (roadmapItems.length === 0) {
      roadmapStatus = 'Chưa có tiêu chí gợi ý giúp tăng điểm.';
    } else if (Number.isFinite(projectedScore)) {
      const remaining = Math.max(0, analysis.targetScore - projectedScore);
      roadmapStatus = `Nếu hoàn thành các tiêu chí dưới đây, điểm dự kiến là ${projectedScore}/100đ.`;
      roadmapStatus += remaining > 0
        ? ` Còn thiếu ${remaining}đ để đạt mốc ${targetRankTitle}.`
        : ` Đủ mốc ${targetRankTitle}.`;
    }

    shadow.getElementById('roadmap-content').innerHTML = `
      <p style="font-size:12px; color:#475569; margin-top:0; margin-bottom:10px;" role="status">${roadmapStatus}</p>
      ${analysis.penaltyDeductions > 0 ? `<p class="roadmap-category-empty">Điểm trừ hiện tại: ${analysis.penaltyDeductions}đ.</p>` : ''}
    `;
    const renderCards = items => items.map(item => `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="font-weight:600; font-size:13px; color:#0f172a; flex:1;">${item.name}</div>
            <span style="font-size:12px; font-weight:700; color:#15803d; background:#dcfce7; padding:2px 6px; border-radius:4px; margin-left:6px;">+${item.effectiveGain ?? item.maxPoint}đ</span>
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:4px;">Level ${item.level} • ${item.proofType === 'auto' ? 'Tự động cộng điểm' : 'Cần nộp minh chứng'}</div>
          ${item.effectiveGain < item.maxPoint ? `<div style="font-size:11px; color:#64748b;">Tối đa ${item.maxPoint}đ. Điểm cộng dự kiến bị giới hạn bởi trần nhóm hoặc mục.</div>` : ''}
          <div class="criterion-activities" data-criterion-activities="${item.id}" hidden></div>
          <div style="margin-top:8px; display:flex; gap:6px;">
            <button class="btn-scroll" data-cid="${item.id}">Kéo tới mục</button>
            <button class="btn-toggle-check" data-cid="${item.id}" style="background:#15803d; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">Thử tính điểm</button>
          </div>
        </div>
      `).join('');

    roadmapContainer.replaceChildren();
    const categoryScores = analysis.categoryScores || [];
    for (const category of categoryScores) {
      const section = document.createElement('section');
      section.className = 'roadmap-category';
      section.innerHTML = '<div class="roadmap-category-header"><h3></h3><span class="roadmap-category-score"></span></div>';
      section.querySelector('h3').textContent = category.name || 'Điểm theo mục';
      const score = section.querySelector('.roadmap-category-score');
      if (category.currentScore !== null) {
        score.textContent = category.plannedGain > 0
          ? `${category.currentScore} → ${category.currentScore + category.plannedGain}/${category.maxScore}đ`
          : `${category.currentScore}/${category.maxScore}đ`;
      }
      const items = roadmapItems.filter(item => item.ctId === category.id);
      if (items.length) {
        section.insertAdjacentHTML('beforeend', renderCards(items));
      } else {
        const message = document.createElement('p');
        message.className = 'roadmap-category-empty';
        message.textContent = category.currentScore === null
          ? `Chưa có dữ liệu · Trần ${category.maxScore}đ`
          : category.currentScore >= category.maxScore ? 'Đã đạt trần' : 'Chưa có tiêu chí trong lộ trình này';
        section.append(message);
      }
      roadmapContainer.append(section);
    }
    if (!categoryScores.length) roadmapContainer.innerHTML = renderCards(roadmapItems);
  }

  // Update Tab Criteria lists in-place including Level 0 penalties
  const itemsByLevel = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  (analysis.allItems || []).forEach(item => {
    const lvl = itemsByLevel[item.level] !== undefined ? item.level : 3;
    itemsByLevel[lvl].push(item);
  });

  const levelLists = {
    0: shadow.getElementById('level-0-list'),
    1: shadow.getElementById('level-1-list'),
    2: shadow.getElementById('level-2-list'),
    3: shadow.getElementById('level-3-list'),
    4: shadow.getElementById('level-4-list')
  };

  for (let l = 0; l <= 4; l++) {
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
              <span class="item-status ${item.isAchieved ? (l === 0 ? 'penalty' : 'achieved') : ''}">${item.isAchieved ? (l === 0 ? 'Vi phạm' : 'Đã đạt') : 'Chưa đạt'}</span>
              ${l > 0 ? `
                <select class="select-priority" data-cid="${item.id}">
                  <option value="1" ${item.level === 1 ? 'selected' : ''}>Ưu tiên: Cao</option>
                  <option value="2" ${item.level === 2 ? 'selected' : ''}>Ưu tiên: Dễ</option>
                  <option value="3" ${item.level === 3 ? 'selected' : ''}>Ưu tiên: Thường</option>
                  <option value="4" ${item.level === 4 ? 'selected' : ''}>Ưu tiên: Khó</option>
                </select>
              ` : ''}
            </div>
            <div class="criterion-activities" data-criterion-activities="${item.id}" hidden></div>
          </div>
          <span class="item-points ${l === 0 ? 'penalty' : (item.isAchieved ? 'achieved' : '')}">${l === 0 ? '-' : '+'}${item.maxPoint || 10}đ</span>
        </div>
      `).join('');
    }
  }

  showPublishedActivities(shadow);

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

async function loadBundledActivities(shadow) {
  const status = shadow.getElementById('activity-status');
  if (status.parentElement.hidden || activityDataState === 'loading' || activityDataState === 'ready') return;

  activityDataState = 'loading';
  showPublishedActivities(shadow);
  try {
    publicActivitySnapshot = await readPublicActivitySnapshot();
    activityDataState = 'ready';
  } catch {
    publicActivitySnapshot = null;
    activityDataState = 'error';
  }
  showPublishedActivities(document.getElementById('hust-drl-helper-root')?.shadowRoot ?? shadow);
}

function showPublishedActivities(shadow) {
  const status = shadow.getElementById('activity-status');
  const byCriterion = publicActivitySnapshot
    ? indexCurrentActivities(publicActivitySnapshot.activities, currentAnalysisState.allItems || [])
    : new Map();
  if (publicActivitySnapshot) {
    const updated = new Date(publicActivitySnapshot.updatedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    status.textContent = `Dữ liệu sự kiện ngày ${updated}.`;
  } else if (activityDataState !== 'idle') {
    status.textContent = activityDataState === 'loading' ? 'Đang đọc dữ liệu hoạt động…' : 'Chưa đọc được dữ liệu hoạt động đi kèm.';
  }

  shadow.querySelectorAll('[data-criterion-activities]').forEach(slot => {
    const matches = byCriterion.get(slot.dataset.criterionActivities);
    slot.replaceChildren();
    slot.removeAttribute('role');
    slot.hidden = !matches?.size;
    if (slot.hidden) {
      if (slot.dataset.criterionActivities !== focusedActivityCriterion || !slot.closest('#tab-all')) return;

      const messages = {
        loading: 'Đang đọc dữ liệu hoạt động…',
        ready: 'Bản dữ liệu chưa có hoạt động sắp hoặc đang diễn ra cho tiêu chí này.',
        error: 'Chưa đọc được dữ liệu hoạt động đi kèm.'
      };
      const message = messages[activityDataState];
      if (message) {
        slot.setAttribute('role', 'status');
        slot.textContent = message;
        slot.hidden = false;
      }
      return;
    }

    const list = document.createElement('ul');
    for (const activity of matches.values()) {
      const entry = document.createElement('li');
      const link = document.createElement('a');
      link.href = `https://ctsv.hust.edu.vn/hoat-dong/${activity.id}/chi-tiet`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = activity.name;
      entry.append(link);
      list.append(entry);
    }
    slot.append('Hoạt động sắp hoặc đang diễn ra', list);
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
  // 1. Scroll inside Injected Panel (Tab Tiêu chí)
  const root = document.getElementById('hust-drl-helper-root');
  if (root && root.shadowRoot) {
    const shadow = root.shadowRoot;

    // Switch active tab to 'tab-all' (Tiêu chí)
    const tabBtns = shadow.querySelectorAll('.tab-btn');
    const tabContents = shadow.querySelectorAll('.tab-content');
    tabBtns.forEach(b => {
      if (b.getAttribute('data-tab') === 'tab-all') b.classList.add('active');
      else b.classList.remove('active');
    });
    tabContents.forEach(c => {
      if (c.id === 'tab-all') c.classList.add('active');
      else c.classList.remove('active');
    });
    activeTabIdState = 'tab-all';

    // Find the item row in the panel and scroll to it
    const rowEl = shadow.querySelector(`.chk-item[data-cid="${cId}"]`)?.closest('.item-row');
    if (rowEl) {
      focusedActivityCriterion = String(cId);
      if (activityDataState === 'idle' || activityDataState === 'error') loadBundledActivities(shadow);
      else showPublishedActivities(shadow);
      if (typeof rowEl.scrollIntoView === 'function') {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const origBg = rowEl.style.backgroundColor;
      rowEl.style.transition = 'background-color 0.4s ease';
      rowEl.style.backgroundColor = '#fef08a';
      setTimeout(() => {
        rowEl.style.backgroundColor = origBg;
      }, 2500);
    }
  }

  // 2. Scroll on the main iCTSV webpage to the EXACT leaf criteria text element
  if (!currentAnalysisState || !currentAnalysisState.allItems) return;
  const item = currentAnalysisState.allItems.find(i => i.id == cId);
  if (!item || !item.name) return;

  const cname = item.name.trim();
  const searchPrefix = cname.substring(0, Math.min(18, cname.length));

  // Check if already tagged or has explicit attribute
  let exactTarget = document.querySelector(`[data-hust-cid="${cId}"], [data-cid="${cId}"]`);

  if (!exactTarget) {
    // Find deepest leaf element on page matching searchPrefix
    const allNodes = Array.from(document.querySelectorAll('td, th, span, div, p, label, b, strong, a'));
    let maxDepth = -1;

    for (const node of allNodes) {
      if (node.closest('#hust-drl-helper-root')) continue;

      const directText = Array.from(node.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .join(' ');

      const fullText = (node.innerText || node.textContent || '').trim();

      if (directText && directText.includes(searchPrefix)) {
        exactTarget = node;
        break;
      }

      if (fullText.includes(searchPrefix)) {
        let depth = 0;
        let curr = node;
        while (curr.parentElement) { depth++; curr = curr.parentElement; }

        if (depth > maxDepth && node.children.length <= 2) {
          maxDepth = depth;
          exactTarget = node;
        }
      }
    }
  }

  if (exactTarget) {
    if (typeof exactTarget.scrollIntoView === 'function') {
      exactTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const origBg = exactTarget.style.backgroundColor;
    exactTarget.style.transition = 'background-color 0.4s ease';
    exactTarget.style.backgroundColor = '#fef08a';
    setTimeout(() => {
      exactTarget.style.backgroundColor = origBg;
    }, 2500);
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
