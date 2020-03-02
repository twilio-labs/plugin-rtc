const { flags } = require('@oclif/command');
const { displayAppInfo, getAppInfo, deploy } = require('../../../helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeployAppCommand extends TwilioClientCommand {
  async run() {
    await super.run();

    const appInfo = await getAppInfo.call(this);

    if (appInfo) {
      if (this.flags.override) {
        await this.twilioClient.serverless.services(appInfo.sid).remove();
        console.log(`Removed app with Passcode: ${appInfo.passcode}`);
      } else {
        console.log('A Video app is already deployed.');
        await displayAppInfo.call(this);
      }
    } else {
      await deploy.call(this);
      await displayAppInfo.call(this);
    }
  }
}

DeployAppCommand.flags = Object.assign(
  {
    'app-directory': flags.string({
      description: 'Name of app directory to use',
      required: false
    }),
    authentication: flags.enum({
      options: ['passcode'],
      description: 'Type of authentication to use',
      required: true
    }),
    override: flags.boolean({
      required: true,
      default: false,
      description: 'Override an existing App deployment'
    })
  },
  TwilioClientCommand.flags
);

module.exports = DeployAppCommand;
