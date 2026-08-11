// src/core/criteria_db.js

var DEFAULT_LEVEL_1_FREE = new Set([114, 115, 116, 117, 118, 119, 129, 140, 149, 170, 171]);
var DEFAULT_LEVEL_2_EASY = new Set([120, 122, 123, 125, 133, 134, 135, 141, 142, 143, 144, 146, 152]);
var DEFAULT_LEVEL_3_MEDIUM = new Set([121, 124, 128, 130, 131, 132, 136, 137, 138, 139, 145, 147, 148, 150, 151, 153, 157, 161, 162, 163]);
var DEFAULT_LEVEL_4_HARD = new Set([126, 127, 154, 155, 156, 158, 159, 160, 164, 165, 166, 167, 168, 169]);
var LEVEL_PENALTY = new Set([172, 173, 174, 175, 176]);

var CRITERIA_DB = {};
for (let id = 114; id <= 176; id++) {
  CRITERIA_DB[id] = true;
}

function getDefaultLevel(id) {
  if (DEFAULT_LEVEL_1_FREE.has(id)) return 1;
  if (DEFAULT_LEVEL_2_EASY.has(id)) return 2;
  if (DEFAULT_LEVEL_3_MEDIUM.has(id)) return 3;
  if (DEFAULT_LEVEL_4_HARD.has(id)) return 4;
  if (LEVEL_PENALTY.has(id)) return 0;
  return 3;
}

function getCustomTiers() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('hust_drl_custom_tiers');
      if (stored) return JSON.parse(stored);
    }
  } catch (e) {}
  return {};
}

function saveCustomTiers(customTiers) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hust_drl_custom_tiers', JSON.stringify(customTiers));
    }
  } catch (e) {}
}

function setCustomLevel(cId, newLevel) {
  const custom = getCustomTiers();
  custom[cId] = parseInt(newLevel);
  saveCustomTiers(custom);
}

function resetCustomLevels() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('hust_drl_custom_tiers');
    }
  } catch (e) {}
}

function getCriteriaMeta(cId) {
  if (!CRITERIA_DB[cId]) {
    return { id: cId, level: 3, proofType: 'proof', tips: '', defaultMaxPoint: 0 };
  }

  const customTiers = getCustomTiers();
  let level = customTiers[cId] !== undefined ? customTiers[cId] : getDefaultLevel(cId);

  let proofType = 'proof';
  let tips = 'Nộp minh chứng hình ảnh/xác nhận lên hệ thống iCTSV';
  let defaultMaxPoint = (cId === 114 || cId === 115 || cId === 117 || cId === 118 || cId === 119 || cId === 124 || cId === 126 || cId === 127 || cId === 128 || cId === 129 || cId === 130 || cId === 131 || cId === 132 || cId === 136 || cId === 137 || cId === 138 || cId === 139 || cId === 143 || cId === 145 || cId === 154 || cId === 155 || cId === 156 || cId === 157 || cId === 158 || cId === 161 || cId === 170) ? 6.0 : (cId === 116 || cId === 135 || cId === 146 || cId === 147 || cId === 148 || cId === 151 || cId === 152 || cId === 153 || cId === 159 || cId === 162 || cId === 171) ? 4.0 : (cId === 120 || cId === 121 || cId === 122 || cId === 123 || cId === 125 || cId === 133 || cId === 134 || cId === 140 || cId === 141 || cId === 142 || cId === 144 || cId === 149 || cId === 150 || cId === 160 || cId === 163) ? 3.0 : (cId === 168 || cId === 169) ? 8.0 : (cId === 166 || cId === 167) ? 10.0 : cId === 165 ? 12.0 : cId === 164 ? 15.0 : 0;

  if (level === 1) {
    proofType = 'auto';
    tips = 'Mục tự động hoặc thực hiện qua bài test/khai báo trực tuyến';
  } else if (level === 2) {
    proofType = 'proof';
    tips = 'Mục dễ lấy điểm, chỉ cần quét mã QR hoặc nộp ảnh chứng nhận đơn giản';
  } else if (level === 3) {
    proofType = 'proof';
    tips = 'Yêu cầu quá trình rèn luyện, chứng chỉ ngoại ngữ, khóa kỹ năng hoặc tham gia CLB';
  } else if (level === 4) {
    proofType = 'proof';
    tips = 'Yêu cầu chức vụ Ban cán sự/Đoàn Hội, giải thưởng NCKH, Olympic hoặc bằng khen';
  } else if (level === 0) {
    proofType = 'penalty';
    tips = 'Mục điểm trừ do vi phạm quy chế hoặc kỷ luật';
  }

  return { id: cId, level, proofType, tips, defaultMaxPoint };
}

if (typeof window !== 'undefined') {
  window.CRITERIA_DB = CRITERIA_DB;
  window.getCriteriaMeta = getCriteriaMeta;
  window.setCustomLevel = setCustomLevel;
  window.resetCustomLevels = resetCustomLevels;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRITERIA_DB, getCriteriaMeta, setCustomLevel, resetCustomLevels };
}
