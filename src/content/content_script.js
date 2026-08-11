// src/content/content_script.js

let analyzeConductScoreFn = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : null;
let renderHustDrlPanelFn = typeof renderHustDrlPanel !== 'undefined' ? renderHustDrlPanel : null;

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

function processAndRender(rawJson) {
  if (!rawJson) return;
  const analyze = analyzeConductScoreFn || (typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : null);
  const render = renderHustDrlPanelFn || (typeof renderHustDrlPanel !== 'undefined' ? renderHustDrlPanel : null);

  if (analyze) {
    const analysis = analyze(rawJson);
    if (render) {
      render(analysis, rawJson);
    }
    // Save to extension storage so Popup can access it anywhere
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SAVE_DRL_DATA', payload: analysis });
    }
  }
}

function initHustDrlHelper() {
  console.log('[HUST ĐRL Helper] Content script active on:', typeof location !== 'undefined' ? location.href : 'iCTSV');

  let rawJson = null;
  try {
    const stored = localStorage.getItem('iCTSV_CriteriaData');
    if (stored) rawJson = JSON.parse(stored);
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
    if (e.detail) {
      console.log('[HUST ĐRL Helper] Captured live API criteria data!');
      try {
        localStorage.setItem('iCTSV_CriteriaData', JSON.stringify(e.detail));
      } catch (err) {}
      processAndRender(e.detail);
    }
  });

  window.addEventListener('hashchange', initHustDrlHelper);
  window.addEventListener('popstate', initHustDrlHelper);
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
  module.exports = { initHustDrlHelper, processAndRender };
}
