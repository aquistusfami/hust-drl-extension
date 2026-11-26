// src/core/drl_analyzer.js
var getMeta = typeof getCriteriaMeta !== 'undefined' ? getCriteriaMeta : (typeof window !== 'undefined' && window.getCriteriaMeta ? window.getCriteriaMeta : null);
if (!getMeta && typeof require !== 'undefined') {
  try { getMeta = require('./criteria_db').getCriteriaMeta; } catch (e) {}
}

function getRankName(score) {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
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

const mainDrlCategories = [
  { id: 6, name: 'Pháp luật và nội quy', maxScore: 25 },
  { id: 7, name: 'Học tập', maxScore: 20 },
  { id: 8, name: 'Hoạt động chính trị, xã hội, văn hóa, thể thao', maxScore: 20 },
  { id: 9, name: 'Trách nhiệm với cộng đồng', maxScore: 15 },
  { id: 10, name: 'Công tác tập thể và thành tích', maxScore: 20 }
];

const emptyPlan = { gain: 0, cost: 0, candidates: [] };

function combineRoadmapOptions(left, right, cap) {
  const byGain = new Map();
  for (const a of left) {
    for (const b of right) {
      const gain = Math.min(cap, a.gain + b.gain);
      const cost = a.cost + b.cost;
      if (cost < (byGain.get(gain)?.cost ?? Infinity)) {
        byGain.set(gain, { gain, cost, candidates: [...a.candidates, ...b.candidates] });
      }
    }
  }

  // A cheaper plan with at least as much gain also wins at every higher cap.
  let lowestCost = Infinity;
  return [...byGain.values()].sort((a, b) => b.gain - a.gain).filter(plan => {
    if (plan.cost >= lowestCost) return false;
    lowestCost = plan.cost;
    return true;
  });
}

function planToTarget(categories, targetGain, costBase) {
  if (targetGain <= 0) return [];

  let overall = [emptyPlan];
  for (const category of categories) {
    if (category.remaining <= 0) continue;
    let categoryOptions = [emptyPlan];
    for (const group of category.groups) {
      if (group.remaining <= 0) continue;
      let groupOptions = [emptyPlan];
      for (const candidate of group.candidates) {
        const { item } = candidate;
        // One harder criterion costs more than every easier criterion combined.
        const cost = costBase ** (item.level - 1);
        groupOptions = combineRoadmapOptions(
          groupOptions, [emptyPlan, { gain: item.maxPoint - item.userPoint, cost, candidates: [candidate] }],
          Math.min(group.remaining, category.remaining, targetGain)
        );
      }
      categoryOptions = combineRoadmapOptions(categoryOptions, groupOptions, Math.min(category.remaining, targetGain));
    }
    overall = combineRoadmapOptions(overall, categoryOptions, targetGain);
  }
  return overall[0].candidates;
}

function analyzeConductScore(rawJson) {
  let positiveScore = 0;
  let penaltyDeductions = 0;
  const items = [];
  const categories = [];

  const metaFetcher = getMeta || (typeof window !== 'undefined' && window.getCriteriaMeta ? window.getCriteriaMeta : () => ({ level: 3, proofType: 'proof', tips: '' }));

  if (rawJson && rawJson.CriteriaTypeDetailsLst) {
    for (const ct of rawJson.CriteriaTypeDetailsLst) {
      const ctMaxPoint = ct.CTMaxPoint !== undefined ? ct.CTMaxPoint : 100.0;
      const isPenaltyCat = ct.CTId === 11 || ctMaxPoint < 0;
      const category = {
        id: ct.CTId,
        name: ct.CTName,
        maxScore: ctMaxPoint,
        currentScore: 0,
        plannedGain: 0,
        remaining: ctMaxPoint,
        groups: []
      };
      let ctCappedScore = 0;

      for (const cg of ct.CriteriaGroupDetailsLst || []) {
        const cgMaxPoint = cg.CGMaxPoint !== undefined ? cg.CGMaxPoint : 100.0;
        const group = { remaining: cgMaxPoint, candidates: [] };
        let cgRawScore = 0;

        for (const c of cg.UserCriteriaDetailsLst || []) {
          const cid = c.CId;
          const cname = c.CName;
          const userPoint = Number(c.UCPoint ?? c.TCPoint ?? 0);
          const maxPoint = Number(c.CMaxPoint ?? 0);
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
            group.candidates.push({ item, group, category });
          }
        }

        if (isPenaltyCat) {
          penaltyDeductions += cgRawScore;
        } else {
          const cgCappedScore = Math.min(cgMaxPoint, cgRawScore);
          ctCappedScore += cgCappedScore;
          group.remaining = cgMaxPoint - cgCappedScore;
          category.groups.push(group);
        }
      }

      if (!isPenaltyCat) {
        const ctFinalScore = Math.min(ctMaxPoint, ctCappedScore);
        positiveScore += ctFinalScore;
        category.currentScore = ctFinalScore;
        category.remaining = ctMaxPoint - ctFinalScore;
        categories.push(category);
      }
    }
  }

  const netScore = positiveScore - penaltyDeductions;
  const currentScore = Math.max(0, Math.min(100, netScore));
  const rank = getRankName(currentScore);
  const targetScore = Math.min(90, getNextTarget(currentScore));
  const targetRankName = getRankName(targetScore);
  const scoreNeeded = Math.max(0, targetScore - currentScore);

  const plan = planToTarget(categories, targetScore - netScore, items.length + 1);
  plan.sort((a, b) => a.item.level - b.item.level || b.item.maxPoint - a.item.maxPoint);

  let projectedNetScore = netScore;
  const roadmapItems = [];
  for (const { item, group, category } of plan) {
    const effectiveGain = Math.min(item.maxPoint - item.userPoint, group.remaining, category.remaining);
    if (effectiveGain <= 0) continue;

    group.remaining -= effectiveGain;
    category.remaining -= effectiveGain;
    category.plannedGain += effectiveGain;
    projectedNetScore += effectiveGain;
    roadmapItems.push({ ...item, effectiveGain });
  }

  let categoryScores = categories.map(({ id, name, maxScore, currentScore, plannedGain }) => ({
    id, name, maxScore, currentScore, plannedGain
  }));
  const scoresById = new Map(categoryScores.map(category => [Number(category.id), category]));
  if (mainDrlCategories.some(main => scoresById.has(main.id))) {
    categoryScores = [
      ...mainDrlCategories.map(main => {
        const score = scoresById.get(main.id);
        scoresById.delete(main.id);
        return score ? { ...score, name: main.name } : { ...main, currentScore: null, plannedGain: 0 };
      }),
      ...scoresById.values()
    ];
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
    categoryScores,
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
