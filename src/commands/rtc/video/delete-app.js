const { getAppInfo } = require('../../../helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeleteAppCommand extends TwilioClientCommand {
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

DeleteAppCommand.flags = Object.assign(TwilioClientCommand.flags);

module.exports = DeleteAppCommand;
