const { APP_NAME } = require('../../src/constants');
const jwt = require('jsonwebtoken');
const path = require('path');
const superagent = require('superagent');
const { test } = require('@oclif/test');

jest.setTimeout(30000);

function getPasscode(ctx) {
  const match = ctx.stdout.match(/Passcode: (\d{10})/);
  return match ? match[1] : null;
}

function getURL(passcode) {
  return `https://${APP_NAME}-${passcode.slice(6)}-dev.twil.io`;
}

const testCLIPlugin = test
  .env({
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  })
  .command(['rtc:video:delete-app']);

describe('the RTC Twilio-CLI Plugin deploy command', () => {
  testCLIPlugin
    .only()
    .stdout()
    .command(['rtc:video:deploy-app', '--authentication', 'passcode'])
    .add('passcode', ctx => getPasscode(ctx))
    .do(async ctx => {
      try {
        await superagent.get(`${getURL(ctx.passcode)}/`);
      } catch (e) {
        expect(e.status).toEqual(404);
      }
    })
    .do(async ctx => {
      const { body } = await superagent
        .post(`${getURL(ctx.passcode)}/token`)
        .send({ passcode: ctx.passcode, room_name: 'test-room', user_identity: 'test user' });
      expect(jwt.decode(body.token).grants).toEqual({ identity: 'test user', video: { room: 'test-room' } });
    })
    .it('should deploy a token server without assets');

  testCLIPlugin
    .stdout()
    .command([
      'rtc:video:deploy-app',
      '--authentication',
      'passcode',
      '--app-directory',
      path.join(__dirname, 'test-assets'),
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

  testCLIPlugin
    .command(['rtc:video:deploy-app', '--authentication', 'passcode'])
    .stdout()
    .command(['rtc:video:deploy-app', '--authentication', 'passcode'])
    .it('should not re-deploy without --override flag', ctx => {
      expect(ctx.stdout).toContain('A Video app is already deployed.');
    });
});
