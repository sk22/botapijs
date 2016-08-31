/**
 * Preset Requirements
 * @module requires
 */

const Requirement = require('./requirement');
const camelCase = require('camelcase');

exports.parsers = require('./parsers');

/**
 * Checks if the data contains the nodes given,
 * e.g. `has('message', 'from', 'id')` checks if data has node `message.from.id`
 *
 * @param  {string[]}    nodes Array of node names
 * @return {Requirement}
 */
exports.has = (...nodes) => (new Requirement({
  name: camelCase('has', ...nodes),
  callable: (done, { data }) => {
    let before = data;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!(node in before)) {
        return done(true);
      }
      before = before[node];
    }
    return done(false);
  }
}));

/**
 * Check if node in data equals a given value,
 * e.g. `is(54231, 'message', 'from', 'id')` checks
 * if `message.from.id === 54321`
 *
 * @param  {*}           value The value to compare
 * @param  {string[]}    nodes The nodes that refer to the value
 * @return {Requirement}
 */
exports.is = (value, ...nodes) => (new Requirement({
  name: camelCase('is', ...nodes, value),
  requires: [exports.has(...nodes)],
  callable: (done, { data }) => {
    let before = data; // { message: { from: { id: 1234 } } }
    for (let i = 0; i < nodes.length; i++) {
      before = before[nodes[i]]; // { from: {} } -> { id: 1234 } -> 1234
    }
    return done(before !== value); // return true if values do not match
  }
}));
