const async = require('async');
const deepFreeze = require('deep-freeze');

/**
 * Exists while a Handler is being processed. Contains all data a
 * {@link Handler} and {@link Requirement} might need and gets passed to all
 * Handlers and Requirements as the second parameter in their
 * {@link Callable~callable}
 *
 * @property {object}  data      Data to handle
 * @property {Bot}     bot       Bot that invoked the handling
 * @property {Handler} handler   Handler, containing its options, etc
 * @property {object}  params    Requirements' values
 * @property {string}  apiUrl    Request's passed API URL
 * @property {string}  route     Request's route
 * @property {this}    processor The processor itself, for use when destructing
 */
class Processor {
  constructor(object) {
    Object.assign(this, object);
    this.processor = this;
  }

  /**
   * Sends an update using the request's API URL instead of the bot's
   *
   * #### `this`
   *
   * ```
   * // wrong
   * (done, { send }) => {
   *   send('message', { text: "doesn't work!" });
   * }
   * ```
   *
   * The reason this given example doesn't work is that send is called from out
   * of the Processor object. Since the send method uses the Bot stored in the
   * Processor (which is normally located at `this`), a ReferenceError is
   * thrown.
   *
   * The following way, send is executed from within the processor object.
   * ```
   * // fix: call from the processor
   * (done, processor) => {
   *   processor.send('message', { text: 'works!' });
   * }
   * ```
   * ```
   * // fix: make use of that the processor object contains itself
   * (done, { data, processor }) => {
   *   processor.send('message', data.text)
   * }
   * ```
   * As stated in {@link Callable~callable}, when a normal function is used as
   * the callable instead of an arrow function, `this` is bound to the
   * Processor object, so that can also be used.
   * ```
   * // fix: call send from `this` in a normal function
   * function someCallable(done, { data }) {
   *   console.log('can still use the destructed processor to have easier' +
   *    'access to properties like', data);
   *   this.send('sendMessage', { text: 'works!' })
   * }
   * ```
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
  send(method, update, callback, options = {}) {
    try {
      this.bot.send(method, update, callback, Object.assign(options,
        { apiUrl: options.apiUrl || this.apiUrl }));
    } catch (err) {
      if (err instanceof ReferenceError) {
        throw new ReferenceError("The Bot's send method could not be called." +
          "Probably you didn't bind the Processor to the send method " +
          'properly. See the JSDoc for Processor#send for further' +
          'information.');
      } else {
        console.error(err);
      }
    }
  }

  /**
   * Handles the update data
   *
   * @param {Function} callback Called when Handler is done executing
   */
  handle(callback) {
    this.handler.prepareRequirements();
    this.params = {};

    // add parser requirement
    if (this.handler.parser !== null
      && (this.handler.parser || this.bot.parser)) {
      this.handler.requirements.unshift(this.handler.parser || this.bot.parser);
    }

    async.eachSeries(this.handler.requirements, (requirement, reqDone) => {
      // store the current requirement in the class to be accessible in the
      // requirement's callable
      this.requirement = requirement;
      // calls the requirement's callable
      // with (done, data, params, bot, options)
      requirement.callable.call(this, (err, reqParams, reqData) => {
        if (reqParams) this.params[requirement.name] = deepFreeze(reqParams);
        if (reqData) this.data = reqData;
        if (process.env.TGBOT_VERBOSE) {
          this.bot.log.info(`${this.bot.logPrefix} handler`,
            `Requirement '${requirement.name}' ` +
            (err ? 'failed' : 'succeeded'));
        }
        reqDone(err);
      }, this);
    }, (err) => {
      // gets called on done(true) or if all requirements are done
      // if any requirement did not pass, do not execute handler callback
      // else the handler itself gets finally called
      if (!err) this.handler.callable.call(this, callback, this);
      // call callback directly if one of requirements failed
      else callback(true);
    });
  }
}

module.exports = Processor;
