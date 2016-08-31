/**
 * Requirements that parse the body before executing a Handler
 * @module parsers
 */

const Requirement = require('./requirement');

/**
 * @function
 * @param  {string} data Raw JSON string
 * @return {Requirement}
 */
exports.json = new Requirement('jsonParser', (done, { data }) => {
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch (err) {
    return done(err);
  }
  done(false, null, parsed);
});
