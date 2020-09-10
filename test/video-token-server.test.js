const { handler } = require('../src/video-token-server');
const jwt = require('jsonwebtoken');
const { set } = require('lodash');

const callback = jest.fn();

const mockCreateFunction = jest.fn();

const mockTwilioClient = set({}, 'video.rooms.create', mockCreateFunction);

const mockContext = {
  ACCOUNT_SID: 'AC1234',
  TWILIO_API_KEY_SID: 'SK1234',
  TWILIO_API_KEY_SECRET: 'api_secret',
  API_PASSCODE: '123456',
  API_PASSCODE_EXPIRY: '10',
  DOMAIN_NAME: 'video-app-1234-5678-dev.twil.io',
  ROOM_TYPE: 'group',
  getTwilioClient: () => mockTwilioClient,
};

describe('the video-token-server', () => {
  beforeEach(() => {
    Date.now = () => 5;
    mockCreateFunction.mockImplementation(() => Promise.resolve());
  });

  it('should return an "unauthorized" error when the passcode is incorrect', () => {
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

    handler(mockContext, { passcode: '12345612345678', user_identity: 'test identity' }, callback);

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

  it('should return an "invalid parameter" error when the create_room parameter is not a boolean', async () => {
    Date.now = () => 5;

    await handler(
      mockContext,
      { passcode: '12345612345678', user_identity: 'test identity', create_room: 'no thanks' },
      callback
    );

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'invalid parameter',
          explanation: 'A boolean value must be provided for the create_room parameter',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 400,
    });
  });

  it('should return a "missing user_identity" error when the "user_identity" parameter is not supplied', () => {
    handler(mockContext, { passcode: '12345612345678' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'missing user_identity',
          explanation: 'The user_identity parameter is missing.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 400,
    });
  });

  it('should return a token when no room_name is supplied', async () => {
    await handler(mockContext, { passcode: '12345612345678', user_identity: 'test identity' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: { token: expect.any(String), room_type: 'group' },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
    });

    expect(jwt.decode(callback.mock.calls[0][1].body.token)).toEqual({
      exp: 14400,
      grants: {
        identity: 'test identity',
        video: {},
      },
      iat: 0,
      iss: 'SK1234',
      jti: 'SK1234-0',
      sub: 'AC1234',
    });
  });

  describe('when passcode, room_name, and user_identity parameters are supplied', () => {
    it('should return a valid token', async () => {
      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user' },
        callback
      );

      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });

      expect(jwt.verify(callback.mock.calls[0][1].body.token, 'api_secret')).toEqual({
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

    it('should return a valid token when passcode when using an old form URL "video-app-XXXX-dev.twil.io', async () => {
      await handler(
        { ...mockContext, DOMAIN_NAME: 'video-app-1234-dev.twil.io' },
        { passcode: '1234561234', room_name: 'test-room', user_identity: 'test-user' },
        callback
      );

      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });

      expect(jwt.verify(callback.mock.calls[0][1].body.token, 'api_secret')).toBeTruthy();
    });

    it('should create a new room and return a valid token', async () => {
      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user' },
        callback
      );

      expect(mockCreateFunction).toHaveBeenCalledWith({ type: 'group', uniqueName: 'test-room' });
      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });

    it('should return a valid token without creating a room when "create_room" is false', async () => {
      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_room: false },
        callback
      );

      expect(mockCreateFunction).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });

    it('should return a valid token when passcode when the room already exists', async () => {
      mockCreateFunction.mockImplementation(() => Promise.reject({ code: 53113 }));

      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user' },
        callback
      );

      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });

    it('should return an error when there is a problem creating the room', async () => {
      mockCreateFunction.mockImplementationOnce(() => Promise.reject({ code: 12345 }));

      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user' },
        callback
      );

      expect(callback).toHaveBeenCalledWith(null, {
        body: {
          error: {
            explanation: 'Something went wrong when creating a room.',
            message: 'error creating room',
          },
        },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 500,
      });
    });
  });
});
