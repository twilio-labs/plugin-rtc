/* global Twilio */
'use strict';

// We need to use a newer twilio client than the one provided by context.getTwilioClient(),
// so we require it here. The version is specified in helpers.js in the 'deployOptions' object.
const twilio = require('twilio');

module.exports.handler = async (context, event, callback) => {
  const authHandler = require(Runtime.getAssets()['/auth-handler.js'].path);
  authHandler(context, event, callback);

  const client = twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);

  let response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  try {
    const recordingRulesResponse = await client.video
      .rooms(event.room_sid)
      .recordingRules.update({ rules: event.rules });
    response.setStatusCode(200);
    response.setBody(recordingRulesResponse);
  } catch (err) {
    response.setStatusCode(500);
    response.setBody({ error: { message: err.message, code: err.code } });
  }

  callback(null, response);
};
