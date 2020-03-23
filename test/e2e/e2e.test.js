const { APP_NAME } = require('../../src/constants');
const DeleteCommand = require('../../src/commands/rtc/apps/video/delete');
const DeployCommand = require('../../src/commands/rtc/apps/video/deploy');
const ViewCommand = require('../../src/commands/rtc/apps/video/view');

const jwt = require('jsonwebtoken');
const path = require('path');
const { stdout } = require('stdout-stderr');
const superagent = require('superagent');

// Uncomment to see output from CLI
// stdout.print = true;

jest.setTimeout(30000);

function getPasscode(output) {
  const match = output.match(/Passcode: (\d{10})/);
  return match ? match[1] : null;
}

function getWebAppURL(output) {
  const match = output.match(/Web App URL: (.+)\n/);
  return match ? match[1] : null;
}

function getURL(output) {
  const passcode = getPasscode(output);
  return `https://${APP_NAME}-${passcode.slice(6)}-dev.twil.io`;
}

describe('the RTC Twilio-CLI Plugin', () => {
  beforeAll(async () => {
    await DeleteCommand.run([]);
  });

  describe('with no app deployed', () => {
    describe('the list command', () => {
      it('should state that no app is deployed', async () => {
        stdout.start();
        await ViewCommand.run([]);
        stdout.stop();
        expect(stdout.output).toContain('There is no deployed app');
      });
    });

    describe('the delete command', () => {
      it('should state that there is no app to delete', async () => {
        stdout.start();
        await DeleteCommand.run([]);
        stdout.stop();
        expect(stdout.output).toContain('There is no app to delete');
      });
    });

    describe('the deploy command', () => {
      it('should display an error when the provided app-directory does not exist', async () => {
        stdout.start();
        await DeployCommand.run(['--authentication', 'passcode', '--app-directory', 'non-existant-path']);
        stdout.stop();
        expect(stdout.output).toEqual('The provided app-directory does not exist.\n');
      });

      it('should display an error when the provided app-directory is not a directory', async () => {
        stdout.start();
        await DeployCommand.run(['--authentication', 'passcode', '--app-directory', __filename]);
        stdout.stop();
        expect(stdout.output).toEqual('The provided app-directory is not a directory.\n');
      });

      it('should display an error when the provided app-directory does not contain an index.html file', async () => {
        stdout.start();
        await DeployCommand.run(['--authentication', 'passcode', '--app-directory', __dirname]);
        stdout.stop();
        expect(stdout.output).toEqual(
          'The provided app-directory does not appear to be a valid app. There is no index.html found in the app-directory.\n'
        );
      });
    });
  });

  describe('after deploying a video app', () => {
    let URL;
    let webAppURL;
    let passcode;

    beforeAll(async done => {
      stdout.start();
      await DeployCommand.run([
        '--authentication',
        'passcode',
        '--app-directory',
        path.join(__dirname, '../test-assets'),
      ]);
      stdout.stop();
      passcode = getPasscode(stdout.output);
      URL = getURL(stdout.output);
      webAppURL = getWebAppURL(stdout.output);
      done();
    });

    afterAll(async () => {
      await DeleteCommand.run([]);
    });

    describe('the view command', () => {
      it('should correctly display the deployment details', async () => {
        stdout.start();
        await ViewCommand.run([]);
        stdout.stop();
        expect(stdout.output).toMatch(/Web App URL: .+\nPasscode: \d{10}\nExpires: .+/);
      });
    });

    describe('the deploy command', () => {
      it('should return a video token when the correct passcode is provided', async () => {
        const { body } = await superagent
          .post(`${URL}/token`)
          .send({ passcode, room_name: 'test-room', user_identity: 'test user' });
        expect(jwt.decode(body.token).grants).toEqual({ identity: 'test user', video: { room: 'test-room' } });
      });

      it('should return a 401 error when an incorrect passcode is provided', () => {
        superagent
          .post(`${URL}/token`)
          .send({ passcode: '0000' })
          .catch(e => expect(e.status).toBe(401));
      });

      it('should display a URL which returns the web app', async () => {
        const { text } = await superagent.get(webAppURL);
        expect(text).toEqual('<html>test</html>');
      });

      it('should return the web app from "/login"', async () => {
        const webAppURL = URL;
        const { text } = await superagent.get(webAppURL + '/login');
        expect(text).toEqual('<html>test</html>');
      });

      it('should not redeploy the app when no --override flag is passed', async () => {
        stdout.start();
        await DeployCommand.run([
          '--authentication',
          'passcode',
          '--app-directory',
          path.join(__dirname, '../test-assets'),
        ]);
        stdout.stop();
        expect(stdout.output).toContain('A Video app is already deployed. Use the --override flag to override the existing deployment.');
      });
    });
  });

  describe('after deploying a token server', () => {
    let URL;
    let passcode;
    let webAppURL;

    beforeAll(async done => {
      stdout.start();
      await DeployCommand.run(['--authentication', 'passcode']);
      stdout.stop();
      passcode = getPasscode(stdout.output);
      URL = getURL(stdout.output);
      webAppURL = getWebAppURL(stdout.output);
      done();
    });

    afterAll(async () => {
      await DeleteCommand.run([]);
    });

    describe('the view command', () => {
      it('should correctly display the deployment details', async () => {
        stdout.start();
        await ViewCommand.run([]);
        stdout.stop();
        expect(stdout.output).toMatch(/Passcode: \d{10}\nExpires: .+/);
        expect(stdout.output).not.toMatch(/Web App URL:/)
      });
    });

    describe('the deploy command', () => {
      it('should return a video token when the correct passcode is provided', async () => {
        const { body } = await superagent
          .post(`${URL}/token`)
          .send({ passcode, room_name: 'test-room', user_identity: 'test user' });
        expect(jwt.decode(body.token).grants).toEqual({ identity: 'test user', video: { room: 'test-room' } });
      });

      it('should return a 401 error when an incorrect passcode is provided', () => {
        superagent
          .post(`${URL}/token`)
          .send({ passcode: '0000' })
          .catch(e => expect(e.status).toBe(401));
      });

      it('should not display an app URL', () => {
        expect(webAppURL).toBeNull();
      });

      it('should return a 404 from "/"', () => {
        superagent.get(`${URL}`).catch(e => expect(e.status).toBe(404));
      });
    });
  });
});
