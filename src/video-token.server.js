'use strict';

const AccessToken = Twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const MAX_ALLOWED_SESSION_DURATION = 14400;

module.exports.handler = (context, event, callback) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, API_PASSCODE, API_PASSCODE_EXPIRY } = context;

  const { user_identity, room_name, passcode } = event;

  let response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  if (Date.now() > API_PASSCODE_EXPIRY) {
    response.setStatusCode(401);
    response.setBody({ error: 'expired' });
    callback(null, response);
    return;
  }

  if (API_PASSCODE !== passcode) {
    response.setStatusCode(401);
    response.setBody({ error: 'unauthorized' });
    callback(null, response);
    return;
  }

  const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    ttl: MAX_ALLOWED_SESSION_DURATION
  });
  token.identity = user_identity;
  const videoGrant = new VideoGrant({ room: room_name });
  token.addGrant(videoGrant);
  response.setBody({ token: token.toJwt() });
  callback(null, response);
};
