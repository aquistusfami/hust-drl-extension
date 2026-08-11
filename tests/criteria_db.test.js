const { getCriteriaMeta, CRITERIA_DB } = require('../src/core/criteria_db');

describe('Criteria Database Tests', () => {
  test('should contain exactly 63 criteria items', () => {
    const keys = Object.keys(CRITERIA_DB);
    expect(keys.length).toBe(63);
  });

  test('should return correct metadata for Level 1 criteria (CId 115 - SHCD)', () => {
    const meta = getCriteriaMeta(115);
    expect(meta.level).toBe(1);
    expect(meta.proofType).toBe('auto');
  });

  test('should return correct metadata for Level 2 criteria (CId 143 - Hiến máu)', () => {
    const meta = getCriteriaMeta(143);
    expect(meta.level).toBe(2);
    expect(meta.proofType).toBe('proof');
  });

  test('should return defaultMaxPoint correctly from raw json for CId 115 and 143', () => {
    const meta115 = getCriteriaMeta(115);
    expect(meta115.defaultMaxPoint).toBe(6);

    const meta143 = getCriteriaMeta(143);
    expect(meta143.defaultMaxPoint).toBe(6);
  });

  test('should handle unknown CId gracefully with default fallback object', () => {
    const metaUnknown = getCriteriaMeta(9999);
    expect(metaUnknown).toEqual({
      id: 9999,
      level: 3,
      defaultMaxPoint: 0,
      proofType: 'proof',
      tips: ''
    });
  });
});
