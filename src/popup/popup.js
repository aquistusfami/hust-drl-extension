function initPopup() {
  const contentEl = document.getElementById('popup-content');
  if (!contentEl) return;

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ type: 'GET_DRL_DATA' }, (response) => {
      if (response && response.payload) {
        const data = response.payload;
        const count = data.roadmapItems ? data.roadmapItems.length : 0;
        contentEl.innerHTML = `
          <div class="score-badge">${data.currentScore} / 100đ (${data.rank})</div>
          <p style="font-size:13px; color:#475569; margin-top:8px;">
            Cần thêm <b>${data.scoreNeeded}đ</b> để đạt mốc <b>${data.targetScore}đ</b>.
          </p>
          <div style="font-size:12px; background:#f8fafc; padding:8px; border-radius:6px; margin-top:8px;">
            🚀 Đã chọn sẵn ${count} mục tối ưu nhất trên trang iCTSV!
          </div>
        `;
      } else {
        contentEl.innerHTML = `<p style="font-size:13px; color:#64748b;">Chưa có dữ liệu. Vui lòng mở trang iCTSV để tự động trích xuất điểm.</p>`;
      }
    });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initPopup);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initPopup };
}
