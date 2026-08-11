// src/content/content_script.js

let analyzeConductScoreFn = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : null;
let renderHustDrlPanelFn = typeof renderHustDrlPanel !== 'undefined' ? renderHustDrlPanel : null;

if (!analyzeConductScoreFn && typeof require !== 'undefined') {
  try {
    analyzeConductScoreFn = require('../core/drl_analyzer').analyzeConductScore;
  } catch (e) {}
}

if (!renderHustDrlPanelFn && typeof require !== 'undefined') {
  try {
    renderHustDrlPanelFn = require('./injected_panel').renderHustDrlPanel;
  } catch (e) {}
}

function initHustDrlHelper() {
  console.log('[HUST ĐRL Helper] Content script active on iCTSV.');

  // Try fetching data from window or localStorage if present
  let rawJson = null;

  try {
    const stored = localStorage.getItem('iCTSV_CriteriaData');
    if (stored) rawJson = JSON.parse(stored);
  } catch (e) {
    console.error('[HUST ĐRL Helper] LocalStorage parse error:', e);
  }

  // Fallback to initial sample structure if testing
  if (!rawJson && typeof sampleDrlRawJson !== 'undefined') {
    rawJson = sampleDrlRawJson;
  } else if (!rawJson && typeof window !== 'undefined' && typeof window.sampleDrlRawJson !== 'undefined') {
    rawJson = window.sampleDrlRawJson;
  }

  if (rawJson) {
    const analyze = analyzeConductScoreFn || (typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : null);
    const render = renderHustDrlPanelFn || (typeof renderHustDrlPanel !== 'undefined' ? renderHustDrlPanel : null);

    if (analyze) {
      const analysis = analyze(rawJson);
      if (render) {
        render(analysis);
      }

      // Save to extension storage
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'SAVE_DRL_DATA', payload: analysis });
      }
    }
  }
}

// Run on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'complete') {
    initHustDrlHelper();
  } else if (typeof window !== 'undefined') {
    window.addEventListener('load', initHustDrlHelper);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initHustDrlHelper };
}
