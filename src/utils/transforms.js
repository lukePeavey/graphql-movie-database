const pick = require('lodash/pick')
const capitalize = require('lodash/capitalize')
const upperCase = require('lodash/upperCase')

// Transforms the results of `person/{id}/combined_credits` to match
// `Credit` type in schema
module.exports.filmographyCredit = function filmographyCredit(result) {
  const creditFields = pick(result, ['character', 'job', 'department'])
  return { ...creditFields, media: result }
}

// Convert typename to `mediaType`
module.exports.toMediaType = function toMediaType(typename) {
  return /show/i.test(typename) ? 'TV' : upperCase(typename)
}

// Convert `mediaType` to typename
module.exports.toTypename = function toTypename(mediaType) {
  return /^(tv)$/i.test(mediaType) ? 'Show' : capitalize(mediaType)
}
