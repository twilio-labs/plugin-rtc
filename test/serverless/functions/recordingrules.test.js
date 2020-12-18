const { handler } = require('../../../src/serverless/functions/recordingrules');
const twilio = require('twilio');

const mockUpdateFn = jest.fn(() => Promise.resolve('mockSuccessResponse'));

const mockClient = jest.fn(() => ({
  video: {
    rooms: jest.fn(() => ({
      recordingRules: {
        update: mockUpdateFn,
      },
    })),
  },
}));

jest.mock('twilio');
twilio.mockImplementation(mockClient);

describe('the recordingrules function', () => {
  it('should correctly respond when a room update is successful', async () => {
    const mockCallback = jest.fn();

    await handler(
      { ACCOUNT_SID: '1234', AUTH_TOKEN: '2345' },
      { room_sid: 'mockRoomSid', rules: 'mockRules' },
      mockCallback
    );

    expect(mockClient).toHaveBeenCalledWith('1234', '2345');
    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: 'mockSuccessResponse',
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
    });
  });

  it('should correctly respond when a room update is not successful', async () => {
    const mockCallback = jest.fn();
    const mockError = { message: 'mockErrorMesage', code: 123 };
    mockUpdateFn.mockImplementationOnce(() => Promise.reject(mockError));

    await handler(
      { ACCOUNT_SID: '1234', AUTH_TOKEN: '2345' },
      { room_sid: 'mockRoomSid', rules: 'mockRules' },
      mockCallback
    );

    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: { error: mockError },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 500,
    });
  });

  it('should return a "missing room_sid" error when the room_sid is absent', async () => {
    const mockCallback = jest.fn();

    await handler({ ACCOUNT_SID: '1234', AUTH_TOKEN: '2345' }, { rules: 'mockRules' }, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'missing room_sid',
          explanation: 'The room_sid parameter is missing.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 400,
    });
  });

  it('should return a "missing rules" error when the rules array is absent', async () => {
    const mockCallback = jest.fn();

    await handler({ ACCOUNT_SID: '1234', AUTH_TOKEN: '2345' }, { room_sid: 'mockSid' }, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, {
      body: {
        error: {
          message: 'missing rules',
          explanation: 'The rules parameter is missing.',
        },
      },
      headers: { 'Content-Type': 'application/json' },
      statusCode: 400,
    });
  });
});
