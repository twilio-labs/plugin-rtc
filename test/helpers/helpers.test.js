const { getPin } = require('../../src/helpers/helpers');
const assert = require('assert');

describe('#getPin()', function() {
    it('should return a 6 digit number', function() {
        assert(getPin().toString().length === 6)
    })
  })