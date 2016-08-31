const assert = require('chai').assert;
const Server = require('../lib/server');

describe('Server', () => {
  let server;
  before((done) => {
    server = new Server();
    done();
  });

  it('contains a valid http server object', (done) => {
    assert.isOk(server.server);
    done();
  });
});
