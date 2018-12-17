const fs = require('fs')
const path = require('path')
/**
 * Import graphQL files from the specified directory and combine
 * them into a string to be consumed by the `gql`function.
 * @note This is a temporary solution
 *
 * @param {string} dir the path to the directory containing graphql schema files
 * @return {string} the combined schema
 */
module.exports = function importSchema(dir) {
  return fs.readdirSync(dir).reduce((result, file) => {
    if (!/.(graphql|gql)$/.test(file)) return result
    return result + fs.readFileSync(path.join(dir, file))
  }, '')
}
