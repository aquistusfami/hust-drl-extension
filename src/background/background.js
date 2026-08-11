// src/background/background.js

if (typeof importScripts === 'function') {
  try {
    importScripts('../data/sample_data.js', '../core/criteria_db.js', '../core/drl_analyzer.js');
  } catch (e) {
    console.error('[HUST ĐRL Helper] Error importing scripts in service worker:', e);
  }
}

function initializeDefaultData() {
  const sampleJson = typeof sampleDrlRawJson !== 'undefined' ? sampleDrlRawJson : null;
  const analyzer = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : null;

  if (sampleJson && analyzer && typeof chrome !== 'undefined' && chrome.storage) {
    const defaultAnalysis = analyzer(sampleJson);
    chrome.storage.local.get(['drlData'], (result) => {
      if (!result || !result.drlData) {
        chrome.storage.local.set({ drlData: defaultAnalysis });
      }
    });
  }
}

function handleMessage(request, sender, sendResponse) {
  if (request.type === 'SAVE_DRL_DATA') {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ drlData: request.payload }, () => {
        sendResponse({ status: 'SUCCESS' });
      });
    } else {
      sendResponse({ status: 'SUCCESS' });
    }
    return true;
  }
  if (request.type === 'GET_DRL_DATA') {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['drlData'], (result) => {
        if (result && result.drlData) {
          sendResponse({ payload: result.drlData });
        } else {
          const sampleJson = typeof sampleDrlRawJson !== 'undefined' ? sampleDrlRawJson : null;
          const analyzer = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : null;
          if (sampleJson && analyzer) {
            const fallbackAnalysis = analyzer(sampleJson);
            chrome.storage.local.set({ drlData: fallbackAnalysis });
            sendResponse({ payload: fallbackAnalysis });
          } else {
            sendResponse({ payload: null });
          }
        }
      });
    } else {
      sendResponse({ payload: null });
    }
    return true;
  }
}

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('[HUST ĐRL Helper] Extension installed successfully.');
    initializeDefaultData();
  });

  if (chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(() => {
      initializeDefaultData();
    });
  }

  chrome.runtime.onMessage.addListener(handleMessage);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handleMessage };
}
