const { handler } = require('../src/video-token-server');
const jwt = require('jsonwebtoken');

const callback = jest.fn();

const mockContext = {
  ACCOUNT_SID: 'AC1234',
  TWILIO_API_KEY_SID: 'SK1234',
  TWILIO_API_KEY_SECRET: '123456',
  API_PASSCODE: '123456',
  API_PASSCODE_EXPIRY: '10',
  DOMAIN_NAME: 'video-app-6789-dev.twil.io',
};

describe('the video-token-server', () => {
  it('should return an "unauthorized" error when the passcode is incorrect', () => {
    Date.now = () => 5;

    handler(mockContext, { passcode: '9876543210', user_identity: 'test identity' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'passcode incorrect',
          explanation: 'The passcode used to validate application users is incorrect.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 401,
    });
  });

  it('should return an "expired" error when the current time is past the API_PASSCODE_EXPIRY time', () => {
    Date.now = () => 15;

    handler(mockContext, { passcode: '1234566789', user_identity: 'test identity'}, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'passcode expired',
          explanation:
            'The passcode used to validate application users has expired. Re-deploy the application to refresh the passcode.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 401,
    });
  });

  it('should return a "missing user_identity" error when the "user_identity" parameter is not supplied', () => {
    Date.now = () => 5;

    handler(mockContext, { passcode: '1234566789' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'missing user_identity',
          explanation:
            'The user_identity parameter is missing.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 400,
    });
  });

  it('should return a token when no room_name is supplied', () => {
    Date.now = () => 5;

    handler(mockContext, { passcode: '1234566789',  user_identity: 'test identity' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: { token: expect.any(String) },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
    });

    expect(jwt.decode(callback.mock.calls[0][1].body.token)).toEqual({
      exp: 14400,
      grants: {
        identity: "test identity",
        video: {},
      },
      iat: 0,
      iss: 'SK1234',
      jti: 'SK1234-0',
      sub: 'AC1234',
    });
  });

  it('should return a valid token when passcode, room_name, and user_identity parameters are supplied', () => {
    Date.now = () => 5;
    handler(mockContext, { passcode: '1234566789', room_name: 'test-room', user_identity: 'test-user' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: { token: expect.any(String) },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
    });

    expect(jwt.decode(callback.mock.calls[0][1].body.token)).toEqual({
      exp: 14400,
      grants: {
        identity: 'test-user',
        video: {
          room: 'test-room',
        },
      },
      iat: 0,
      iss: 'SK1234',
      jti: 'SK1234-0',
      sub: 'AC1234',
    });
  });
});
