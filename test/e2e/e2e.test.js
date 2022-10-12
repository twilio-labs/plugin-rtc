const { APP_NAME } = require('../../src/constants');
const DeleteCommand = require('../../src/commands/rtc/apps/video/delete');
const DeployCommand = require('../../src/commands/rtc/apps/video/deploy');
const ViewCommand = require('../../src/commands/rtc/apps/video/view');

const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const path = require('path');
const { stdout } = require('stdout-stderr');
const superagent = require('superagent');

const twilioClient = require('twilio')(process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID, 
});


// Uncomment to see output from CLI
// stdout.print = true;

jest.setTimeout(80000);

jest.mock('../../src/constants', () => ({
  APP_NAME: 'video-app-e2e-tests',
}));

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPasscode(output) {
  const match = output.match(/Passcode: ([\d\s]+)\n/);
  return match ? match[1].replace(/\s+/g, '') : null;
}

function getWebAppURL(output) {
  const match = output.match(/Web App URL: (.+)\n/);
  return match ? match[1] : null;
}

function getURL(output) {
  const passcode = getPasscode(output);
  return `https://${APP_NAME}-${passcode.slice(6, 10)}-${passcode.slice(10)}-dev.twil.io`;
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
      await delay(60000);
      return await DeleteCommand.run([]);
    });

    describe('the view command', () => {
      it('should correctly display the deployment details', async () => {
        stdout.start();
        await ViewCommand.run([]);
        stdout.stop();
        expect(stdout.output).toMatch(
          /Web App URL: .+\nPasscode: \d{3} \d{3} \d{4} \d{4}\nExpires: .+\nRoom Type: group\nEdit your token server at: https:\/\/www.twilio.com\/console\/functions\/editor\/ZS\w{32}\/environment\/ZE\w{32}\/function\/ZH\w{32}/
        );
      });
    });

    describe('the serverless deployment', () => {
      it('should create a group room and return a video token when the correct passcode is provided', async () => {
        const ROOM_NAME = nanoid();
        const { body } = await superagent
          .post(`${URL}/token`)
          .send({ passcode, room_name: ROOM_NAME, user_identity: 'test user' });
        expect(jwt.decode(body.token).grants).toEqual(
          expect.objectContaining({ identity: 'test user', video: { room: ROOM_NAME } })
        );
        expect(body.room_type).toEqual('group');

        const room = await twilioClient.video.rooms(ROOM_NAME).fetch();
        expect(room.type).toEqual('group');
      });

      it('should return a video token with a valid Chat Grant and add the participant to the conversation', async () => {
        const ROOM_NAME = nanoid();
        const { body } = await superagent
          .post(`${URL}/token`)
          .send({ passcode, room_name: ROOM_NAME, user_identity: 'test user', create_conversation: true });

        const conversationServiceSid = jwt.decode(body.token).grants.chat.service_sid;

        const room = await twilioClient.video.rooms(ROOM_NAME).fetch();

        // Find the deployed conversations service
        const deployedConversationsServices = await twilioClient.conversations.services.list();
        const deployedConversationsService = deployedConversationsServices.find(
          service => (service.sid = conversationServiceSid)
        );

        // Find the conversation participant
        const conversationParticipants = await twilioClient.conversations
          .services(deployedConversationsService.sid)
          .conversations(room.sid)
          .participants.list();
        const conversationParticipant = conversationParticipants.find(
          participant => participant.identity === 'test user'
        );

        expect(deployedConversationsService).toBeDefined();
        expect(conversationParticipant).toBeDefined();
      });

      it('should return a video token without creating a room when the "create_room" flag is false', async () => {
        expect.assertions(3);
        const ROOM_NAME = nanoid();
        const { body } = await superagent
          .post(`${URL}/token`)
          .send({ passcode, room_name: ROOM_NAME, user_identity: 'test user', create_room: false });
        expect(jwt.decode(body.token).grants).toEqual(
          expect.objectContaining({ identity: 'test user', video: { room: ROOM_NAME } })
        );
        expect(body.room_type).toEqual('group');

        try {
          await twilioClient.video.rooms(ROOM_NAME).fetch();
        } catch (e) {
          expect(e).toMatchObject({ status: 404 });
        }
      });

      it('should return a video token without creating a conversation when the "create_conversation" flag is false', async () => {
        const ROOM_NAME = nanoid();
        const { body } = await superagent
          .post(`${URL}/token`)
          .send({ passcode, room_name: ROOM_NAME, user_identity: 'test user', create_conversation: false });

        const conversationServiceSid = jwt.decode(body.token).grants.chat.service_sid;

        const room = await twilioClient.video.rooms(ROOM_NAME).fetch();

        // Find the deployed conversations service
        const deployedConversationsServices = await twilioClient.conversations.services.list();
        const deployedConversationsService = deployedConversationsServices.find(
          service => (service.sid = conversationServiceSid)
        );

        const conversationPromise = twilioClient.conversations
          .services(deployedConversationsService.sid)
          .conversations(room.sid)
          .fetch();

        expect(conversationPromise).rejects.toEqual(expect.objectContaining({ code: 20404 }));
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
    });

    describe('the deploy command', () => {
      it('should not redeploy the app when no --override flag is passed', async () => {
        stdout.start();
        await DeployCommand.run([
          '--authentication',
          'passcode',
          '--app-directory',
          path.join(__dirname, '../test-assets'),
        ]);
        stdout.stop();
        expect(stdout.output).toContain(
          'A Video app is already deployed. Use the --override flag to override the existing deployment.'
        );
      });

      it('should redeploy the app when --override flag is passed', async () => {
        stdout.start();
        await DeployCommand.run([
          '--authentication',
          'passcode',
          '--override',
          '--app-directory',
          path.join(__dirname, '../test-assets'),
        ]);
        stdout.stop();
        const updatedPasscode = getPasscode(stdout.output);
        const testURL = getURL(stdout.output);
        const testWebAppURL = getWebAppURL(stdout.output);
        expect(updatedPasscode).not.toEqual(passcode);
        expect(testURL).toEqual(URL);
        const { text } = await superagent.get(testWebAppURL + '/login');
        expect(text).toEqual('<html>test</html>');
      });

      it('should redeploy the token server when no app-directory is set and when --override flag is true', async () => {
        stdout.start();
        await DeployCommand.run(['--authentication', 'passcode', '--override']);
        stdout.stop();
        const updatedPasscode = getPasscode(stdout.output);
        const testURL = getURL(stdout.output);
        const testWebAppURL = getWebAppURL(stdout.output);
        expect(updatedPasscode).not.toEqual(passcode);
        expect(testURL).toEqual(URL);
        superagent.get(`${testWebAppURL}`).catch(e => expect(e.status).toBe(404));
      });
    });
  });

  describe('after deploying a token server (with go rooms)', () => {
    let URL;
    let passcode;
    let webAppURL;

    beforeAll(async done => {
      stdout.start();
      await DeployCommand.run(['--authentication', 'passcode', '--room-type', 'go']);
      stdout.stop();
      passcode = getPasscode(stdout.output);
      URL = getURL(stdout.output);
      webAppURL = getWebAppURL(stdout.output);
      done();
    });

    afterAll(async () => {
      await delay(60000);
      return await DeleteCommand.run([]);
    });

    describe('the view command', () => {
      it('should correctly display the deployment details', async () => {
        stdout.start();
        await ViewCommand.run([]);
        stdout.stop();
        expect(stdout.output).toMatch(
          /Passcode: \d{3} \d{3} \d{4} \d{4}\nExpires: .+\nRoom Type: go\nEdit your token server at: https:\/\/www.twilio.com\/console\/functions\/editor\/ZS\w{32}\/environment\/ZE\w{32}\/function\/ZH\w{32}/
        );
        expect(stdout.output).not.toMatch(/Web App URL:/);
      });
    });

    describe('the serverless deployment', () => {
      it('should create a go room and return a video token when the correct passcode is provided', async () => {
        const ROOM_NAME = nanoid();
        const { body } = await superagent
          .post(`${URL}/token`)
          .send({ passcode, room_name: ROOM_NAME, user_identity: 'test user' });
        expect(jwt.decode(body.token).grants).toEqual(
          expect.objectContaining({ identity: 'test user', video: { room: ROOM_NAME } })
        );
        expect(body.room_type).toEqual('go');

        const room = await twilioClient.video.rooms(ROOM_NAME).fetch();
        expect(room.type).toEqual('go');
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

    describe('the deploy command', () => {
      it('should redeploy the token server when --override flag is passed', async () => {
        stdout.start();
        await DeployCommand.run(['--authentication', 'passcode', '--override']);
        stdout.stop();

        const updatedPasscode = getPasscode(stdout.output);
        const testURL = getURL(stdout.output);
        expect(updatedPasscode).not.toEqual(passcode);
        expect(testURL).toEqual(URL);

        const { body } = await superagent
          .post(`${testURL}/token`)
          .send({ passcode: updatedPasscode, room_name: 'test-room', user_identity: 'test user' });
        expect(jwt.decode(body.token).grants).toEqual(
          expect.objectContaining({ identity: 'test user', video: { room: 'test-room' } })
        );
      });
    });
  });
});
