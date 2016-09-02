const request = require('request');
const url = require('url');
const npmlog = require('npmlog');
const parsers = require('./parsers');
const async = require('async');
const dummy = require('dummy-object');
const Server = require('./server');
const Processor = require('./processor');

/**
 * Communicates with the API and executes Processors on incoming updates
 */
class Bot {

  /**
   * @param {object}      options
   * @param {?String}     options.apiUrl   URL to the bot's API or null if any
   *                                       request's url should be able to be
   *                                       used
   * @param {?Server}     [options.server] Server object, or null if no server
   *                                       should be set. Leave blank or pass
   *                                       undefined if the server should be
   *                                       generated automatically.
   * @param {string}      [options.route]  The default route: e.g. if url is
   *                                       https://bot.com/hook?url=https://...
   *                                       pass '/webhook'
   * @param {Requirement} [options.parser] The default parser. Used to parse the
   *                                       body from a HTTP request. As long as
   *                                       a Handler's parser option is not
   *                                       null, this Requirement will be added
   *                                       to all Handlers.
   * @param {?object}     [options.log]    Logger object containing npmlog's
   *                                       methods. Pass null to disable. If
   *                                       none is passed, npmlog will be used
   */
  constructor({ apiUrl, server, route, parser, log, verbose } = {}) {
    this.setApiUrl(apiUrl);

    // Set defaults
    this.route = route || /.*/;
    this.parser = parser || parsers.json;
    this.verbose = typeof verbose === 'boolean' ? verbose : false;
    if (log === null) {
      this.log = dummy;
    } else {
      this.log = log || npmlog;
    }

    if (server === undefined) {
      server = new Server(undefined, { log: this.log });
    }

    if (server !== null) this.setServer(server);

    this.handlers = {};
    this.logPrefix = 'bot';
  }

  /** @private */
  setServer(server) {
    this.server = server;
    server.addBot(this);
  }

  /**
   * Invokes the server's listen method
   *
   * @param {number} port Port to listen on
   * @param {string} host Hostname for the server
   *
   * @see https://nodejs.org/api/http.html
   */
  listen(...args) {
    this.server.listen(...args);
  }

  /**
   * Verifys the value is valid and throws an error if it's not
   *
   * @private
   * @param {string|RegExp|null}
   */
  setApiUrl(value) {
    // value is set, but not a string
    if (value && typeof value !== 'string') {
      throw new Error('The passed API URL must be a string or RegExp or null ' +
        `and not ${typeof value}.`);
    }
    // apiUrl might also be null, allowing the bot to use any given url
    if (typeof value === 'string') {
      const parsed = url.parse(value);
      if (!parsed.host || !parsed.path) {
        throw new Error('Given API URL is invalid!');
      }
      if (parsed.path[parsed.path.length - 1] !== '/') {
        throw new Error("API URL must end with '/'");
      }
    }
    this.apiUrl = value || null;
  }

  /**
   * Handles the data received from the API
   *
   * @param {string}         data      The body supplied by the API
   * @param {string}         passedUrl URL supplied by the API
   * @param {string}         route     The request's route
   * @param {ServerResponse} res       Response to be sent to the API
   */
  handle(data, passedUrl, route, res) {
    if (this.verbose) {
      this.log.info(this.logPrefix, `Handling route '${route}'`);
    }

    if (this.apiUrl && passedUrl !== this.apiUrl) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end("API URL did not match with the bot's");
    }

    async.each(this.handlers, (handler, done) => {
      // check if route can be used
      if (this.checkRoute(route, handler.route || this.route)) {
        new Processor({ data, bot: this, handler, apiUrl: passedUrl, route })
          .handle((err) => {
            if (process.env.TGBOT_VERBOSE) {
              this.log.info(`${this.logPrefix} handler`,
                `Handler '${handler.name}' ${err ? 'failed' : 'succeeded'}`);
            }
            done();
          });
      } else {
        // call the callable if route is not usable
        done();
      }
    }, (err) => {
      if (err) this.log.error(err);
      res.end();
    });
  }

  /**
   * Checks if current http request's route is usable by the handler
   *
   * @private
   * @param {string}        current Current http request's route
   * @param {string|RegExp} route   Handler's route or Bot's default route
   */
  checkRoute(current, route) {
    if (route instanceof RegExp) {
      return route.test(current);
    }
    return route === current;
  }

  /**
   * Register handler
   *
   * @param {Handler} handler                Handler object
   * @param {object}  [options]              options for registering
   * @param {boolean} [options.forceReplace] Forces to replace Handler with same
   *                                         name
   */
  register(handler, options = {}) {
    this.log.info(this.logPrefix, `Registering handler '${handler.name}'`);
    if (options.forceReplace // force to proceed the replace
      || !this.handlers[handler.name] // or handler does not yet exist
      || this.handlers[handler.name].replaceable) { // or marked as replaceable
      // add an object with the key [handler.name] to the handlers object
      this.handlers[handler.name] = handler;
    } else {
      throw new Error(`The Handler ${handler.name} does already exist, ` +
        'is not marked as replaceable and the forceReplace option was not set');
    }
  }

  /**
   * Callback containing the API's response data
   *
   * @callback Bot~response
   * @param {object} error
   * @param {object} response
   * @param {String} body
   */

  /**
   * Sends an update to the API
   *
   * @param {string}       method           Is appended to the API's URL
   * @param {object}       update           The update object that should be
   *                                        sent
   * @param {Bot~response} callback         Callback containing error, response
   *                                        and body
   * @param {object}       [options]        Options object
   * @param {boolean}      [options.silent] Will not log the response if true
   * @param {string}       [options.apiUrl] Custom API URL
   */
  send(method, update, callback, { apiUrl, silent } = {}) {
    request({
      url: (apiUrl || this.apiUrl) + method,
      method: 'POST',
      json: update
    }, (err, res, body) => {
      if (!silent) this.log.http(this.logPrefix, 'Response', body);
      if (callback) callback(err, res, body);
    });
  }
}


module.exports = Bot;
