'use strict';

const AccessToken = Twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const MAX_ALLOWED_SESSION_DURATION = 14400;

module.exports.handler = (context, event, callback) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, API_SECRET, API_EXPIRY } = context;

  const { user_identity, room_name, passcode } = event;

  let response = new Twilio.Response();

  if (Date.now() > API_EXPIRY) {
    response.setStatusCode(401);
    response.setBody({ type: 'expired' });
    callback(null, response);
    return;
  }

  if (API_SECRET !== passcode) {
    response.setStatusCode(401);
    response.setBody({ type: 'unauthorized' });
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
