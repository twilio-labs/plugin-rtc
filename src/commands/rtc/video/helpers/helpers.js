const { APP_NAME } = require('../../../../constants');
const { cli } = require('cli-ux');
const fs = require('fs');
const { getListOfFunctionsAndAssets } = require('@twilio-labs/serverless-api/dist/utils/fs');
const moment = require('moment');
const path = require('path');
const { TwilioServerlessApiClient } = require('@twilio-labs/serverless-api');

function getPin() {
  return Math.floor(Math.random() * 900000) + 100000;
}

async function renew(appSid) {
  await updateVariable.call(this, appSid, 'API_SECRET', getPin());
  await updateVariable.call(this, appSid, 'API_EXPIRY', Date.now() + 1000 * 60 * 3);
}

function getAppCode(domain, passcode) {
  const regex = new RegExp(`${APP_NAME}-(\\d*)-dev.twil.io`);
  const urlcode = domain.match(regex)[1];
  return `${passcode}${urlcode}`;
}

async function getAssets(folder) {
  const { assets } = await getListOfFunctionsAndAssets(process.cwd(), {
    functionsFolderNames: [],
    assetsFolderNames: [folder]
  });

  const indexHTML = assets.find(asset => asset.name.includes('index.html'));

  if (indexHTML) {
    assets.push({
      ...indexHTML,
      path: '/'
    });
  }

  return assets;
}

async function findApp() {
  const services = await this.twilioClient.serverless.services.list();
  return services.find(service => service.friendlyName === APP_NAME);
}

async function getAppInfo() {
  const app = await findApp.call(this);

  if (!app) return null;

  const appInstance = await this.twilioClient.serverless.services(app.sid);

  const [environment] = await appInstance.environments.list();

  const variables = await appInstance.environments(environment.sid).variables.list();

  const assets = await appInstance.assets.list();

  const passcodeVar = variables.find(v => v.key === 'API_SECRET');
  const expiryVar = variables.find(v => v.key === 'API_EXPIRY');

  const passcode = passcodeVar ? passcodeVar.value : '';
  const expiry = expiryVar ? expiryVar.value : '';

  const appcode = getAppCode(environment.domainName, passcode);

  return {
    url: `https://${environment.domainName}?appcode=${appcode}`,
    expiry: moment(Number(expiry)).toString(),
    sid: app.sid,
    appcode,
    hasAssets: Boolean(assets.length)
  };
}

async function displayAppInfo() {
  const appInfo = await getAppInfo.call(this);

  if (!appInfo) {
    console.log('There is no deployed app');
  }

  if (appInfo.hasAssets) {
    console.log(`Web App URL: ${appInfo.url}`);
  }
  console.log(`App Code: ${appInfo.appcode}`);
  console.log(`Expires: ${appInfo.expiry}`);
}

async function updateVariable(appSid, varName, varValue) {
  const appInstance = await this.twilioClient.serverless.services(appSid);
  const [environment] = await appInstance.environments.list();
  const variables = await appInstance.environments(environment.sid).variables.list();
  const varSid = variables.find(v => v.key === varName).sid;
  await appInstance
    .environments(environment.sid)
    .variables(varSid)
    .update({ value: varValue });
}

async function deploy(assets) {
  const serverlessClient = new TwilioServerlessApiClient({
    accountSid: this.twilioClient.username,
    authToken: this.twilioClient.password
  });

  const pin = getPin();
  const expiryTime = Date.now() + 1000 * 60 * 5;

  const fn = fs.readFileSync(path.join(__dirname, '../function.js'));

  cli.action.start('deploying app');

  const deployOptions = {
    env: {
      TWILIO_ACCOUNT_SID: this.twilioClient.accountSid,
      TWILIO_API_KEY_SID: this.twilioClient.username,
      TWILIO_API_KEY_SECRET: this.twilioClient.password,
      API_SECRET: pin,
      API_EXPIRY: expiryTime
    },
    pkgJson: {},
    serviceName: APP_NAME,
    functionsEnv: 'dev',
    functions: [
      {
        name: 'token',
        path: '/token',
        content: fn,
        access: 'public'
      }
    ],
    assets: assets || []
  };

  try {
    await serverlessClient.deployProject(deployOptions);
    cli.action.stop();
  } catch (e) {
    console.error('Something went wrong', e);
  }
}

module.exports = {
  getAppInfo,
  getPin,
  renew,
  getAssets,
  deploy,
  displayAppInfo,
  findApp
};
