const { test } = require('@oclif/test');
const superagent = require('superagent');
const jwt = require('jsonwebtoken');
const path = require('path');
const { APP_NAME } = require('../../src/constants');

jest.setTimeout(30000);

function getPasscode(ctx) {
  const match = ctx.stdout.match(/\nPasscode: (\d{10})/);
  return match ? match[1] : null;
}

function getURL(passcode) {
  return `https://${APP_NAME}-${passcode.slice(6)}-dev.twil.io`;
}

const testCLIPlugin = test
  .env({
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN
  })
  .stdout();

describe('the RTC Twilio-CLI Plugin', () => {
  beforeAll(() => {
    testCLIPlugin.command(['rtc:video:delete-app']);
  });

  afterEach(() => {
    testCLIPlugin.command(['rtc:video:delete-app']);
  });

  testCLIPlugin
    .command(['rtc:video:deploy-app', '--authentication', 'passcode'])
    .add('passcode', ctx => getPasscode(ctx))
    .do(async ctx => {
      const { body } = await superagent
        .post(`${getURL(ctx.passcode)}/token`)
        .send({ passcode: ctx.passcode, room_name: 'test-room', user_identity: 'test user' });
      expect(jwt.decode(body.token).grants).toEqual({ identity: 'test user', video: { room: 'test-room' } });
    })
    .it('should deploy a token server');

  testCLIPlugin
    .command([
      'rtc:video:deploy-app',
      '--authentication',
      'passcode',
      '--app-directory',
      path.join(__dirname, 'test-assets')
    ])
    .add('passcode', ctx => getPasscode(ctx))
    .do(async ctx => {
      const { text } = await superagent.get(`${getURL(ctx.passcode)}`);
      expect(text).toEqual('<html>test</html>');
    })
    .do(async ctx => {
      const { text } = await superagent.get(`${getURL(ctx.passcode)}/login`);
      expect(text).toEqual('<html>test</html>');
    })
    .it('should deploy a token server with assets');
});
