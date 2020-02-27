const { flags } = require('@oclif/command');
const { displayAppInfo, getAppInfo, getAssets, deploy } = require('../../../helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeployAppCommand extends TwilioClientCommand {
  async run() {
    await super.run();

    const appInfo = await getAppInfo.call(this);
    if (appInfo) {
      console.log('There is already a deployed app.');
      return;
    }

    await deploy.call(this);
    await displayAppInfo.call(this);
  }
}

DeployAppCommand.flags = Object.assign(
  {
    'app-directory': flags.string({
      description: 'Name of app directory to use',
      required: false
    }),
    'authentication': flags.enum({
      options: ['passcode'],
      description: 'Type of authentication to use',
      required: true
    }),
  },
  TwilioClientCommand.flags
);

module.exports = DeployAppCommand;
