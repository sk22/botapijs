const Handler = require('../lib/handler');
const Requirement = require('../lib/requirement');
const assert = require('chai').assert;

const log = (data) => {
  log.data.push(data);
};

const bot = {
  send: (data) => {
    log.bot.push(data);
  },
  log: {}
};
bot.log.info = bot.log.warn = bot.log.error = bot.log.http
  = bot.log.verbose = bot.log.silly = bot.log.silent = () => {};

let handler;

describe('Handler', () => {
  before((done) => {
    log.data = [];
    log.bot = [];
    done();
  });

  it('constructs using the reduced signature', (done) => {
    assert.isOk(new Handler('test', (d, data) => {
      console.log('test handler 1 triggered with data', data);
      d();
    }));
    done();
  });

  it('constructs using the full signature', (done) => {
    assert.isOk(new Handler({
      name: 'test2',
      callable: (d, data) => {
        console.log('test handler 2 triggered with data', data);
        d();
      }
    }));
    done();
  });

  it('throws an error when values are not given', (done) => {
    assert.throws(() => new Handler());
    done();
  });

  it('corrects invalid values', (done) => {
    handler = new Handler({
      name: 'dummy handler',
      requires: new Requirement('test requirement', (d, data) => {
        log(data);
        bot.send(`Received ${data}`);
        d();
      }),
      callable: (d, data) => {
        log(data);
        d();
      }
    });
    assert.equal(handler.name, 'dummyHandler', 'name gets camelCased');
    assert.isArray(handler.requires, 'requires gets converted to array');
    done();
  });

  describe('#handle()', () => {
    it('handles a handler not throwing an error', (done) => {
      handler.handle('foo', bot, (err) => {
        assert.isNotOk(err);
        done();
      });
    });

    it('executes the requirements and the callable', (done) => {
      assert(log.data.length === 2, 'log called two times');
      assert(log.data[0] === 'foo', "logged 'foo' twice");
      done();
    });
  });
});
