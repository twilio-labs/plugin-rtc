/* global Twilio */
'use strict';

module.exports = async (context, event, callback) => {
  const { API_PASSCODE, API_PASSCODE_EXPIRY, DOMAIN_NAME } = context;

  const { passcode } = event;
  const [, appID, serverlessID] = DOMAIN_NAME.match(/-?(\d*)-(\d+)(?:-\w+)?.twil.io$/);

  let response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  if (Date.now() > API_PASSCODE_EXPIRY) {
    response.setStatusCode(401);
    response.setBody({
      error: {
        message: 'passcode expired',
        explanation:
          'The passcode used to validate application users has expired. Re-deploy the application to refresh the passcode.',
      },
    });
    return callback(null, response);
  }

  if (API_PASSCODE + appID + serverlessID !== passcode) {
    response.setStatusCode(401);
    response.setBody({
      error: {
        message: 'passcode incorrect',
        explanation: 'The passcode used to validate application users is incorrect.',
      },
    });
    return callback(null, response);
  }
};
