const { APP_NAME } = require('../../src/constants');
const { findApp, getAssets, getPasscode, getPin } = require('../../src/helpers/helpers');

jest.mock('@twilio-labs/serverless-api/dist/utils/fs', () => ({
  getListOfFunctionsAndAssets: () => ({
    assets: [
      {
        name: 'index.html',
        path: 'index.html',
        content: 'mockHTMLcontent'
      }
    ]
  })
}));

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
        content: 'mockHTMLcontent'
      },
      {
        name: 'index.html',
        path: '/',
        content: 'mockHTMLcontent'
      },
      {
        name: 'index.html',
        path: '/login',
        content: 'mockHTMLcontent'
      }
    ]);
  });
});

describe('the findApp function', () => {
  it('should return the app when it exists', async () => {
    const mockTwilioClient = {
      serverless: {
        services: {
          list: () => Promise.resolve([{ friendlyName: APP_NAME }])
        }
      }
    };
    const result = await findApp.call({ twilioClient: mockTwilioClient });
    expect(result).toEqual({ friendlyName: APP_NAME });
  });

  it('should return undefined when it doesnt exist', async () => {
    const mockTwilioClient = {
      serverless: {
        services: {
          list: () => Promise.resolve([{ friendlyName: 'other service' }])
        }
      }
    };
    const result = await findApp.call({ twilioClient: mockTwilioClient });
    expect(result).toEqual(undefined);
  });
});
