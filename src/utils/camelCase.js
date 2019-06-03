const camelCaseKeys = require('camelcase-keys')
const isPlainObject = require('lodash/isPlainObject')
const isString = require('lodash/isString')
const _snakeCase = require('lodash/snakeCase')

module.exports.camelCaseKeys = function(obj) {
  // Exclude the following keys. The cannot be converted to camelCase.
  const exclude = ['iso_639_1', 'iso_3166_1']
  return camelCaseKeys(obj, { deep: true, exclude })
}

/**
 * Converts strings from camelCase to snake_case, with special handling for
 * suffixed values like "voteAverage_GTE"
 *
 * @examples
 * snakeCase("voteAverage_GTE")
 * // => "vote_average.gte"
 */
function snakeCase(str) {
  if (!isString(str)) return str
  return str.split('_').map(_snakeCase).join('.') // prettier-ignore
}

/**
 * Converts object keys to snake_case. This is used to convert query arguments
 * and inputs types from camelCase to snake_case.
 * @param {Object} args
 */
module.exports.snakeCaseKeys = function snakeCaseKeys(args) {
  if (!args) return null
  return Object.entries(args).reduce((result, [key, value]) => {
    const newValue = isPlainObject(value) ? snakeCaseKeys(value) : value
    return { ...result, [snakeCase(key)]: newValue }
  }, {})
}
