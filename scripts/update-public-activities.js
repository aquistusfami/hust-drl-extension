const { readFile, rename, writeFile } = require('node:fs/promises');
const { join } = require('node:path');

const output = join(__dirname, '../src/data/public_activities.json');
const api = 'https://ctsv.hust.edu.vn/CTSV/Activity/';
const maxDetailAge = 24 * 60 * 60 * 1000;

async function fetchPublishedActivity(endpoint, data) {
  const response = await fetch(api + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
    credentials: 'omit',
    redirect: 'error',
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`${endpoint} returned HTTP ${response.status}`);
  const result = await response.json();
  if (result.RespCode !== 0 || !Array.isArray(result.Activities)) {
    throw new Error(`Unexpected response from ${endpoint}`);
  }
  return result;
}

function icTsvTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(value)) return null;
  const timestamp = value.replace(' ', 'T') + '+07:00';
  return Number.isFinite(Date.parse(timestamp)) ? timestamp : null;
}

async function buildPublicActivitySnapshot(previous, request = fetchPublishedActivity, now = new Date()) {
  const previousById = new Map((previous.activities || []).map(activity => [activity.id, activity]));
  const activities = new Map();
  let detailRequests = 0;
  let page = 1;
  let pages;

  do {
    const result = await request('GetPublishActivity', { PageNumber: page, NumberRow: 1000 });
    pages = result.NumberPage;
    if (!Number.isSafeInteger(pages) || pages < 0) throw new Error('Invalid public catalog page count');

    for (const row of result.Activities) {
      const id = Number(row.AId);
      const name = typeof row.AName === 'string' ? row.AName.trim() : '';
      const startsAt = icTsvTimestamp(row.StartTime);
      const endsAt = icTsvTimestamp(row.FinishTime);
      if (Number(row.Publish) !== 1 || !Number.isSafeInteger(id) || id <= 0 ||
          !name || !startsAt || !endsAt || endsAt < startsAt || Date.parse(endsAt) < now || activities.has(id)) continue;

      const old = previousById.get(id);
      const age = now - Date.parse(old?.criteriaCheckedAt);
      let criteria = old?.criteria;
      let criteriaCheckedAt = old?.criteriaCheckedAt;
      if (!Array.isArray(criteria) || !(age >= 0 && age < maxDetailAge) ||
          old.name !== name || old.startsAt !== startsAt || old.endsAt !== endsAt) {
        const detail = await request('GetActivityById', { AId: id });
        detailRequests += 1;
        const match = detail.Activities.find(activity => Number(activity.AId) === id);
        if (!match) throw new Error(`Published activity ${id} could not be verified`);
        criteria = (match.CriteriaLst || [])
          .filter(item => Number.isSafeInteger(Number(item.CId)) && Number(item.CId) > 0 && typeof item.CName === 'string')
          .map(item => ({ id: Number(item.CId), name: item.CName.trim() }))
          .filter(item => item.name);
        criteriaCheckedAt = now.toISOString();
      }
      activities.set(id, { id, name, startsAt, endsAt, criteria, criteriaCheckedAt });
    }
    page += 1;
  } while (page <= pages);

  return {
    snapshot: {
      updatedAt: now.toISOString(),
      source: 'https://ctsv.hust.edu.vn/danh-sach-su-kien/',
      activities: [...activities.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id - b.id)
    },
    catalogRequests: page - 1,
    detailRequests
  };
}

async function main() {
  let previous = {};
  try {
    previous = JSON.parse(await readFile(output, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const { snapshot, catalogRequests, detailRequests } = await buildPublicActivitySnapshot(previous);
  const temporaryOutput = `${output}.${process.pid}.tmp`;
  await writeFile(temporaryOutput, JSON.stringify(snapshot, null, 2) + '\n');
  await rename(temporaryOutput, output);
  console.log(`Saved ${snapshot.activities.length} activities (${catalogRequests} catalog, ${detailRequests} detail requests).`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { buildPublicActivitySnapshot };
