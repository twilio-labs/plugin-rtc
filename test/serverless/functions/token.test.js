const { handler } = require('../../../src/serverless/functions/token');
const jwt = require('jsonwebtoken');

const callback = jest.fn();

const mockFns = {
  fetchConversation: jest.fn(() => Promise.resolve({ sid: 'mockConversationSid' })),
  createConversation: jest.fn(() => Promise.resolve({ sid: 'newMockConversationSid' })),
  createParticipant: jest.fn(() => Promise.resolve({ sid: 'mockParticipantSid' })),
  createRoom: jest.fn(() => Promise.resolve({ sid: 'mockNewRoomSid' })),
  fetchRoom: jest.fn(() => Promise.resolve({ sid: 'mockRoomSid' })),
};

const mockConversationsClient = {
  conversations: jest.fn(() => ({
    fetch: mockFns.fetchConversation,
    participants: {
      create: mockFns.createParticipant,
    },
  })),
};

mockConversationsClient.conversations.create = mockFns.createConversation;

const mockTwilioClient = {
  video: {
    rooms: jest.fn(() => ({ fetch: mockFns.fetchRoom })),
  },
  conversations: jest.fn(),
};
mockTwilioClient.video.rooms.create = mockFns.createRoom;
mockTwilioClient.conversations.services = jest.fn(() => mockConversationsClient);

Date.now = () => 5;

const mockContext = {
  ACCOUNT_SID: 'AC1234',
  TWILIO_API_KEY_SID: 'SK1234',
  TWILIO_API_KEY_SECRET: 'api_secret',
  CONVERSATIONS_SERVICE_SID: 'MockServiceSid',
  ROOM_TYPE: 'group',
  getTwilioClient: () => mockTwilioClient,
};

describe('the video-token-server', () => {
  beforeEach(jest.clearAllMocks);

  describe("when a room and conversation doesn't already exist", () => {
    beforeEach(() => {
      mockFns.fetchRoom.mockImplementationOnce(() => Promise.reject());
      mockFns.fetchConversation.mockImplementationOnce(() => Promise.reject());
    });

    it('should create a new room and conversation, then return a valid token', async () => {
      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_conversation: true },
        callback
      );

      expect(mockFns.createRoom).toHaveBeenCalledWith({ type: 'group', uniqueName: 'test-room' });
      expect(mockFns.createConversation).toHaveBeenCalledWith({ uniqueName: 'mockNewRoomSid' });
      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });

    it('should return an error when there is a problem creating the room', async () => {
      mockFns.createRoom.mockImplementationOnce(() => Promise.reject({ code: 12345 }));

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

    it('should return an error when there is a problem creating the conversation', async () => {
      mockFns.createConversation.mockImplementationOnce(() => Promise.reject({ code: 12345 }));

      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_conversation: true },
        callback
      );

      expect(callback).toHaveBeenCalledWith(null, {
        body: {
          error: {
            explanation: 'Something went wrong when creating a conversation.',
            message: 'error creating conversation',
          },
        },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 500,
      });
    });
  });

  describe('when a room and conversation already exist', () => {
    it('should fetch the existing room and conversation, then return a valid token', async () => {
      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_conversation: true },
        callback
      );

      expect(mockTwilioClient.video.rooms).toHaveBeenCalledWith('test-room');
      expect(mockFns.fetchRoom).toHaveBeenCalled();
      expect(mockConversationsClient.conversations).toHaveBeenCalledWith('mockRoomSid');
      expect(mockFns.fetchConversation).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });
  });

  it('should return an error when there is a problem adding a participant to the conversation', async () => {
    mockFns.createParticipant.mockImplementationOnce(() => Promise.reject({ code: 12345 }));

    await handler(
      mockContext,
      { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_conversation: true },
      callback
    );

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          explanation: 'Something went wrong when creating a conversation participant.',
          message: 'error creating conversation participant',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 500,
    });
  });

  it('should ignore 50433 errors when adding a participant to the conversation', async () => {
    mockFns.createParticipant.mockImplementationOnce(() => Promise.reject({ code: 50433 }));

    await handler(
      mockContext,
      { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_conversation: true },
      callback
    );

    expect(callback).toHaveBeenCalledWith(null, {
      body: { token: expect.any(String), room_type: 'group' },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
    });
  });

  it('should create a conversations client with the correct conversations service', async () => {
    await handler(
      mockContext,
      { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_conversation: true },
      callback
    );

    expect(mockTwilioClient.conversations.services).toHaveBeenCalledWith('MockServiceSid');
  });

  it('should return an "invalid parameter" error when the create_room parameter is not a boolean', async () => {
    await handler(mockContext, { user_identity: 'test identity', create_room: 'no thanks' }, callback);

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

  it('should return an "invalid parameter" error when the create_conversation parameter is not a boolean', async () => {
    await handler(mockContext, { user_identity: 'test identity', create_conversation: 'no thanks' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'invalid parameter',
          explanation: 'A boolean value must be provided for the create_conversation parameter',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 400,
    });
  });

  it('should return a "missing user_identity" error when the "user_identity" parameter is not supplied', () => {
    handler(mockContext, {}, callback);

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

  it('should return a "missing room_name" error when the "room_name" parameter is not supplied when "create_room" is true', () => {
    handler(mockContext, { user_identity: 'mockIdentity' }, callback);

    expect(callback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'missing room_name',
          explanation: 'The room_name parameter is missing. room_name is required when create_room is true.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 400,
    });
  });

  it('should return a token when no room_name is supplied and "create_room" is false', async () => {
    await handler(mockContext, { user_identity: 'test identity', create_room: false }, callback);

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
        chat: {
          service_sid: 'MockServiceSid',
        },
      },
      iat: 0,
      iss: 'SK1234',
      jti: 'SK1234-0',
      sub: 'AC1234',
    });
  });

  describe('when passcode, room_name, and user_identity parameters are supplied', () => {
    it('should return a valid token', async () => {
      await handler(mockContext, { room_name: 'test-room', user_identity: 'test-user' }, callback);

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
          chat: {
            service_sid: 'MockServiceSid',
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

    it('should return a valid token without creating a room when "create_room" is false', async () => {
      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_room: false },
        callback
      );

      expect(mockFns.createRoom).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });

    it('should return a valid token without creating a conversation when "create_conversation" is false', async () => {
      await handler(
        mockContext,
        { passcode: '12345612345678', room_name: 'test-room', user_identity: 'test-user', create_conversation: false },
        callback
      );

      expect(mockFns.fetchConversation).not.toHaveBeenCalled();
      expect(mockFns.createConversation).not.toHaveBeenCalled();
      expect(mockFns.createParticipant).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(null, {
        body: { token: expect.any(String), room_type: 'group' },
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });

    it('should return a valid token when passcode when the room already exists', async () => {
      mockFns.createRoom.mockImplementation(() => Promise.reject({ code: 53113 }));

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
  });
});
