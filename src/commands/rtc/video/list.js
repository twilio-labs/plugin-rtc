const { displayAppInfo } = require('../../../helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class ListCommand extends TwilioClientCommand {
  async run() {
    await super.run();
    await displayAppInfo.call(this);
  }
}

ListCommand.flags = Object.assign(TwilioClientCommand.flags);

module.exports = ListCommand;
