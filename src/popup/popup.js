function renderPopupContent(data) {
  const contentEl = document.getElementById('popup-content');
  if (!contentEl) return;

  if (!data) {
    contentEl.innerHTML = `
      <div style="text-align:center; padding:10px 0;">
        <p style="font-size:13px; color:#64748b; margin-bottom:12px;">Chưa có dữ liệu từ trang iCTSV.</p>
        <p style="font-size:12px; color:#94a3b8;">Bấm nút bên dưới để trải nghiệm ngay với dữ liệu mẫu Kỳ 20261!</p>
      </div>
    `;
    return;
  }

  contentEl.innerHTML = `
    <div class="score-badge">${data.currentScore} / 100đ (${data.rank})</div>
    <p style="font-size:13px; color:#475569; margin-top:8px;">
      Cần thêm <b>${data.scoreNeeded}đ</b> để đạt mốc <b>${data.targetScore}đ (${data.targetScore >= 90 ? 'Xuất sắc' : data.targetScore >= 80 ? 'Giỏi' : 'Khá'})</b>.
    </p>
    <div style="font-size:12px; background:#f1f5f9; border:1px solid #e2e8f0; padding:10px; border-radius:8px; margin-top:10px;">
      🚀 Đã chọn sẵn <b>${(data.roadmapItems || []).length} mục tối ưu nhất</b> trên trang iCTSV!
    </div>
  `;
}

function initPopup() {
  const demoBtn = document.getElementById('btn-demo');

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

  if (demoBtn) {
    demoBtn.onclick = () => {
      const sampleJson = typeof sampleDrlRawJson !== 'undefined' ? sampleDrlRawJson : null;
      const analyzer = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : null;

      if (sampleJson && analyzer) {
        const analysis = analyzer(sampleJson);
        renderPopupContent(analysis);

        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({ type: 'SAVE_DRL_DATA', payload: analysis });
        }
      }
    };
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initPopup);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initPopup, renderPopupContent };
}
