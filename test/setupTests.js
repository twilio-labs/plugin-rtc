class Response {
  constructor() {
    this.statusCode = null;
    this.body = null;
    this.headers = {};
  }

  setStatusCode(code) {
    this.statusCode = code;
  }

  setBody(body) {
    this.body = body;
  }

  appendHeader(key, value) {
    this.headers[key] = value;
  }
}

global.Twilio = require('twilio');
global.Twilio.Response = Response;

const verifyPasscodePath = `${__dirname}/../src/serverless/assets/verify_passcode.js`;

global.Runtime = {
  getAssets: () => ({
    '/auth-handler.js': {
      path: verifyPasscodePath,
    },
  }),
};

// Mocking this as a no-op since this function is tested in 'tests/serverless/assets/verify_passcode.ts'.
jest.mock(`${__dirname}/../src/serverless/assets/verify_passcode.js`, () => () => {});
