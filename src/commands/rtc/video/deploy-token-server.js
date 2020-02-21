const { displayAppInfo, getAppInfo, deploy } = require('../../../helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeployTokenServerCommand extends TwilioClientCommand {
  async run() {
    await super.run();

    const appInfo = await getAppInfo.call(this);
    if (appInfo) {
      console.log('There is already a deployed app.');
    }

    await deploy.call(this, assets);
    await displayAppInfo.call(this);
  }
}

DeployTokenServerCommand.flags = Object.assign(TwilioClientCommand.flags);

module.exports = DeployTokenServerCommand;
