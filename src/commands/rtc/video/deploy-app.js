const { flags } = require('@oclif/command');
const { displayAppInfo, getAppInfo, getAssets, deploy } = require('./helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeployAppCommand extends TwilioClientCommand {
  async run() {
    await super.run();

    const appInfo = await getAppInfo.call(this);
    if (appInfo) {
      console.log('There is already a deployed app.');
    }

    const assets = await getAssets.call(this, this.flags.assets);
    await deploy.call(this, assets);
    await displayAppInfo.call(this);
  }
}

DeployAppCommand.flags = Object.assign(
  {
    assets: flags.string({
      description: 'Name of assets directory to use',
      required: true
    })
  },
  TwilioClientCommand.flags
);

module.exports = DeployAppCommand;
