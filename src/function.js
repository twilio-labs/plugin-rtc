'use strict';

const AccessToken = Twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const MAX_ALLOWED_SESSION_DURATION = 14400;

module.exports.handler = (context, event, callback) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, API_SECRET, API_EXPIRY } = context;

  const { identity, roomName, passcode } = event;

  if (Date.now() > API_EXPIRY) {
    callback('expired');
    return;
  }

  if (API_SECRET !== passcode) {
    callback('unauthorized');
    return;
  }

  const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    ttl: MAX_ALLOWED_SESSION_DURATION
  });
  token.identity = identity;
  const videoGrant = new VideoGrant({ room: roomName });
  token.addGrant(videoGrant);
  callback(null, token.toJwt());
};
