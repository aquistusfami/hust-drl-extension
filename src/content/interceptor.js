// src/content/interceptor.js - Running in MAIN world to intercept iCTSV API calls
(function() {
  console.log('[HUST ĐRL Helper] Main world API interceptor loaded.');

  // Intercept Fetch API
  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      try {
        const clone = response.clone();
        clone.json().then(data => {
          if (data && (data.CriteriaTypeDetailsLst || data.RespCode === 0)) {
            window.dispatchEvent(new CustomEvent('HUST_DRL_DATA_EVENT', { detail: data }));
          }
        }).catch(() => {});
      } catch (e) {}
      return response;
    };
  }

  // Intercept XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(...args) {
    this._url = args[1];
    return origOpen.apply(this, args);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      try {
        if (this.responseText && this.responseText.includes('CriteriaTypeDetailsLst')) {
          const data = JSON.parse(this.responseText);
          window.dispatchEvent(new CustomEvent('HUST_DRL_DATA_EVENT', { detail: data }));
        }
      } catch (e) {}
    });
    return origSend.apply(this, args);
  };
})();
