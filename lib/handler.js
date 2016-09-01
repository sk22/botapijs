const Callable = require('./callable');

/**
 * Used to handle updates
 *
 * @constructor
 * @description
 *   You can also use the other constructor styles stated in {@link Callable}.
 *
 * @param {object}           object                     Object or Handler name
 * @param {string}           object.name                Handler's name
 * @param {Handler~callable} object.callable            Handler's callable
 * @param {Requirement[]}    [object.requires]          Requirements
 * @param {object}           [object.options]           Handler's options object
 * @param {String|RegExp}    [object.route]             Route to handle
 * @param {Requirement}      [object.parser]            Parser Requirement to
 *                                                      use or null if none
 *                                                      should be used
 * @param {boolean}          [object.replaceable=false] Determines if the
 *                                                      Handler should be
 *                                                      allowed to be replaced
 *                                                      if a new Handler with
 *                                                      the same name is
 *                                                      registered.
 */
class Handler extends Callable {

  /**
   * @callback Handler~callable
   *
   * @param {Handler~done} done      Must be called from the callable when done
   * @param {Processor}    processor Processor object containing all relevant
   *                                 data
   *
   * @see Processor
   * @see Callable~callable
   */

  /**
   * @callback Handler~done
   *
   * @param {object} [error]
   * @param {object} [result]
   * @param {object} [data]
   */
}

module.exports = Handler;
