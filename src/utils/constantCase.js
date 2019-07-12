const snakeCase = require('lodash/snakeCase')

/**
 * Converts a string to constant case
 *
 * @example
 * constantCase('Behind The Scenes')
 * // => 'BEHIND_THE_SCENES'
 */
module.exports = function constantCase(str) {
  return snakeCase(str).toUpperCase()
}
