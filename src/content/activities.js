// Only read the event cards and registration controls that iCTSV renders.
function normalizeCriterionName(text) {
  return text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi');
}

function getActivityLinks(doc) {
  const links = Array.from(doc.querySelectorAll('.slider a[href], .frame-text-event a[href]'))
    .filter(link => link.origin === doc.location.origin && /^\/hoat-dong\/\d+\/chi-tiet$/.test(link.pathname))
    .map(link => link.pathname);
  return links.length ? [...new Set(links)] : undefined;
}

function getOpenActivity(doc) {
  const name = doc.querySelector('.st-hero-banner__title')?.textContent.trim();
  if (!name || !doc.querySelector('.ui-section--1')) return;

  const registerButton = Array.from(doc.querySelectorAll('button.ui-btn-primary')).find(button =>
    button.textContent.trim() === 'Đăng ký tham gia' &&
    !button.disabled && button.getAttribute('aria-disabled') !== 'true' &&
    button.getClientRects().length > 0 && doc.defaultView.getComputedStyle(button).visibility === 'visible'
  );
  const criteria = Array.from(doc.querySelectorAll('.ui-section--2 li > .ac-criteria__num + span'))
    .map(label => normalizeCriterionName(label.textContent))
    .filter(Boolean);

  return registerButton && criteria.length ? { name, criteria } : null;
}

function readRenderedActivityPage(path, read) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed; left:-10000px; width:960px; height:640px; border:0;';
    frame.src = new URL(path, window.location.origin).href;

    // The normal pages render their data asynchronously after navigation.
    const interval = setInterval(() => {
      try {
        const doc = frame.contentDocument;
        if (doc?.location?.pathname !== path) return;
        const result = read(doc);
        if (result !== undefined) finish(resolve, result);
      } catch (error) {
        finish(reject, error);
      }
    }, 100);
    const timeout = setTimeout(() => finish(reject, new Error('iCTSV did not render the page.')), 8000);

    function finish(callback, result) {
      clearInterval(interval);
      clearTimeout(timeout);
      frame.remove();
      callback(result);
    }

    document.body.appendChild(frame);
  });
}

async function loadOpenActivities() {
  const links = await readRenderedActivityPage('/', getActivityLinks);
  const activities = [];
  let unread = 0;

  for (let index = 0; index < links.length; index += 3) {
    const batch = links.slice(index, index + 3);
    const results = await Promise.allSettled(batch.map(path => readRenderedActivityPage(path, getOpenActivity)));
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        unread += 1;
      } else if (result.value) {
        activities.push({ ...result.value, path: batch[i] });
      }
    });
  }

  return { activities, unread };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getActivityLinks, getOpenActivity, normalizeCriterionName };
}
