function renderPopupContent(data) {
  const contentEl = document.getElementById('popup-content');
  if (!contentEl) return;

  if (!data) {
    contentEl.innerHTML = `
      <div style="text-align:center; padding:6px 0;">
        <p style="font-size:13px; color:#64748b; margin-bottom:6px;">Chưa có dữ liệu từ trang iCTSV.</p>
        <p style="font-size:12px; color:#94a3b8; margin:0;">Vui lòng mở trang iCTSV để tự động trích xuất điểm.</p>
      </div>
    `;
    return;
  }

  const targetRankTitle = data.targetRankName || 'Khá';
  const popupTargetText = data.currentScore >= 90
    ? `Đã đạt Xuất sắc (<b>${data.currentScore}/100đ</b>)`
    : `Cần thêm <b>${data.scoreNeeded}đ</b> để đạt mốc <b>${targetRankTitle} (${data.targetScore}đ)</b>.`;
  const roadmapCount = (data.roadmapItems || []).length;
  let roadmapSummary = 'Chưa có tiêu chí gợi ý giúp tăng điểm.';
  if (roadmapCount > 0) {
    roadmapSummary = `Có <b>${roadmapCount} tiêu chí gợi ý</b> trong widget trên iCTSV.`;
    if (Number.isFinite(data.projectedScore)) {
      roadmapSummary += ` Điểm dự kiến nếu hoàn thành là <b>${data.projectedScore}/100đ</b>.`;
    }
  }

  contentEl.innerHTML = `
    <div class="score-badge">${data.currentScore} / 100đ (${data.rank})</div>
    <p style="font-size:13px; color:#475569; margin-top:8px;">
      ${popupTargetText}
    </p>
    ${data.currentScore < 90 ? `
      <div style="font-size:12px; background:#f1f5f9; border:1px solid #e2e8f0; padding:8px 10px; border-radius:8px; margin-top:8px;">
        ${roadmapSummary}
      </div>
    ` : ''}
  `;
}

function initPopup() {
  const toggleEl = document.getElementById('widget-toggle');

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['isWidgetEnabled'], (res) => {
      const isEnabled = res.isWidgetEnabled !== undefined ? res.isWidgetEnabled : true;
      if (toggleEl) toggleEl.checked = isEnabled;
    });
  }

  if (toggleEl) {
    toggleEl.onchange = (e) => {
      const enabled = e.target.checked;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ isWidgetEnabled: enabled });
      }
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'TOGGLE_WIDGET_VISIBILITY', enabled });
      }
    };
  }

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'GET_DRL_DATA' }, (response) => {
      if (response && response.payload) {
        renderPopupContent(response.payload);
      } else {
        renderPopupContent(null);
      }
    });
  } else {
    renderPopupContent(null);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initPopup);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initPopup, renderPopupContent };
}
