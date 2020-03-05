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
