/**
 * @jest-environment jsdom
 */

describe('Content Script & Data Interceptor Tests', () => {
  let mockRawJson;

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '';
    localStorage.clear();
    delete window.sampleDrlRawJson;

    global.chrome = {
      runtime: {
        sendMessage: jest.fn()
      }
    };

    mockRawJson = {
      CriteriaTypeDetailsLst: [
        {
          CTName: 'Tiêu chí 1',
          CriteriaGroupDetailsLst: [
            {
              CGName: 'Nhóm 1',
              UserCriteriaDetailsLst: [
                {
                  CId: '1.1',
                  CName: 'Tham gia họp lớp',
                  UCPoint: 3,
                  CMaxPoint: 3
                }
              ]
            }
          ]
        }
      ]
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.chrome;
  });

  test('should load data from localStorage, analyze it, render panel, and send chrome message', () => {
    localStorage.setItem('iCTSV_CriteriaData', JSON.stringify(mockRawJson));

    const { initHustDrlHelper } = require('../src/content/content_script');
    initHustDrlHelper();

    const root = document.getElementById('hust-drl-helper-root');
    expect(root).not.toBeNull();

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SAVE_DRL_DATA',
      payload: expect.objectContaining({
        currentScore: 3,
        rank: 'Yếu'
      })
    });
  });

  test('should fallback to sampleDrlRawJson if localStorage is empty', () => {
    window.sampleDrlRawJson = mockRawJson;

    const { initHustDrlHelper } = require('../src/content/content_script');
    initHustDrlHelper();

    const root = document.getElementById('hust-drl-helper-root');
    expect(root).not.toBeNull();

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SAVE_DRL_DATA',
      payload: expect.objectContaining({
        currentScore: 3
      })
    });
  });

  test('should handle invalid JSON in localStorage gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('iCTSV_CriteriaData', 'invalid-json-{');

    const { initHustDrlHelper } = require('../src/content/content_script');
    initHustDrlHelper();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[HUST ĐRL Helper] LocalStorage parse error:',
      expect.any(SyntaxError)
    );

    const root = document.getElementById('hust-drl-helper-root');
    expect(root).toBeNull();
  });

  test('should do nothing if no data in localStorage or sampleDrlRawJson', () => {
    const { initHustDrlHelper } = require('../src/content/content_script');
    initHustDrlHelper();

    const root = document.getElementById('hust-drl-helper-root');
    expect(root).toBeNull();
    expect(global.chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  test('should auto-initialize when document.readyState is complete', () => {
    localStorage.setItem('iCTSV_CriteriaData', JSON.stringify(mockRawJson));
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete'
    });

    require('../src/content/content_script');

    const root = document.getElementById('hust-drl-helper-root');
    expect(root).not.toBeNull();
  });

  test('should attach load listener when document.readyState is loading', () => {
    localStorage.setItem('iCTSV_CriteriaData', JSON.stringify(mockRawJson));
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading'
    });

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    require('../src/content/content_script');

    expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
  });
});
