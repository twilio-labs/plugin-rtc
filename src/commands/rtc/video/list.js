const { displayAppInfo } = require('../../../helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class ListCommand extends TwilioClientCommand {
  async run() {
    await super.run();
    await displayAppInfo.call(this);
  }
}

ListCommand.flags = { ...TwilioClientCommand.flags };

ListCommand.description = 'View a Programmable Video app';

ListCommand.examples = [
  `
$ twilio rtc:video:list
Web App URL: https://video-app-1111-dev.twil.io?passcode=1111111111
Passcode: 1111111111`,
];

module.exports = ListCommand;
