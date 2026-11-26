// src/content/content_script.js

let analyzeConductScoreFn = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : (typeof window !== 'undefined' ? window.analyzeConductScore : null);
let renderHustDrlPanelFn = typeof renderHustDrlPanel !== 'undefined' ? renderHustDrlPanel : (typeof window !== 'undefined' ? window.renderHustDrlPanel : null);

if (!analyzeConductScoreFn && typeof require !== 'undefined') {
  try { analyzeConductScoreFn = require('../core/drl_analyzer').analyzeConductScore; } catch (e) {}
}

if (!renderHustDrlPanelFn && typeof require !== 'undefined') {
  try { renderHustDrlPanelFn = require('./injected_panel').renderHustDrlPanel; } catch (e) {}
}

function injectInterceptorScript() {
  if (typeof document !== 'undefined' && (document.head || document.documentElement)) {
    try {
      const script = document.createElement('script');
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        script.src = chrome.runtime.getURL('src/content/interceptor.js');
      }
      script.onload = function() { this.remove(); };
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {}
  }
}

function applyWidgetVisibility(forcedState) {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('hust-drl-helper-root');
  if (!root) return;

  if (forcedState !== undefined) {
    root.style.display = forcedState ? 'block' : 'none';
    return;
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['isWidgetEnabled'], (res) => {
      const isEnabled = res.isWidgetEnabled !== undefined ? res.isWidgetEnabled : true;
      root.style.display = isEnabled ? 'block' : 'none';
    });
  }
}

function processAndRender(rawJson) {
  if (!rawJson) return;
  const analyze = analyzeConductScoreFn || (typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : (typeof window !== 'undefined' ? window.analyzeConductScore : null));
  const render = renderHustDrlPanelFn || (typeof renderHustDrlPanel !== 'undefined' ? renderHustDrlPanel : (typeof window !== 'undefined' ? window.renderHustDrlPanel : null));

  if (analyze) {
    const analysis = analyze(rawJson);
    if (render) {
      render(analysis, rawJson);
      applyWidgetVisibility();
    }
    // Save to extension storage so Popup can access it anywhere
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SAVE_DRL_DATA', payload: analysis });
    }
  }
}

function criteriaSnapshot(data) {
  if (!Array.isArray(data?.CriteriaTypeDetailsLst)) return null;

  return {
    CriteriaTypeDetailsLst: data.CriteriaTypeDetailsLst.map(({ CTId, CTName, CTMaxPoint, CriteriaGroupDetailsLst }) => ({
      CTId, CTName, CTMaxPoint,
      CriteriaGroupDetailsLst: (CriteriaGroupDetailsLst || []).map(({ CGId, CGName, CGMaxPoint, UserCriteriaDetailsLst }) => ({
        CGId, CGName, CGMaxPoint,
        UserCriteriaDetailsLst: (UserCriteriaDetailsLst || []).map(({ CId, CName, UCPoint, TCPoint, CMaxPoint }) => ({
          CId, CName, UCPoint, TCPoint, CMaxPoint
        }))
      }))
    }))
  };
}

function initHustDrlHelper() {
  console.log('[HUST ĐRL Helper] Content script active.');

  let rawJson = null;
  try {
    const stored = localStorage.getItem('iCTSV_CriteriaData');
    if (stored) {
      rawJson = criteriaSnapshot(JSON.parse(stored));
      if (rawJson) {
        const sanitized = JSON.stringify(rawJson);
        if (sanitized !== stored) localStorage.setItem('iCTSV_CriteriaData', sanitized);
      } else {
        localStorage.removeItem('iCTSV_CriteriaData');
      }
    }
  } catch (e) {
    console.error('[HUST ĐRL Helper] LocalStorage parse error:', e);
  }

  // Fallback to sample data
  if (!rawJson && typeof sampleDrlRawJson !== 'undefined') {
    rawJson = sampleDrlRawJson;
  } else if (!rawJson && typeof window !== 'undefined' && window.sampleDrlRawJson) {
    rawJson = window.sampleDrlRawJson;
  }

  processAndRender(rawJson);
}

// Listen for live API data events from interceptor.js
if (typeof window !== 'undefined') {
  window.addEventListener('HUST_DRL_DATA_EVENT', (e) => {
    let snapshot;
    try {
      snapshot = criteriaSnapshot(e.detail);
    } catch {
      return;
    }
    if (!snapshot) return;

    try {
      localStorage.setItem('iCTSV_CriteriaData', JSON.stringify(snapshot));
    } catch {}
    processAndRender(snapshot);
  });

  window.addEventListener('hashchange', initHustDrlHelper);
  window.addEventListener('popstate', initHustDrlHelper);
}

// Listen for runtime visibility toggle messages
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_WIDGET_VISIBILITY') {
      applyWidgetVisibility(message.enabled);
      if (sendResponse) sendResponse({ status: 'OK' });
    }
  });
}

// Run on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectInterceptorScript();
    initHustDrlHelper();
  } else if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      injectInterceptorScript();
      initHustDrlHelper();
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initHustDrlHelper, processAndRender, applyWidgetVisibility };
}
