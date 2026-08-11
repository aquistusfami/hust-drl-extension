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
      ${(analysis.roadmapItems || []).map(item => `
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
