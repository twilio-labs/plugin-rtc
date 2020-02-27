const { displayAppInfo, findApp, renew } = require('../../../helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class RefreshAppPasscodeCommand extends TwilioClientCommand {
  async run() {
    await super.run();
    const app = await findApp.call(this);

    if (app) {
      await renew.call(this, app.sid);
      await displayAppInfo.call(this);
    } else {
      console.log('no app');
    }
  }
}

RefreshAppPasscodeCommand.flags = Object.assign(TwilioClientCommand.flags);

module.exports = RefreshAppPasscodeCommand;
