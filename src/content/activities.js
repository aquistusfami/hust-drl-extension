async function readPublicActivitySnapshot() {
  const response = await fetch(chrome.runtime.getURL('src/data/public_activities.json'), { credentials: 'omit' });
  if (!response.ok) throw new Error('Could not load the bundled activity snapshot');
  return response.json();
}

function normalizeActivityCriterion(name) {
  return name.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi');
}

function indexCurrentActivities(activities, criteria, now = Date.now()) {
  const knownIds = new Set();
  const uniqueNames = new Map();
  for (const item of criteria) {
    const key = String(item.id);
    knownIds.add(key);
    if (typeof item.name !== 'string') continue;
    const name = normalizeActivityCriterion(item.name);
    uniqueNames.set(name, uniqueNames.has(name) ? null : key);
  }

  const byCriterion = new Map();

  for (const activity of activities) {
    if (!(Date.parse(activity.endsAt) >= now)) continue;
    for (const { id, name } of activity.criteria) {
      // Older activities may still use the previous semester's criterion IDs.
      const key = knownIds.has(String(id)) ? String(id) : uniqueNames.get(normalizeActivityCriterion(name));
      if (!key) continue;
      if (!byCriterion.has(key)) byCriterion.set(key, new Map());
      byCriterion.get(key).set(activity.id, activity);
    }
  }

  return byCriterion;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { indexCurrentActivities };
}
