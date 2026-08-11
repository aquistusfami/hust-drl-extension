const { getCriteriaMeta } = require('./criteria_db');

function getRankName(score) {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Giỏi';
  if (score >= 70) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Yếu';
}

function getNextTarget(score) {
  if (score < 70) return 70;
  if (score < 80) return 80;
  if (score < 90) return 90;
  return 100;
}

function analyzeConductScore(rawJson) {
  let totalScore = 0;
  const items = [];

  if (rawJson && rawJson.CriteriaTypeDetailsLst) {
    for (const ct of rawJson.CriteriaTypeDetailsLst) {
      for (const cg of ct.CriteriaGroupDetailsLst || []) {
        for (const c of cg.UserCriteriaDetailsLst || []) {
          const cid = c.CId;
          const cname = c.CName;
          const userPoint = c.UCPoint || c.TCPoint || 0;
          const maxPoint = c.CMaxPoint || 0;
          const meta = getCriteriaMeta(cid);

          totalScore += userPoint;

          items.push({
            id: cid,
            name: cname,
            userPoint: userPoint,
            maxPoint: maxPoint,
            isAchieved: userPoint > 0,
            level: meta.level,
            proofType: meta.proofType,
            tips: meta.tips,
            groupName: cg.CGName,
            typeName: ct.CTName
          });
        }
      }
    }
  }

  const currentScore = Math.max(0, totalScore);
  const rank = getRankName(currentScore);
  const targetScore = getNextTarget(currentScore);
  const scoreNeeded = Math.max(0, targetScore - currentScore);

  // Roadmap algorithm: Filter unachieved items, sort by Level 1 -> Level 2 -> Level 3 -> Level 4
  const unachieved = items.filter(item => !item.isAchieved && item.level > 0);
  unachieved.sort((a, b) => a.level - b.level);

  let accumulated = 0;
  const roadmapItems = [];
  for (const item of unachieved) {
    if (accumulated >= scoreNeeded && scoreNeeded > 0) break;
    roadmapItems.push(item);
    accumulated += item.maxPoint;
  }

  return {
    currentScore,
    rank,
    targetScore,
    scoreNeeded,
    roadmapItems,
    allItems: items
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeConductScore, getRankName, getNextTarget };
}
