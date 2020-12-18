/* global Twilio Runtime */
'use strict';

// We need to use a newer twilio client than the one provided by context.getTwilioClient(),
// so we require it here. The version is specified in helpers.js in the 'deployOptions' object.
// TODO: replace with context.getTwilioClient() when https://issues.corp.twilio.com/browse/RUN-3731 is complete
const twilio = require('twilio');

module.exports.handler = async (context, event, callback) => {
  const authHandler = require(Runtime.getAssets()['/auth-handler.js'].path);
  authHandler(context, event, callback);

  let response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  const { room_sid, rules } = event;

  if (typeof room_sid === 'undefined') {
    response.setStatusCode(400);
    response.setBody({
      error: {
        message: 'missing room_sid',
        explanation: 'The room_sid parameter is missing.',
      },
    });
    return callback(null, response);
  }

  if (typeof rules === 'undefined') {
    response.setStatusCode(400);
    response.setBody({
      error: {
        message: 'missing rules',
        explanation: 'The rules parameter is missing.',
      },
    });
    return callback(null, response);
  }

  const client = twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);

  try {
    const recordingRulesResponse = await client.video.rooms(room_sid).recordingRules.update({ rules });
    response.setStatusCode(200);
    response.setBody(recordingRulesResponse);
  } catch (err) {
    response.setStatusCode(500);
    response.setBody({ error: { message: err.message, code: err.code } });
  }

  callback(null, response);
};
