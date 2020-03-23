/* global Twilio */
'use strict';

const AccessToken = Twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const MAX_ALLOWED_SESSION_DURATION = 14400;

module.exports.handler = (context, event, callback) => {
  const {
    ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    API_PASSCODE,
    API_PASSCODE_EXPIRY,
    DOMAIN_NAME,
  } = context;

  const { user_identity, room_name, passcode } = event;
  const appID = DOMAIN_NAME.match(/-(\d+)(?:-\w+)?.twil.io$/)[1];

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
    callback(null, response);
    return;
  }

  if (API_PASSCODE + appID !== passcode) {
    response.setStatusCode(401);
    response.setBody({
      error: {
        message: 'passcode incorrect',
        explanation: 'The passcode used to validate application users is incorrect.',
      },
    });
    callback(null, response);
    return;
  }

  if (!user_identity) {
    response.setStatusCode(400);
    response.setBody({
      error: {
        message: 'missing user_identity',
        explanation: 'The user_identity parameter is missing.',
      },
    });
    callback(null, response);
    return;
  }

  const token = new AccessToken(ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    ttl: MAX_ALLOWED_SESSION_DURATION,
  });
  token.identity = user_identity;
  const videoGrant = new VideoGrant({ room: room_name });
  token.addGrant(videoGrant);
  response.setStatusCode(200);
  response.setBody({ token: token.toJwt() });
  callback(null, response);
};
