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

  test('should enforce CGMaxPoint group capping correctly', () => {
    const mockJson = {
      CriteriaTypeDetailsLst: [
        {
          CTId: 6,
          CTName: 'Chấp hành pháp luật',
          CTMaxPoint: 25.0,
          CriteriaGroupDetailsLst: [
            {
              CGId: 17,
              CGName: 'Chấp hành pháp luật công dân',
              CGMaxPoint: 15.0,
              UserCriteriaDetailsLst: [
                { CId: 114, CName: 'Mục 1', UCPoint: 6.0, CMaxPoint: 6.0 },
                { CId: 115, CName: 'Mục 2', UCPoint: 6.0, CMaxPoint: 6.0 },
                { CId: 116, CName: 'Mục 3', UCPoint: 4.0, CMaxPoint: 4.0 }
              ]
            }
          ]
        }
      ]
    };

    // Raw sum is 6 + 6 + 4 = 16, but CGMaxPoint is 15.0!
    const result = analyzeConductScore(mockJson);
    expect(result.currentScore).toBe(15);
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
