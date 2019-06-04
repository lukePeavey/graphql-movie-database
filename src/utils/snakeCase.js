const isPlainObject = require('lodash/isPlainObject')
const _snakeCase = require('lodash/snakeCase')

/**
 * A modified version of snakeCase that contains special handing for "suffixed"
 * property names (such as voteCount_GTE).
 *
 * @example
 * snakeCase('someValue') => 'some_value'
 * snakeCase('someValue_GTE') => 'some_value.gte'
 * snakeCase('someValue_LTE') => 'some_value.lte'
 * snakeCase('someValue_DESC') => 'some_value.desc'
 * snakeCase('someValue_ASC') => 'some_value.asc'
 * // Fixed: returns correct result if input is already snake_case
 * snakeCase('some_value') => 'some_value'
 * snakeCase('some_value.gte') => 'some_value.gte'
 */
function snakeCase(str) {
  return _snakeCase(str).replace(/_(gte|lte|desc|asc)$/, (_, m) => `.${m}`)
}

/**
 * Converts object keys to snake_case. This is used to convert query arguments
 * and inputs types from camelCase to snake_case.
 * @param {Object} args
 */
function snakeCaseKeys(obj) {
  if (!obj) return null
  return Object.entries(obj).reduce((result, [key, value]) => {
    const newValue = isPlainObject(value) ? snakeCaseKeys(value) : value
    return { ...result, [snakeCase(key)]: newValue }
  }, {})
}

module.exports = { snakeCase, snakeCaseKeys }
