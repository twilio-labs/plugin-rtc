const { getAppInfo } = require('../../../../helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeleteCommand extends TwilioClientCommand {
  async run() {
    await super.run();
    const appInfo = await getAppInfo.call(this);

    if (appInfo) {
      await this.twilioClient.serverless.services(appInfo.sid).remove();
      console.log(`Removed app with Passcode: ${appInfo.passcode}`);
    } else {
      console.log('There is no app to delete');
    }
  }
}

DeleteCommand.flags = { ...TwilioClientCommand.flags };

DeleteCommand.description = 'Delete a Programmable Video app';

DeleteCommand.examples = [
  `$ twilio rtc:apps:video:delete
Removed app with Passcode: 1111111111`,
];

module.exports = DeleteCommand;
