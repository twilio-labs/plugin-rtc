'use strict';

const AccessToken = Twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const MAX_ALLOWED_SESSION_DURATION = 14400;

module.exports.handler = (context, event, callback) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, API_SECRET, API_EXPIRY } = context;

  const { identity, roomName, passcode } = event;

  let response = new Twilio.Response();

  if (Date.now() > API_EXPIRY) {
    response.setStatusCode(401)
    response.setBody('expired')
    callback(null, response);
    return;
  }

  if (API_SECRET !== passcode) {
    response.setStatusCode(401)
    response.setBody('unauthorized')
    callback(null, response);
    return;
  }

  const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    ttl: MAX_ALLOWED_SESSION_DURATION
  });
  token.identity = identity;
  const videoGrant = new VideoGrant({ room: roomName });
  token.addGrant(videoGrant);
  response.setBody(token.toJwt())
  callback(null, response);
};
