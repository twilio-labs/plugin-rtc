
const DeleteCommand = require('../../src/commands/rtc/apps/video/delete');
const DeployCommand = require('../../src/commands/rtc/apps/video/deploy');
const ViewCommand = require('../../src/commands/rtc/apps/video/view');

const { stdout } = require('stdout-stderr');


// Uncomment to see output from CLI
// stdout.print = true;

jest.setTimeout(80000);


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

});
