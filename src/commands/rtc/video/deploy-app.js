const { flags } = require('@oclif/command');
const { displayAppInfo, getAppInfo, deploy } = require('../../../helpers/helpers');
const { TwilioClientCommand } = require('@twilio/cli-core').baseCommands;

class DeployAppCommand extends TwilioClientCommand {
  static usage = 'twilio rtc:video:deploy-app --authentication <auth>'

  static description = `
Deploy a Programmable Video app 

This command publishes two components as a Twilio Function: an application token server and an optional React application.

Token Server
The token server provides Programmable Video access tokens and authorizes requests with the specified authentication mechanism.

React Application
The commands includes support for publishing a Programmable Video React Application. For more details using this plugin with the Programmable Video React application, please visit the project's home page. https://github.com/twilio/twilio-video-app-react
`
  
  static examples = [
    `
# Deploy an application token server with passcode authentication
$ twilio rtc:video:deploy-app --authentication passcode
deploying app... done
Passcode: 1111111111`,
    `
# Deploy an application token server with the React app
$ twilio rtc:video:deploy-app --authentication passcode --app-directory /path/to/app
deploying app... done
Web App URL: https://video-app-1111-dev.twil.io?passcode=1111111111
Passcode: 1111111111`,
  ]

  async run() {
    await super.run();

    const appInfo = await getAppInfo.call(this);

    if (appInfo) {
      await this.twilioClient.serverless.services(appInfo.sid).remove();
      console.log(`Removed app with Passcode: ${appInfo.passcode}`);
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
    authentication: flags.enum({
      options: ['passcode'],
      description: 'Type of authentication to use',
      required: true
    })
  },
  TwilioClientCommand.flags
);

module.exports = DeployAppCommand;
