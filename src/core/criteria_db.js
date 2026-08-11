// src/core/criteria_db.js

var LEVEL_1_FREE = new Set([114, 115, 116, 117, 118, 119, 129, 140, 149, 170, 171]);
var LEVEL_2_EASY = new Set([120, 122, 123, 125, 133, 134, 135, 141, 142, 143, 144, 146, 152]);
var LEVEL_3_MEDIUM = new Set([121, 124, 128, 130, 131, 132, 136, 137, 138, 139, 145, 147, 148, 150, 151, 153, 157, 161, 162, 163]);
var LEVEL_4_HARD = new Set([126, 127, 154, 155, 156, 158, 159, 160, 164, 165, 166, 167, 168, 169]);
var LEVEL_PENALTY = new Set([172, 173, 174, 175, 176]);

var CRITERIA_DB = {};

// Map 63 criteria IDs 114 to 176
for (let id = 114; id <= 176; id++) {
  let level = 3;
  let proofType = 'proof';
  let tips = 'Nộp minh chứng hình ảnh/xác nhận lên hệ thống iCTSV';
  let defaultMaxPoint = (id === 114 || id === 115 || id === 117 || id === 118 || id === 119 || id === 124 || id === 126 || id === 127 || id === 128 || id === 129 || id === 130 || id === 131 || id === 132 || id === 136 || id === 137 || id === 138 || id === 139 || id === 143 || id === 145 || id === 154 || id === 155 || id === 156 || id === 157 || id === 158 || id === 161 || id === 170) ? 6.0 : (id === 116 || id === 135 || id === 146 || id === 147 || id === 148 || id === 151 || id === 152 || id === 153 || id === 159 || id === 162 || id === 171) ? 4.0 : (id === 120 || id === 121 || id === 122 || id === 123 || id === 125 || id === 133 || id === 134 || id === 140 || id === 141 || id === 142 || id === 144 || id === 149 || id === 150 || id === 160 || id === 163) ? 3.0 : (id === 168 || id === 169) ? 8.0 : (id === 166 || id === 167) ? 10.0 : id === 165 ? 12.0 : id === 164 ? 15.0 : 0;

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

  CRITERIA_DB[id] = { id, level, proofType, tips, defaultMaxPoint };
}

function getCriteriaMeta(cId) {
  return CRITERIA_DB[cId] || { id: cId, level: 3, proofType: 'proof', tips: '', defaultMaxPoint: 0 };
}

if (typeof window !== 'undefined') {
  window.CRITERIA_DB = CRITERIA_DB;
  window.getCriteriaMeta = getCriteriaMeta;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRITERIA_DB, getCriteriaMeta };
}
