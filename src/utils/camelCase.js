const _camelCaseKeys = require('camelcase-keys')

module.exports.camelCaseKeys = function camelCaseKeys(obj) {
  // Exclude the following keys. The cannot be converted to camelCase.
  const exclude = ['iso_639_1', 'iso_3166_1']
  return _camelCaseKeys(obj, { deep: true, exclude })
}
