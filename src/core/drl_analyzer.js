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
  let positiveScore = 0;
  let penaltyDeductions = 0;
  const items = [];
  const candidates = [];

  const metaFetcher = getMeta || (typeof window !== 'undefined' && window.getCriteriaMeta ? window.getCriteriaMeta : () => ({ level: 3, proofType: 'proof', tips: '' }));

  if (rawJson && rawJson.CriteriaTypeDetailsLst) {
    for (const ct of rawJson.CriteriaTypeDetailsLst) {
      const ctMaxPoint = ct.CTMaxPoint !== undefined ? ct.CTMaxPoint : 100.0;
      const isPenaltyCat = ct.CTId === 11 || ctMaxPoint < 0;
      const category = { remaining: ctMaxPoint };
      let ctCappedScore = 0;

      for (const cg of ct.CriteriaGroupDetailsLst || []) {
        const cgMaxPoint = cg.CGMaxPoint !== undefined ? cg.CGMaxPoint : 100.0;
        const group = { remaining: cgMaxPoint };
        let cgRawScore = 0;

        for (const c of cg.UserCriteriaDetailsLst || []) {
          const cid = c.CId;
          const cname = c.CName;
          const userPoint = c.UCPoint || c.TCPoint || 0;
          const maxPoint = c.CMaxPoint || 0;
          const meta = metaFetcher(cid);
          const isItemPenalty = isPenaltyCat || meta.level === 0 || (cid >= 172 && cid <= 176);

          cgRawScore += userPoint;

          const item = {
            id: cid,
            name: cname,
            userPoint: userPoint,
            maxPoint: maxPoint,
            isAchieved: userPoint > 0,
            level: isItemPenalty ? 0 : meta.level,
            proofType: isItemPenalty ? 'penalty' : meta.proofType,
            tips: meta.tips,
            cgId: cg.CGId,
            cgName: cg.CGName,
            cgMaxPoint: cgMaxPoint,
            ctId: ct.CTId,
            ctName: ct.CTName,
            ctMaxPoint: ctMaxPoint
          };
          items.push(item);
          if (!item.isAchieved && item.level > 0 && item.maxPoint > 0) {
            candidates.push({ item, group, category });
          }
        }

        if (isPenaltyCat) {
          penaltyDeductions += cgRawScore;
        } else {
          const cgCappedScore = Math.min(cgMaxPoint, cgRawScore);
          ctCappedScore += cgCappedScore;
          group.remaining = cgMaxPoint - cgCappedScore;
        }
      }

      if (!isPenaltyCat) {
        const ctFinalScore = Math.min(ctMaxPoint, ctCappedScore);
        positiveScore += ctFinalScore;
        category.remaining = ctMaxPoint - ctFinalScore;
      }
    }
  }

  const netScore = positiveScore - penaltyDeductions;
  const currentScore = Math.max(0, Math.min(100, netScore));
  const rank = getRankName(currentScore);
  const targetScore = Math.min(90, getNextTarget(currentScore));
  const targetRankName = getRankName(targetScore);
  const scoreNeeded = Math.max(0, targetScore - currentScore);

  for (const candidate of candidates) {
    const { item, group, category } = candidate;
    candidate.initialGain = Math.min(item.maxPoint, group.remaining, category.remaining);
  }
  candidates.sort((a, b) => (a.item.level - b.item.level) || (b.initialGain - a.initialGain));

  let projectedNetScore = netScore;
  const roadmapItems = [];
  for (const { item, group, category } of candidates) {
    if (projectedNetScore >= targetScore) break;
    const effectiveGain = Math.min(item.maxPoint, group.remaining, category.remaining);
    if (effectiveGain <= 0) continue;

    group.remaining -= effectiveGain;
    category.remaining -= effectiveGain;
    projectedNetScore += effectiveGain;
    roadmapItems.push({ ...item, effectiveGain });
  }

  const projectedScore = Math.max(0, Math.min(100, projectedNetScore));

  return {
    currentScore,
    penaltyDeductions,
    positiveScore,
    rank,
    targetScore,
    targetRankName,
    scoreNeeded,
    roadmapItems,
    projectedScore,
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
