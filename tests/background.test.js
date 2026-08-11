const { handleMessage } = require('../src/background/background');

describe('Background Service Worker Tests', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};

    global.chrome = {
      runtime: {
        onInstalled: { addListener: jest.fn() },
        onMessage: { addListener: jest.fn() }
      },
      storage: {
        local: {
          set: jest.fn((data, callback) => {
            Object.assign(mockStorage, data);
            if (callback) callback();
          }),
          get: jest.fn((keys, callback) => {
            const result = {};
            keys.forEach(k => {
              if (mockStorage[k] !== undefined) {
                result[k] = mockStorage[k];
              }
            });
            if (callback) callback(result);
          })
        }
      }
    };
  });

  afterEach(() => {
    delete global.chrome;
  });

  test('SAVE_DRL_DATA should store data into chrome.storage.local and respond with SUCCESS', (done) => {
    const testPayload = { totalPoints: 85, semester: '20261' };
    const sendResponse = jest.fn((res) => {
      expect(res).toEqual({ status: 'SUCCESS' });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ drlData: testPayload }, expect.any(Function));
      expect(mockStorage.drlData).toEqual(testPayload);
      done();
    });

    const isAsync = handleMessage({ type: 'SAVE_DRL_DATA', payload: testPayload }, {}, sendResponse);
    expect(isAsync).toBe(true);
  });

  test('GET_DRL_DATA should retrieve data from chrome.storage.local', (done) => {
    mockStorage.drlData = { totalPoints: 90 };

    const sendResponse = jest.fn((res) => {
      expect(res).toEqual({ payload: { totalPoints: 90 } });
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['drlData'], expect.any(Function));
      done();
    });

    const isAsync = handleMessage({ type: 'GET_DRL_DATA' }, {}, sendResponse);
    expect(isAsync).toBe(true);
  });

  test('GET_DRL_DATA should return null payload if no data exists', (done) => {
    const sendResponse = jest.fn((res) => {
      expect(res).toEqual({ payload: null });
      done();
    });

    handleMessage({ type: 'GET_DRL_DATA' }, {}, sendResponse);
  });

  test('Unknown message type should return undefined without breaking', () => {
    const sendResponse = jest.fn();
    const result = handleMessage({ type: 'UNKNOWN_ACTION' }, {}, sendResponse);
    expect(result).toBeUndefined();
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
