/* global Twilio */
'use strict';

const AccessToken = Twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const MAX_ALLOWED_SESSION_DURATION = 14400;

module.exports.handler = async (context, event, callback) => {
  const { ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, ROOM_TYPE } = context;

  const authHandler = require(Runtime.getAssets()['/auth-handler.js'].path);
  authHandler(context, event, callback);

  const { user_identity, room_name, create_room = true } = event;

  let response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  if (typeof create_room !== 'boolean') {
    response.setStatusCode(400);
    response.setBody({
      error: {
        message: 'invalid parameter',
        explanation: 'A boolean value must be provided for the create_room parameter',
      },
    });
    return callback(null, response);
  }

  if (!user_identity) {
    response.setStatusCode(400);
    response.setBody({
      error: {
        message: 'missing user_identity',
        explanation: 'The user_identity parameter is missing.',
      },
    });
    return callback(null, response);
  }

  if (create_room) {
    const client = context.getTwilioClient();

    try {
      await client.video.rooms.create({ uniqueName: room_name, type: ROOM_TYPE });
    } catch (e) {
      // Ignore 53113 error (room already exists). See: https://www.twilio.com/docs/api/errors/53113
      if (e.code !== 53113) {
        response.setStatusCode(500);
        response.setBody({
          error: {
            message: 'error creating room',
            explanation: 'Something went wrong when creating a room.',
          },
        });
        return callback(null, response);
      }
    }
  }

  const token = new AccessToken(ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    ttl: MAX_ALLOWED_SESSION_DURATION,
  });
  token.identity = user_identity;
  const videoGrant = new VideoGrant({ room: room_name });
  token.addGrant(videoGrant);
  response.setStatusCode(200);
  response.setBody({ token: token.toJwt(), room_type: ROOM_TYPE });
  return callback(null, response);
};
