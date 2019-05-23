const camelCaseKeys = require('camelcase-keys')
const isPlainObject = require('lodash/isPlainObject')
const isString = require('lodash/isString')
const snakeCase = require('lodash/snakeCase')

module.exports.camelCaseKeys = function(obj) {
  // Exclude the following keys. The cannot be converted to camelCase.
  const exclude = ['iso_639_1', 'iso_3166_1']
  return camelCaseKeys(obj, { deep: true, exclude })
}

/**
 * Converts parameter names to from camelCase to snake_case, with special
 * handling for suffixed values, such voteAverage_GTE.
 *
 * @example
 * deCamelCaseKey("voteAverage_GTE")
 * // => "vote_average.gte"
 */
function deCamelCaseKey(key) {
  if (!isString(key)) return key
  return key.split('_').map(snakeCase).join('.') // prettier-ignore
}

/**
 * Converts enum values into the format used by the REST API.
 * @example
 * transformEnumValue('RELEASE_DATE__DESC')
 * // => 'release_date.desc'
 */
function transformEnumValue(value) {
  if (!isString(value)) return value
  return value.split('__') .map(snakeCase).join('.') // prettier-ignore
}

/**
 * Transforms query arguments to the format of the REST API.
 * @param {Object} args
 */
module.exports.deCamelCaseArgs = function deCamelCaseArgs(args) {
  if (!args) return null
  return Object.entries(args).reduce((result, [key, value]) => {
    if (isPlainObject(value)) {
      value = deCamelCaseArgs(value)
    } else if (key === 'sortBy') {
      value = transformEnumValue(value)
    }
    return { ...result, [deCamelCaseKey(key)]: value }
  }, {})
}
