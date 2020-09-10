const { flags } = require('@oclif/command');
const { displayAppInfo, getAppInfo, deploy, verifyAppDirectory } = require('../../../../helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeployCommand extends TwilioClientCommand {
  async run() {
    await super.run();

    if (this.flags['app-directory']) {
      try {
        verifyAppDirectory(this.flags['app-directory']);
      } catch (err) {
        console.log(err.message);
        return;
      }
    }

    this.appInfo = await getAppInfo.call(this);

    if (this.appInfo && !this.flags.override) {
      console.log('A Video app is already deployed. Use the --override flag to override the existing deployment.');
      await displayAppInfo.call(this);
      return;
    }
    await deploy.call(this);
    await displayAppInfo.call(this);
  }
}
DeployCommand.flags = Object.assign(
  {
    'app-directory': flags.string({
      description: 'Name of app directory to use',
      required: false,
    }),
    authentication: flags.enum({
      options: ['passcode'],
      description: 'Type of authentication to use',
      required: true,
    }),
    override: flags.boolean({
      required: false,
      default: false,
      description: 'Override an existing App deployment',
    }),
    'room-type': flags.enum({
      options: ['group', 'group-small', 'peer-to-peer', 'peer-to-peer-basic'],
      description: 'Type of room to use',
      required: false,
      default: 'group',
    }),
  },
  TwilioClientCommand.flags
);

DeployCommand.usage = 'rtc:apps:video:deploy --authentication <auth>';

DeployCommand.description = `Deploy a Programmable Video app 

This command publishes two components as a Twilio Function: an application token
server and an optional React application.

Token Server
The token server provides Programmable Video access tokens and authorizes
requests with the specified authentication mechanism.

React Application
The commands includes support for publishing a Programmable Video React
Application. For more details using this plugin with the Programmable Video
React application, please visit the project's home page.
https://github.com/twilio/twilio-video-app-react
`;

DeployCommand.examples = [
  `# Deploy an application token server with passcode authentication
$ twilio rtc:apps:video:deploy --authentication passcode
deploying app... done
Passcode: xxx xxx xxxx xxxx
Expires: Mon Mar 09 2020 16:36:23 GMT-0600
Room Type: group`,
  `
# Deploy an application token server with the React app
$ twilio rtc:apps:video:deploy --authentication passcode --app-directory /path/to/app
deploying app... done
Web App URL: https://video-app-xxxx-xxxx-dev.twil.io?passcode=xxxxxxxxxxxxxx
Passcode: xxx xxx xxxx xxxx
Expires: Mon Mar 09 2020 16:36:23 GMT-0600
Room Type: group`,
  `
# Override an existing app with a fresh deployment
# Please note that this will remove a previously deployed web application if no
# app directory is provided
$ twilio rtc:apps:video:deploy --authentication passcode --override 
Removed app with Passcode: xxx xxx xxxx xxxx
deploying app... done
Passcode: yyy yyy yyyy yyyy
Expires: Mon Mar 09 2020 16:36:23 GMT-0600
Room Type: group`,
  `
# Deploy an application token server with a specific room type
$ twilio rtc:apps:video:deploy --authentication passcode --room-type peer-to-peer
deploying app... done
Passcode: xxx xxx xxxx xxxx
Expires: Mon Mar 09 2020 16:36:23 GMT-0600
Room Type: peer-to-peer`,
];

module.exports = DeployCommand;
