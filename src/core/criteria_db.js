const path = require('path');
const fs = require('fs');

const LEVEL_1_FREE = new Set([114, 115, 116, 117, 118, 119, 129, 140, 149, 170, 171]);
const LEVEL_2_EASY = new Set([120, 122, 123, 125, 133, 134, 135, 141, 142, 143, 144, 146, 152]);
const LEVEL_3_MEDIUM = new Set([121, 124, 128, 130, 131, 132, 136, 137, 138, 139, 145, 147, 148, 150, 151, 153, 157, 161, 162, 163]);
const LEVEL_4_HARD = new Set([126, 127, 154, 155, 156, 158, 159, 160, 164, 165, 166, 167, 168, 169]);
const LEVEL_PENALTY = new Set([172, 173, 174, 175, 176]);

// Map CMaxPoints from raw JSON if available
const rawMaxPoints = {};
try {
  let rawData;
  const rawPath = path.resolve(__dirname, '../../drl_20261_raw.json');
  if (fs.existsSync(rawPath)) {
    rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  } else {
    try { rawData = require('../../drl_20261_raw.json'); } catch (e) {}
  }
  if (rawData && Array.isArray(rawData.CriteriaTypeDetailsLst)) {
    rawData.CriteriaTypeDetailsLst.forEach(ct => {
      if (Array.isArray(ct.CriteriaGroupDetailsLst)) {
        ct.CriteriaGroupDetailsLst.forEach(cg => {
          if (Array.isArray(cg.UserCriteriaDetailsLst)) {
            cg.UserCriteriaDetailsLst.forEach(uc => {
              if (uc.CId !== undefined) {
                rawMaxPoints[uc.CId] = uc.CMaxPoint;
              }
            });
          }
        });
      }
    });
  }
} catch (e) {
  // Ignore error if raw json is not loaded
}

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

  const defaultMaxPoint = rawMaxPoints[id] !== undefined ? rawMaxPoints[id] : 0;
  CRITERIA_DB[id] = { id, level, defaultMaxPoint, proofType, tips };
}

function getCriteriaMeta(cId) {
  return CRITERIA_DB[cId] || { id: cId, level: 3, defaultMaxPoint: 0, proofType: 'proof', tips: '' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRITERIA_DB, getCriteriaMeta };
}
