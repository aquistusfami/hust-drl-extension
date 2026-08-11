const fs = require('fs');
const path = require('path');
const { analyzeConductScore, getRankName, getNextTarget } = require('../src/core/drl_analyzer');

describe('DRL Analyzer Algorithm Tests', () => {
  const rawJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../drl_20261_raw.json'), 'utf-8'));

  test('should return correct rank names', () => {
    expect(getRankName(95)).toBe('Xuất sắc');
    expect(getRankName(90)).toBe('Xuất sắc');
    expect(getRankName(84)).toBe('Giỏi');
    expect(getRankName(80)).toBe('Giỏi');
    expect(getRankName(72)).toBe('Khá');
    expect(getRankName(70)).toBe('Khá');
    expect(getRankName(55)).toBe('Trung bình');
    expect(getRankName(50)).toBe('Trung bình');
    expect(getRankName(40)).toBe('Yếu');
  });

  test('should return correct next targets', () => {
    expect(getNextTarget(0)).toBe(70);
    expect(getNextTarget(65)).toBe(70);
    expect(getNextTarget(70)).toBe(80);
    expect(getNextTarget(79)).toBe(80);
    expect(getNextTarget(80)).toBe(90);
    expect(getNextTarget(89)).toBe(90);
    expect(getNextTarget(90)).toBe(100);
    expect(getNextTarget(95)).toBe(100);
  });

  test('should parse initial raw JSON with score 0 and recommend target 70 (Khá)', () => {
    const result = analyzeConductScore(rawJson);
    expect(result.currentScore).toBe(0);
    expect(result.targetScore).toBe(70);
    expect(result.scoreNeeded).toBe(70);
    expect(result.roadmapItems.length).toBeGreaterThan(0);
    expect(result.allItems.length).toBeGreaterThan(0);
  });

  test('should prioritize roadmap items by level (level 1 -> level 2 -> level 3)', () => {
    const result = analyzeConductScore(rawJson);
    const levels = result.roadmapItems.map(item => item.level);
    for (let i = 0; i < levels.length - 1; i++) {
      expect(levels[i]).toBeLessThanOrEqual(levels[i + 1]);
    }
  });

  test('should handle null/empty rawJson gracefully', () => {
    const result = analyzeConductScore(null);
    expect(result.currentScore).toBe(0);
    expect(result.targetScore).toBe(70);
    expect(result.scoreNeeded).toBe(70);
    expect(result.roadmapItems).toEqual([]);
    expect(result.allItems).toEqual([]);
  });
});
