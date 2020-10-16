const { displayAppInfo } = require('../../../../helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class ViewCommand extends TwilioClientCommand {
  async run() {
    await super.run();
    await displayAppInfo.call(this);
  }
}

ViewCommand.flags = { ...TwilioClientCommand.flags };

ViewCommand.description = 'View a Programmable Video app';

ViewCommand.examples = [
  `$ twilio rtc:apps:video:view
Web App URL: https://video-app-1111-dev.twil.io?passcode=1111111111
Passcode: 1111111111
Edit your token server at: https://www.twilio.com/console/functions/editor/...`,
];

module.exports = ViewCommand;
