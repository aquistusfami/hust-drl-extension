// src/background/background.js
function handleMessage(request, sender, sendResponse) {
  if (request.type === 'SAVE_DRL_DATA') {
    chrome.storage.local.set({ drlData: request.payload }, () => {
      sendResponse({ status: 'SUCCESS' });
    });
    return true;
  }
  if (request.type === 'GET_DRL_DATA') {
    chrome.storage.local.get(['drlData'], (result) => {
      sendResponse({ payload: result.drlData || null });
    });
    return true;
  }
}

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('[HUST ĐRL Helper] Extension installed successfully.');
  });
  chrome.runtime.onMessage.addListener(handleMessage);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handleMessage };
}

