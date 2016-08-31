const url = require('url');
const http = require('http');
const body = require('body');
const npmlog = require('npmlog');
const dummy = require('dummy-object');

/**
 * Takes HTTP requests
 *
 * Example (in the main script):
 * ```
 * const server = new Server(somebot, someotherbot);
 * server.listen(80, 'localhost');
 * ```
 */
class Server {
  /**
   * @param {Function[]} [bots]        Bots whose handle method will be called
   *                                   on incoming requests
   * @param {object}     [options]
   * @param {object}     [options.log] npmlog-like logger; pass null to disable
   */
  constructor(bots = [], { log } = {}) {
    this.bots = bots;
    if (bots) {
      for (const bot of bots) {
        bot.setServer(this);
      }
    }

    if (log === null) {
      this.log = dummy;
    } else {
      this.log = log || npmlog;
    }

    // Creating HTTP server. Data is handled by this.request
    this.server = http.createServer((req, res) => this.request(req, res));
  }

  /**
   * Adds bots whose handle functions are called on HTTP requests
   *
   * @param {Bot} bot
   */
  addBot(bot) {
    this.bots.push(bot);
    bot.server = this;
  }

  /**
   * Executes the HTTP Server's listen method
   *
   * @param {number} port Port to listen on
   * @param {string} host Hostname for the server
   *
   * @see https://nodejs.org/api/http.html
   */
  listen(...args) {
    this.log.http('bot', `Server on app ${process.pid} started`);
    this.server.listen(...args);
  }


  /**
   * Receives HTTP requests from the API
   *
   * @param {IncomingMessage} req Request
   * @param {ServerResponse}  res Response
   */
  request(req, res) {
    if (req.method === 'POST') {
      const parts = url.parse(req.url, true);
      const route = parts.pathname;
      const passedUrl = parts.query && parts.query.url ? parts.query.url : '';

      this.log.http('server', `Request on route '${route}'`);

      body(req, (err, parsed) => {
        if (err) {
          this.log.error('server', 'Body parser error', err);
          return;
        }
        for (const bot of this.bots) {
          bot.handle(parsed, passedUrl, route, res);
        }
      });
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Nothing to do here!');
    }
  }
}

module.exports = Server;
