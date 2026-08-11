// src/core/drl_analyzer.js
var getMeta = typeof getCriteriaMeta !== 'undefined' ? getCriteriaMeta : (typeof window !== 'undefined' && window.getCriteriaMeta ? window.getCriteriaMeta : null);
if (!getMeta && typeof require !== 'undefined') {
  try { getMeta = require('./criteria_db').getCriteriaMeta; } catch (e) {}
}

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

  const metaFetcher = getMeta || (typeof window !== 'undefined' && window.getCriteriaMeta ? window.getCriteriaMeta : () => ({ level: 3, proofType: 'proof', tips: '' }));

  if (rawJson && rawJson.CriteriaTypeDetailsLst) {
    for (const ct of rawJson.CriteriaTypeDetailsLst) {
      const ctMaxPoint = ct.CTMaxPoint !== undefined ? ct.CTMaxPoint : 100.0;
      let ctCappedScore = 0;

      for (const cg of ct.CriteriaGroupDetailsLst || []) {
        const cgMaxPoint = cg.CGMaxPoint !== undefined ? cg.CGMaxPoint : 100.0;
        let cgRawScore = 0;

        for (const c of cg.UserCriteriaDetailsLst || []) {
          const cid = c.CId;
          const cname = c.CName;
          const userPoint = c.UCPoint || c.TCPoint || 0;
          const maxPoint = c.CMaxPoint || 0;
          const meta = metaFetcher(cid);

          cgRawScore += userPoint;

          items.push({
            id: cid,
            name: cname,
            userPoint: userPoint,
            maxPoint: maxPoint,
            isAchieved: userPoint > 0,
            level: meta.level,
            proofType: meta.proofType,
            tips: meta.tips,
            cgId: cg.CGId,
            cgName: cg.CGName,
            cgMaxPoint: cgMaxPoint,
            ctId: ct.CTId,
            ctName: ct.CTName,
            ctMaxPoint: ctMaxPoint
          });
        }

        // Cap Group score (unless penalty group with negative max)
        const cgCappedScore = (cgMaxPoint < 0) ? cgRawScore : Math.min(cgMaxPoint, cgRawScore);
        ctCappedScore += cgCappedScore;
      }

      // Cap Category score (unless penalty category)
      const ctFinalScore = (ctMaxPoint < 0) ? ctCappedScore : Math.min(ctMaxPoint, ctCappedScore);
      totalScore += ctFinalScore;
    }
  }

  const currentScore = Math.max(0, Math.min(100, totalScore));
  const rank = getRankName(currentScore);
  const targetScore = getNextTarget(currentScore);
  const scoreNeeded = Math.max(0, targetScore - currentScore);

  // Roadmap algorithm with Net Effective Point Gain calculation considering CGMaxPoint & CTMaxPoint
  const unachieved = items.filter(item => !item.isAchieved && item.level > 0);

  const candidateItems = unachieved.map(item => {
    // Current group raw score
    const groupItems = items.filter(i => i.cgId === item.cgId);
    const currentCgScore = groupItems.reduce((sum, i) => sum + i.userPoint, 0);
    const availableCgCapacity = (item.cgMaxPoint < 0) ? item.maxPoint : Math.max(0, item.cgMaxPoint - currentCgScore);

    // Current category capped score
    const catItems = items.filter(i => i.ctId === item.ctId);
    const groupIds = [...new Set(catItems.map(i => i.cgId))];
    let currentCtScore = 0;
    groupIds.forEach(gid => {
      const gItems = catItems.filter(i => i.cgId === gid);
      const gRaw = gItems.reduce((sum, i) => sum + i.userPoint, 0);
      const gMax = gItems[0].cgMaxPoint;
      currentCtScore += (gMax < 0) ? gRaw : Math.min(gMax, gRaw);
    });
    const availableCtCapacity = (item.ctMaxPoint < 0) ? item.maxPoint : Math.max(0, item.ctMaxPoint - currentCtScore);

    const effectiveGain = Math.min(item.maxPoint, availableCgCapacity, availableCtCapacity);
    return { ...item, effectiveGain };
  }).filter(item => item.effectiveGain > 0);

  // Sort by Level (1 -> 2 -> 3) then by highest effective gain
  candidateItems.sort((a, b) => (a.level - b.level) || (b.effectiveGain - a.effectiveGain));

  let accumulated = 0;
  const roadmapItems = [];
  for (const item of candidateItems) {
    if (accumulated >= scoreNeeded && scoreNeeded > 0) break;
    roadmapItems.push(item);
    accumulated += item.effectiveGain;
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

if (typeof window !== 'undefined') {
  window.getRankName = getRankName;
  window.getNextTarget = getNextTarget;
  window.analyzeConductScore = analyzeConductScore;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeConductScore, getRankName, getNextTarget };
}
