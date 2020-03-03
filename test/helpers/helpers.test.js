const { APP_NAME } = require('../../src/constants');
const { displayAppInfo, findApp, getAppInfo, getAssets, getPasscode, getPin } = require('../../src/helpers/helpers');
const { getListOfFunctionsAndAssets } = require('@twilio-labs/serverless-api/dist/utils/fs');
const { stdout } = require('stdout-stderr');

jest.mock('@twilio-labs/serverless-api/dist/utils/fs', () => ({
  getListOfFunctionsAndAssets: jest.fn(() => ({
    assets: [
      {
        name: 'index.html',
        path: 'index.html',
        content: 'mockHTMLcontent',
      },
    ],
  })),
}));

function getMockTwilioInstance(options) {
  const mockTwilioClient = {
    serverless: {},
  };

  const mockAppInstance = {
    assets: { list: () => Promise.resolve(options.hasAssets ? [{}] : []) },
  };

  mockAppInstance.environments = jest.fn(() => ({
    variables: {
      list: () =>
        Promise.resolve([
          { key: 'API_PASSCODE', value: '123456' },
          { key: 'API_PASSCODE_EXPIRY', value: '1590000000000' },
        ]),
    },
  }));
  mockAppInstance.environments.list = () =>
    Promise.resolve([{ sid: 'env', domainName: `${APP_NAME}-5678-dev.twil.io` }]);
  mockTwilioClient.serverless.services = jest.fn(() => Promise.resolve(mockAppInstance));
  mockTwilioClient.serverless.services.list = () =>
    Promise.resolve([
      {
        friendlyName: options.exists ? APP_NAME : 'other_service',
        sid: 'appSid',
      },
    ]);

  return mockTwilioClient;
}

describe('the getPin function', () => {
  it('should return a 6 digit number', () => {
    expect(getPin().toString()).toMatch(/^\d{6}$/);
  });
});

describe('the getPasscode function', () => {
  it('should get the "appID" from the domain name and return a passcode', () => {
    expect(getPasscode('https://video-app-1234-dev.twil.io', '123456')).toEqual('1234561234');
    expect(getPasscode('https://video-app-1234.twil.io', '123456')).toEqual('1234561234');
  });
});

describe('the getAssets function', () => {
  it('should add index.html at "/" and "/login" paths', async () => {
    expect(await getAssets('mockFolder')).toEqual([
      {
        name: 'index.html',
        path: 'index.html',
        content: 'mockHTMLcontent',
      },
      {
        name: 'index.html',
        path: '/',
        content: 'mockHTMLcontent',
      },
      {
        name: 'index.html',
        path: '/login',
        content: 'mockHTMLcontent',
      },
    ]);
  });

  it('should use the CWD when provided with a relative path', async () => {
    await getAssets('test-relative-path');
    expect(getListOfFunctionsAndAssets).toHaveBeenCalledWith(process.cwd(), {
      assetsFolderNames: ['test-relative-path'],
      functionsFolderNames: [],
    });
  });

  it('should use "/" as the CWD when provided with an absolute path', async () => {
    await getAssets('/test-absolute-path');
    expect(getListOfFunctionsAndAssets).toHaveBeenCalledWith('/', {
      assetsFolderNames: ['/test-absolute-path'],
      functionsFolderNames: [],
    });
  });
});

describe('the findApp function', () => {
  it('should return the app when it exists', async () => {
    const mockTwilioClient = {
      serverless: {
        services: {
          list: () => Promise.resolve([{ friendlyName: APP_NAME }]),
        },
      },
    };
    const result = await findApp.call({ twilioClient: mockTwilioClient });
    expect(result).toEqual({ friendlyName: APP_NAME });
  });

  it('should return undefined when it doesnt exist', async () => {
    const mockTwilioClient = {
      serverless: {
        services: {
          list: () => Promise.resolve([{ friendlyName: 'other service' }]),
        },
      },
    };
    const result = await findApp.call({ twilioClient: mockTwilioClient });
    expect(result).toEqual(undefined);
  });
});

describe('the getAppInfo function', () => {
  it('should return the correct information when there are no assets', async () => {
    const result = await getAppInfo.call({
      twilioClient: getMockTwilioInstance({ exists: true }),
    });
    expect(result).toEqual({
      expiry: 'Wed May 20 2020 12:40:00 GMT-0600',
      hasAssets: false,
      passcode: '1234565678',
      sid: 'appSid',
      url: 'https://video-app-5678-dev.twil.io?passcode=1234565678',
    });
  });

  it('should return the correct information when there are assets', async () => {
    const result = await getAppInfo.call({
      twilioClient: getMockTwilioInstance({ exists: true, hasAssets: true }),
    });
    expect(result).toEqual({
      expiry: 'Wed May 20 2020 12:40:00 GMT-0600',
      hasAssets: true,
      passcode: '1234565678',
      sid: 'appSid',
      url: 'https://video-app-5678-dev.twil.io?passcode=1234565678',
    });
  });

  it('return null when there is no app', async () => {
    const result = await getAppInfo.call({
      twilioClient: getMockTwilioInstance({ exists: false }),
    });
    expect(result).toBeNull();
  });
});

describe('the displayAppInfo function', () => {
  beforeEach(stdout.start);
  afterEach(stdout.stop);

  it('should display the correct information when there are no assets', async () => {
    await displayAppInfo.call({
      twilioClient: getMockTwilioInstance({ exists: true }),
    });
    expect(stdout.output).toMatchInlineSnapshot(`
      "Passcode: 1234565678
      Expires: Wed May 20 2020 12:40:00 GMT-0600
      "
    `);
  });

  it('should display the correct information when there are assets', async () => {
    await displayAppInfo.call({
      twilioClient: getMockTwilioInstance({ exists: true, hasAssets: true }),
    });
    expect(stdout.output).toMatchInlineSnapshot(`
      "Web App URL: https://video-app-5678-dev.twil.io?passcode=1234565678
      Passcode: 1234565678
      Expires: Wed May 20 2020 12:40:00 GMT-0600
      "
    `);
  });

  it('should display the correct information when there is no app', async () => {
    await displayAppInfo.call({
      twilioClient: getMockTwilioInstance({ exists: false }),
    });
    expect(stdout.output).toMatchInlineSnapshot(`
"There is no deployed app
"
`);
  });
});
