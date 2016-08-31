const assert = require('chai').assert;
const Bot = require('../lib/bot');
const Handler = require('../lib/handler');
const request = require('request');
let bot;

describe('Bot', () => {
  before((done) => {
    bot = new Bot(process.env.TGBOT_TESTBOT, { log: null });
    done();
  });

  it('registers a handler', (done) => {
    bot.register(new Handler('testHandler', (d, data) => {
      console.log('data received', data);
      d();
    }));
    done();
  });

  it('can listen on localhost:3000', (done) => {
    bot.listen(3000, 'localhost', () => {
      done();
    });
  });

  it('handles an http request', (done) => {
    request('http://localhost:3000', (err) => {
      assert.isNotOk(err);
      done();
    });
  });
});
