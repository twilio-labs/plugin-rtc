const verifyPasscode = jest.requireActual('../../../src/serverless/middleware/auth');

describe('the auth middleware', () => {
  it('should return an "unauthorized" error when the passcode is incorrect', () => {
    Date.now = () => 5;
    const mockCallback = jest.fn();
    verifyPasscode(
      { API_PASSCODE: '123456', API_PASSCODE_EXPIRY: '10', DOMAIN_NAME: 'video-app-1234-5678-dev.twil.io' },
      { passcode: '9876543210' },
      mockCallback
    );

    expect(mockCallback).toHaveBeenCalledWith(null, {
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
    const mockCallback = jest.fn();

    verifyPasscode(
      { API_PASSCODE: '123456', API_PASSCODE_EXPIRY: '10', DOMAIN_NAME: 'video-app-1234-5678-dev.twil.io' },
      { passcode: '12345612345678', user_identity: 'test identity' },
      mockCallback
    );

    expect(mockCallback).toHaveBeenCalledWith(null, {
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

  it('should not call the callback function when the passcode is correct and not expired', () => {
    Date.now = () => 5;
    const mockCallback = jest.fn();
    verifyPasscode(
      { API_PASSCODE: '123456', API_PASSCODE_EXPIRY: '10', DOMAIN_NAME: 'video-app-1234-5678-dev.twil.io' },
      { passcode: '12345612345678' },
      mockCallback
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });
});
