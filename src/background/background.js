// src/background/background.js
if (typeof importScripts === 'function') {
  try {
    importScripts('../data/sample_data.js', '../core/criteria_db.js', '../core/drl_analyzer.js');
  } catch (e) {
    console.error('Failed to import scripts in background worker:', e);
  }
}

function initializeDefaultData() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['drlData'], (result) => {
      if (!result.drlData) {
        const sampleJson = typeof sampleDrlRawJson !== 'undefined' ? sampleDrlRawJson : null;
        const analyzer = typeof analyzeConductScore !== 'undefined' ? analyzeConductScore : null;
        if (sampleJson && analyzer) {
          const initialAnalysis = analyzer(sampleJson);
          chrome.storage.local.set({ drlData: initialAnalysis });
        }
      }
    });
  }
}

function handleMessage(message, sender, sendResponse) {
  if (message.type === 'SAVE_DRL_DATA') {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ drlData: message.payload }, () => {
        sendResponse({ status: 'SUCCESS' });
      });
    }
    return true;
  }

  if (message.type === 'GET_DRL_DATA') {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['drlData'], (result) => {
        sendResponse({ payload: result.drlData || null });
      });
    } else {
      sendResponse({ payload: null });
    }
    return true;
  }

  if (message.type === 'TOGGLE_WIDGET_VISIBILITY') {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ url: "*://ctsv.hust.edu.vn/*" }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        });
      });
    }
    sendResponse({ status: 'SUCCESS' });
    return true;
  }
}

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    initializeDefaultData();
  });

  chrome.runtime.onStartup.addListener(() => {
    initializeDefaultData();
  });

  chrome.runtime.onMessage.addListener(handleMessage);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeDefaultData, handleMessage };
}
