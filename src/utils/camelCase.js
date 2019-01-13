const camelCaseKeys = require('camelcase-keys')
const isPlainObject = require('lodash/isPlainObject')
const isString = require('lodash/isString')
const snakeCase = require('lodash/snakeCase')

module.exports.camelCaseKeys = function(obj, opts = {}) {
  if (!obj) return {}
  else return camelCaseKeys(obj, { deep: true, ...opts })
}

/**
 * Convert a string to snake_case, with special treatment for suffixed
 * strings, see example
 * @example
 * deCamelCase("releaseDate_DESC")
 * // => "release_date.desc"
 *
 * @param {*} input the value to transform
 */
function deCamelCase(input) {
  if (!isString(input)) return input
  return input.split('_').map(snakeCase).join('.') // prettier-ignore
}

/**
 * Recursively transform arguments to the format used by TMDB REST endpoints.
 * Transforms both keys and values.
 * @example
 * deCamelCaseArgs({ sortBy: "releaseDate_DESC" })
 * // => { sort_by: "release_date.desc" }
 *
 * @param {Object} args
 */
module.exports.deCamelCaseArgs = function deCamelCaseArgs(args) {
  return Object.keys(args).reduce((r, k) => {
    let value = isPlainObject(args[k]) ? deCamelCaseArgs(args[k]) : args[k]
    if (k === 'sortBy') value = deCamelCase(value)
    return { ...r, [deCamelCase(k)]: value }
  }, {})
}
