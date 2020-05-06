const { APP_NAME } = require('../../src/constants');
const {
  deploy,
  displayAppInfo,
  findApp,
  getAppInfo,
  getAssets,
  getPasscode,
  getPin,
  verifyAppDirectory,
} = require('../../src/helpers');
const { getListOfFunctionsAndAssets } = require('@twilio-labs/serverless-api/dist/utils/fs');
const path = require('path');
const { stdout } = require('stdout-stderr');

const mockDeployProject = jest.fn(() => Promise.resolve());

jest.mock('@twilio-labs/serverless-api', () => ({
  TwilioServerlessApiClient: function() {
    return {
      deployProject: mockDeployProject,
    };
  },
}));

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

describe('the verifyAppDirectory function', () => {
  it('should throw an error when the provided path does not exist', () => {
    expect(() => verifyAppDirectory('non-existant-path')).toThrowError('The provided app-directory does not exist.');
  });

  it('should throw an error when the provided path does is not a directory', () => {
    expect(() => verifyAppDirectory(__filename)).toThrowError('The provided app-directory is not a directory.');
  });

  it('should throw an error when the provided path does not contain index.html', () => {
    expect(() => verifyAppDirectory(__dirname)).toThrowError(
      'The provided app-directory does not appear to be a valid app. There is no index.html found in the app-directory.'
    );
  });

  it('should not an error when the provided path is a directory that contains index.html', () => {
    expect(verifyAppDirectory(path.join(__dirname, '../test-assets'))).toBe(undefined);
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
        name: '/',
        path: '/',
        content: 'mockHTMLcontent',
      },
      {
        name: '/login',
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
      expiry: 'Wed May 20 2020 18:40:00 GMT+0000',
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
      expiry: 'Wed May 20 2020 18:40:00 GMT+0000',
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
      Expires: Wed May 20 2020 18:40:00 GMT+0000
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
      Expires: Wed May 20 2020 18:40:00 GMT+0000
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

describe('the deploy function', () => {
  it('should set serviceSid when appInfo exists', async () => {
    await deploy.call({
      twilioClient: {
        username: '',
        password: '',
      },
      appInfo: {
        sid: '1234',
      },
      flags: {},
    });

    expect(mockDeployProject.mock.calls[0][0].serviceSid).toBe('1234');
    expect(mockDeployProject.mock.calls[0][0].serviceName).toBe(undefined);
  });

  it('should set serviceName when appInfo doesnt exist', async () => {
    await deploy.call({
      twilioClient: {
        username: '',
        password: '',
      },
      flags: {},
    });
    expect(mockDeployProject.mock.calls[0][0].serviceSid).toBe(undefined);
    expect(mockDeployProject.mock.calls[0][0].serviceName).toBe(APP_NAME);
  });

  it('should display an error when the API key is not provided', () => {
    return expect(
      deploy.call({
        twilioClient: {
          username: 'testAccountSid',
          password: 'testAuthToken',
          accountSid: 'testAccountSid',
        },
        flags: {},
      })
    ).rejects.toMatchInlineSnapshot(`
[Error: No API Key found.

Please login to the Twilio CLI to create an API key:

twilio login

Alternatively, the Twilio CLI can use credentials stored in these environment variables:

TWILIO_ACCOUNT_SID = your Account SID from twil.io/console
TWILIO_API_KEY = an API Key created at twil.io/get-api-key
TWILIO_API_SECRET = the secret for the API Key]
`);
  });
});
